import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';

const app = express();
app.use(express.json());

// Async function to create and configure an MCP server instance
async function getMcpServer() {
  const server = new McpServer({
    name: 'MyServer',
    version: '1.0.0'
  });

  // Registrar la herramienta
  server.tool(
    "pronostico",
    "description: Obtiene el pronóstico del tiempo para una ciudad",
    {
      city: z.enum(["ciudad"])
    },
    async ({city}) => {
      console.log('Tool pronostico called with city:', city);
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
      console.log('Geocoding data:', data);
      const { latitude, longitude } = data.results[0];
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,is_day,precipitation,rain&forecast_days=1`
      );
      const weatherData = await weatherResponse.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(weatherData, null, 2),
          },
        ],
      };
    }
  );
  return server;
}


app.post('/mcp', async (req, res) => {
  try {
    // Create a new server instance for each request
    const server = await getMcpServer();
    const transport: StreamableHTTPServerTransport  = new StreamableHTTPServerTransport({ 
      sessionIdGenerator: undefined
    });
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
    await server.connect(transport);
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