import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';

function getServer() {
  const server = new McpServer({
    name: 'MyServer',
    version: '1.0.0'
  });

  server.tool(
    "pronostico",
    {
      title: "Pronóstico del tiempo",
      description: "Obtiene el pronóstico del tiempo para una ciudad",
      paramsSchema: z.object({
        city: z.string().describe("Ciudad a consultar")
      })
    },
    async (args) => {
      console.log('Tool called with args:', args);
      const { params } = args;
      const city = params.city;
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(weatherData, null, 2),
          },
        ],      };
    });
  
  return server;
}

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  try {
    console.log('Headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const server = getServer();
    console.log('Server created');
    
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    console.log('Transport created');
    
    res.on('close', () => {
      transport.close();
      server.close();
      console.log('Connection closed');
    });

    await server.connect(transport);
    console.log('Server connected to transport');
    
    await transport.handleRequest(req, res, req.body);} catch (error) {
    console.error('Error handling MCP request:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
          data: error instanceof Error ? error.stack : undefined
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed carajo!.' },
    id: null,
  });
});

app.delete('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed.' },
    id: null,
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});