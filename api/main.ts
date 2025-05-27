import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// Crear el servidor MCP
const server = new McpServer({
  name: 'MyServer',
  version: '1.0.0',
});

// Definir la herramienta Pronostico
server.tool(
  'Test',
  'Pronostico del tiempo de una ciudad',
  {
    city: z.string().describe('Ciudad a consultar'),
  },
  async ({ city }: { city: string }) => {
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
      ],
    };
  }
);

// Configurar el transporte HTTP en modo sin estado
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // Modo sin estado
});

// Middleware para parsear JSON
const parseJsonBody = (req: VercelRequest): Promise<any> =>
  new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: { toString: () => string }) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        resolve(parsedBody);
      } catch (e) {
        resolve(null);
      }
    });
  });

// Conectar el servidor MCP al transporte (esto debe hacerse una sola vez)
let serverConnected = false;
const initializeServer = async () => {
  if (!serverConnected) {
    await server.connect(transport);
    serverConnected = true;
  }
};

// Exportar la función serverless para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Inicializar el servidor MCP si no está conectado
  await initializeServer();

  // Parsear el cuerpo de la solicitud
  let body = await parseJsonBody(req);

  // Log para depuración
  console.log('Body recibido:', JSON.stringify(body));
  // No hay método público para listar herramientas, pero podemos loguear el nombre de la herramienta registrada manualmente
  console.log('Herramienta registrada: Test');

  // Adaptar formatos simples a JSON-RPC si es necesario
  if (body && body.tool && body.input) {
    body = {
      jsonrpc: "2.0",
      id: 1,
      method: body.tool,
      params: body.input
    };
    console.log('Body adaptado a JSON-RPC:', JSON.stringify(body));
  }

  // Manejar la solicitud con el transporte MCP
  await transport.handleRequest(req, res, body);
}