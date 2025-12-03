import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { createAndConfigureMcpServer } from './mcp-server.js';

/**
 * 
 * Export the serverless function handler. Código adaptado para Vercel. Se eliminó Express
 * @param req 
 * @param res 
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS manualmente para serverless
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
