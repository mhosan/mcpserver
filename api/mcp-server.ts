import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Async function to create and configure an MCP server instance
export async function createAndConfigureMcpServer() {
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
              text: JSON.stringify(weatherData, null, 2) // Ensure text is a string
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
