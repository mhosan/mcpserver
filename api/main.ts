import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Async function to create and configure an MCP server instance
async function getMcpServer() {
  const server = new McpServer({
    name: 'MyServer',
    version: '1.0.0'
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Registrar la herramienta
  server.tool(
    "pronostico",
    { city: z.string().describe("Ciudad a consultar") },
    async ({ city }) => {
      console.log('Tool pronostico called with city:', city);
      if (!city) {
        throw new Error('Ciudad no especificada');
      }
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=es&format=json`
      );
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No se encontró información para la ciudad ${city}`,
            },
          ],
        };
      }
      const { latitude, longitude } = data.results[0];
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,is_day,precipitation,rain&forecast_days=1`
      );
      const weatherData = await weatherResponse.json();
      console.log(weatherData);
      return {
        content: [
          {
            type: 'text',
            text: weatherData,
          },
        ],
      };
    }
  );

  server.tool(
    "echo",
    { city: z.string().describe("Ciudad a consultar") },
    async ({ city }) => {
      console.log('*** Inicio de ejecución de la herramienta echo ***');
      console.log('Ciudad recibida en echo:', city);
      return {
        content: [
          {
            type: 'text',
            text: `Eco: ${city}`,
          },
        ],
      };
    }
  );

  server.tool(
    "ping",
    {},
    async () => {
      console.log('Tool ping called');
      return {
        content: [
          {
            type: 'text',
            text: 'pong',
          },
        ],
      };
    }
  );

  return server;
}


app.post('/mcp', async (req, res) => {
  try {
    console.log('Creando instancia del servidor MCP y registrando herramientas...');
    const server = await getMcpServer();
    console.log('Instancia del servidor MCP creada y herramientas registradas.');

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    // Configurar el evento close antes de la conexión
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });

    console.log('conectar el server...');
    await server.connect(transport);
    console.log('Recibido req.body:', req.body);

    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error'
        },
        id: req.body?.id || null
      });
    }
  }
});

app.get('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null
  });
});

app.delete('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});