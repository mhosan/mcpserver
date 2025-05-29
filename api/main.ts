import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// Async function to create and configure an MCP server instance
async function createAndConfigureMcpServer() {
  const server = new McpServer({
    name: 'MyServer',
    version: '1.0.0'
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Registrar la herramienta "pronostico"
  server.tool(
    "pronostico",
    { city: z.string().describe("Ciudad a consultar") },
    async ({ city }: { city: string }) => {
      console.log('Tool pronostico called with city:', city);
      if (!city) {
        throw new Error('Ciudad no especificada');
      }
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=es&format=json`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
         if (!weatherResponse.ok) {
            throw new Error(`HTTP error! status: ${weatherResponse.status}`);
        }
        const weatherData = await weatherResponse.json();
        console.log('Weather data fetched:', weatherData);
        return {
          content: [
            {
              type: 'text',
              text: weatherData
            },
          ],
        };
      } catch (error: any) { // Especificar 'any' para simplificar, o manejar tipos de error más específicos
        console.error('Error fetching weather data:', error);
         return {
            content: [
              {
                type: 'text',
                text: `Error al obtener el pronóstico para ${city}: ${error.message || error}`,
              },
            ],
          };
      }
    }
  );

  // Registrar la herramienta "echo"
  server.tool(
    "echo",
    { text: z.string().describe("Texto a hacer eco") }, // Cambiado de city a text, ya que es un eco genérico
    async ({ text }) => {
      console.log('*** Inicio de ejecución de la herramienta echo ***');
      console.log('Texto recibido en echo:', text);
      return {
        content: [
          {
            type: 'text',
            text: `Eco: ${text}`,
          },
        ],
      };
    }
  );

  // Registrar la herramienta "ping"
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

/**
 * 
 * Export the serverless function handler. Código adaptado para Vercel. Se eliminó Express
 * @param req 
 * @param res 
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('Vercel function handler received request.');
    console.log('Request Method:', req.method); // Aquí puedes ver el método

    // Opcional: Implementar manejo de métodos específicos si es necesario
    if (req.method !== 'POST') { // Asumiendo que solo POST es soportado para el protocolo MCP
        res.status(405).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Method not allowed' },
            id: req.body?.id || null // Intentar usar el ID si está en el cuerpo
        });
        return; // Terminar la ejecución para este método
    }

    try {
        console.log('Initializing MCP server and transport for this request...');
        // Initialize server and transport for each request in stateless mode
        const mcpServer = await createAndConfigureMcpServer();
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

        console.log('Connecting server to transport...');
        await mcpServer.connect(transport);
        console.log('Server connected to transport.');

        // Add a close listener to the response object
        res.on('close', () => {
            console.log('Vercel response closed. Closing transport and server.');
            // Close transport and server for this specific request
            transport.close();
            // Assuming mcpServer also has a close method if needed for cleanup
            // mcpServer.close();
        });

        console.log('Handling request with transport...');
        // Ensure req.body is available. VercelRequest typically includes a parsed body.
        const requestBody = req.body;

        await transport.handleRequest(req, res, requestBody);
        console.log('Request handling complete.');

    } catch (error: any) { // Especificar 'any' para simplificar
        console.error('Error handling request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                  code: -32603,
                  message: error.message || 'Internal server error'
                },
                id: req.body?.id || null
              });
        }
    }
}
