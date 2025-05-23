# Proyecto TypeScript con MCP y Zod

Este proyecto es una aplicación de ejemplo en TypeScript que utiliza:

- `@modelcontextprotocol/sdk` para crear un servidor MCP.
- `zod` para validación de entradas de usuario.

## Scripts principales

- Instalar dependencias:
  ```powershell
  pnpm install
  ```
- Ejecutar el proyecto:
  ```powershell
  pnpm start
  ```

## Estructura básica

- `main.ts`: Código principal del servidor MCP.
- `package.json`: Configuración del proyecto y dependencias.
- `pnpm-lock.yaml`: Archivo de bloqueo de dependencias generado por pnpm.
- `.gitignore`: Archivos y carpetas ignorados por Git.

## Notas
- Tener Node.js y pnpm instalados.
- El archivo `.gitignore` ya está configurado para ignorar archivos innecesarios.
- Ejecutar Inspector: 
```powershell
  npx -y @modelcontextprotocol/inspector npx -y tsx main.ts
```
