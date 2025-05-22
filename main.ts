import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

//crear el servidor. Es la interfaz con el protocolo MCP entre el cliente y el servidor.
const server = new McpServer({
    name: 'MyServer',
    version: '1.0.0'
});

//hay diferentes cosas que puede tener un servidor MCP. Por ejemplo tools.
//tambien puede tener prompts y recursos.
//las herramientas son funciones que el servidor puede ejecutar.
//los prompts son preguntas que el servidor puede hacer al cliente.
//los recursos son datos que el servidor puede enviar al cliente.
server.tool(
    'Pronostico',
    'Pronostico del tiempo de una ciudad',
    {
        city: z.string().describe('Ciudad a consultar')
    },
    async ({ city }) => {
        return {
            content: [
                {
                    type: 'text',
                    text: `El pronostico del tiempo para ${city} es soleado.`
                }
            ]
        }
    }
)

//escuchar las conexiones de los clientes
const transport = new StdioServerTransport();//StdioServerTransport conecta tu servidor MCP con clientes usando la terminal, ideal para pruebas, desarrollo o integración con otros procesos
await server.connect(transport);
