import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

//crear el servidor. Es la interfaz con el protocolo MCP entre el cliente y el servidor.
const server = new McpServer({
    name: 'MyServer',
    version: '1.0.0'
});

//hay diferentes cosas que puede tener un servidor MCP. Por ejemplo tools.
//tambien puede tener prompts y recursos.

