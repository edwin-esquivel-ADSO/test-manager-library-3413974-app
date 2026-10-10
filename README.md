# test-manager-library-3413974-app

> **Prueba técnica · Ficha ADSO 3413974**  
> **Frontend:** React 18 + Vite  
> **Estilos:** Dark theme responsivo con Lucide Icons  

Este repositorio contiene el **Frontend** de *Manager Library*, diseñado para interactuar con la API REST (`/api/v1`) cumpliendo con las historias de usuario de `spec.md`.

## Vistas y Módulos Disponibles

1. **Autenticación (Login):** Inicio de sesión para administradores y bibliotecarios con manejo de token JWT y control de acceso por rol.
2. **Catálogo de Libros (HU-03, HU-04):** Búsqueda por texto y filtro por categoría en tiempo real. Registro de nuevos libros, edición de ejemplares y baja lógica.
3. **Socios (HU-05):** Registro de socios con documento único y listado con buscador.
4. **Préstamos (HU-06, HU-07, HU-08):** Registro dinámico de préstamos de 1 a 3 libros por 14 días. Visualización de estado calculado (`open`, `overdue`, `closed`) y acción de devolución por línea.
5. **Libros Vencidos (HU-09):** Listado operativo de préstamos en mora con cálculo de días de retraso.
6. **Gestión de Bibliotecarios (Admin - HU-02):** Panel dual con formulario de alta a la izquierda y tabla de bibliotecarios activos a la derecha con opción de baja.
7. **Reporte de Libros Más Prestados (Admin - HU-10):** Consulta interactiva por rango de fechas con tabla de libros agrupados por valores congelados (ADR-004).

## Requisitos y Puesta en Marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# 3. Compilar para producción
npm run build
```
