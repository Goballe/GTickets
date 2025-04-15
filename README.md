# SupportDesk - Sistema de Gestión de Tickets

Un sistema de gestión de tickets de soporte técnico con funcionalidades avanzadas de control de acceso y seguimiento de incidencias.

## Características

- Sistema de autenticación con roles (usuario, agente, administrador)
- Gestión de tickets con prioridades y estados
- Seguimiento de SLA (Acuerdos de Nivel de Servicio) basado en la prioridad del ticket
- Dashboard con estadísticas y métricas de rendimiento
- Interfaz de usuario moderna y responsiva en español

## Estructura del Proyecto

- **client**: Frontend en React con TypeScript y Tailwind CSS
- **server**: Backend en Express.js
- **shared**: Esquemas y tipos compartidos entre frontend y backend

## Tecnologías Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js
- **Base de datos**: Almacenamiento en memoria (opción para PostgreSQL)
- **Autenticación**: Passport.js con sesiones
- **Estado de la aplicación**: TanStack Query (React Query)
- **Enrutamiento**: Wouter
- **Formularios**: React Hook Form y Zod

## Requisitos

- Node.js 20.x o superior
- npm 10.x o superior

## Inicio Rápido

### Desarrollo Local

1. Clonar el repositorio
2. Instalar las dependencias: `npm install`
3. Iniciar el servidor de desarrollo: `npm run dev`
4. Acceder a la aplicación en: http://localhost:5000

### Credenciales Predeterminadas

- **Usuario normal**: user / user123
- **Agente**: agent / agent123
- **Administrador**: admin / admin123

## Implementación en Producción

Para implementar este proyecto en un servidor de producción, consulta los siguientes archivos:

- [Instrucciones detalladas de implementación](./deploy-instructions.md)
- [Script de implementación automatizada](./deploy-script.sh)

### Compilar para Producción

```bash
npm run build
npm start
```

## Roles y Permisos

| Rol         | Permisos |
|-------------|----------|
| Usuario     | Crear tickets, ver sus propios tickets, añadir comentarios |
| Agente      | Todo lo anterior + cambiar estado de tickets, asignar tickets, ver métricas de rendimiento |
| Administrador | Todo lo anterior + gestionar usuarios, acceso a todas las métricas y configuraciones |

## Estados de Tickets

- **Abierto**: Ticket recién creado, pendiente de asignación
- **En progreso**: Ticket asignado y en proceso de resolución
- **En espera**: Ticket que requiere información adicional o acción del usuario
- **Cerrado**: Ticket resuelto y completado

## Prioridades y SLA

| Prioridad   | Tiempo de Respuesta |
|-------------|---------------------|
| Baja        | 72 horas            |
| Media       | 24 horas            |
| Alta        | 8 horas             |
| Crítica     | 4 horas             |

## Capturas de Pantalla

- Dashboard
- Lista de tickets
- Detalles de ticket
- Pantalla de administración

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.