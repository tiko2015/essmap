# Huemul

### Huemul es un proyecto derivado de Vendure 3.0.

El objetivo de esta herramienta es generar catálogos de bienes y servicios de las organizaciones de la economía social, solidaria y popular.

## Plugins

### Organizations

Modelo de datos para el registro de organizaciones y buscador por proximidad.

-   Organizaciones

# Comandos para desarrollo

Levantar la base: `docker-compose up -d database`

Usar node v20.11.0 o superior

-   `npm install`: Instalar módulos.
-   `npm run fetch:essapp`: Importa las organizaciones de EssApp.
-   `npm run init:system`: Genera la base de datos y los datos iniciales.
-   `npm run dev`: Inicia el servidor de desarrollo.


Se puede correr `make huemul-dev` para inicializar la base de datos en docker y el servidor en dev.

# Actualizar Schema

```
npm run codegen
```

# Dashboard

```
npx vite
```