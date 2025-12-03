import express from 'express';
import { createAndConfigureMcpServer } from './mcp-server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const app = express();
const port = 3000;

// Ruta GET para verificación del servidor
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'MCP Server is running' });
});

app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'MCP API endpoint available at POST /api' });
});

app.post('/api', async (req, res) => {
    console.log('Local server received request');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);

    try {
        // Leer el stream del request
        const buffers = [];
        for await (const chunk of req) {
            buffers.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(buffers).toString());
        console.log('Body:', JSON.stringify(body, null, 2));

        const mcpServer = await createAndConfigureMcpServer();
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

        await mcpServer.connect(transport);
        console.log('Server connected to transport');

        // Manejar el cierre de la respuesta para cerrar el transporte
        res.on('close', () => {
            console.log('Response closed, closing transport');
            transport.close();
        });

        // Pasar el body parseado al transport
        await transport.handleRequest(req, res, body);
        console.log('Request handled');

    } catch (error) {
        console.error('Error handling request:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.listen(port, () => {
    console.log(`Local MCP server listening at http://localhost:${port}`);
    console.log(`MCP endpoint available at http://localhost:${port}/api`);
});
