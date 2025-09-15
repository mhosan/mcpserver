# Servidor MCP para Vercel

Este proyecto implementa un servidor basado en el Protocolo de Contexto de Modelo (MCP), diseñado para funcionar como una función sin servidor en Vercel.

## Descripción General

El archivo `api/main.ts` configura y exporta un manejador de servidor HTTP que responde a las solicitudes del protocolo MCP. El servidor se inicializa de forma independiente para cada solicitud, lo que lo hace sin estado y adecuado para entornos de nube.

## Funcionalidades y Herramientas

El servidor expone un conjunto de herramientas que pueden ser invocadas por un cliente MCP:

### 1. `ping`
- **Descripción**: Una herramienta simple para verificar el estado y la conectividad del servidor.
- **Parámetros**: Ninguno.
- **Respuesta**: Devuelve la cadena de texto `"pong"`.

### 2. `echo`
- **Descripción**: Devuelve el texto que se le ha enviado. Es útil para pruebas y depuración.
- **Parámetros**:
  - `text` (string): El texto que se desea que el servidor repita.
- **Respuesta**: Devuelve el texto de entrada prefijado con `"Eco: "`.

### 3. `pronostico`
- **Descripción**: Proporciona el pronóstico del tiempo para una ciudad específica.
- **Parámetros**:
  - `city` (string): El nombre de la ciudad para la cual se desea obtener el pronóstico.
- **Proceso**:
  1. Utiliza la API de geocodificación de Open-Meteo para convertir el nombre de la ciudad en coordenadas (latitud y longitud).
  2. Con las coordenadas obtenidas, consulta la API de pronóstico de Open-Meteo.
  3. Devuelve los datos meteorológicos obtenidos.
- **Manejo de Errores**: Si la ciudad no se encuentra o si alguna de las APIs externas falla, la herramienta devuelve un mensaje de error informativo.

## Despliegue

El manejador está configurado para ser desplegado en Vercel. Incluye:
- Configuración de CORS para permitir solicitudes desde cualquier origen.
- Manejo de solicitudes `OPTIONS` (preflight).
- Procesamiento exclusivo de solicitudes `POST`, que es el método esperado para las llamadas del protocolo MCP.