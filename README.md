# Proyecto TypeScript con MCP y Zod

Este proyecto es una aplicación de ejemplo en TypeScript que utiliza:

- `@modelcontextprotocol/sdk` para crear un servidor MCP.
- `zod` para validación de entradas de usuario.

## Scripts principales

- Instalar dependencias:
  ```powershell
  npm install
  ```
- Ejecutar el proyecto:
  ```powershell
  npm start
  ```

## Estructura básica

- `main.ts`: Código principal del servidor MCP.
- `package.json`: Configuración del proyecto y dependencias.
- `package-lock.json`: Archivo de bloqueo de dependencias generado por npm.
- `.gitignore`: Archivos y carpetas ignorados por Git.

## Notas
- Tener Node.js y npm instalados.
- El archivo `.gitignore` ya está configurado para ignorar archivos innecesarios.
- Ejecutar Inspector para testear en local: 
```powershell
  npx -y @modelcontextprotocol/inspector npx -y tsx main.ts
```
- deploy en Vercel luego de eliminar 
- esto es una modificación 
