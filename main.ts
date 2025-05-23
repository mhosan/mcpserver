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
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=es&format=json`);
        const data = await response.json();

        if (data.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No se encontro información para la ciudad ${city}`
                    }
                ]
            }
        }
        
        const { latitude, longitude} = data.results[0]
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,is_day,precipitation,is_day,rain&forecast_days=1`)
        const weatherData = await weatherResponse.json();
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(weatherData, null, 2)   
                }
            ]
        }
    }
)

//escuchar las conexiones de los clientes
const transport = new StdioServerTransport();//StdioServerTransport conecta tu servidor MCP con clientes usando la terminal, ideal para pruebas, desarrollo o integración con otros procesos
await server.connect(transport);
