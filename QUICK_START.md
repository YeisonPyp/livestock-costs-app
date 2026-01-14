# 🚀 Guía Rápida de Inicio

## ⚡ Inicio Rápido (3 pasos)

### 1. Instalar dependencias
```bash
cd livestock-costs-app
pnpm install
```

### 2. Configurar el backend
Edita `src/environments/environment.development.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',  // ← Tu URL del backend
  tokenKey: 'livestock_access_token',
  refreshTokenKey: 'livestock_refresh_token'
};
```

### 3. Ejecutar la aplicación
```bash
pnpm start
```

Abre tu navegador en: **http://localhost:4200**

---

## 🔐 Credenciales de Prueba

```
Usuario: yeison.admin
Contraseña: Admin123!
```

---

## 📂 Estructura del Proyecto

```
src/app/
├── core/              # Servicios singleton (API, Auth, Guards, Interceptors)
├── shared/            # Componentes reutilizables (Button, Table, Navbar)
├── features/          # Módulos de funcionalidad
│   ├── auth/          # Login y autenticación
│   ├── costs/         # Gestión de costos
│   └── categories/    # Gestión de categorías
└── layout/            # Layouts principales
```

---

## 🛠️ Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Ejecutar en desarrollo |
| `pnpm build` | Build de producción |
| `pnpm test` | Ejecutar tests |
| `pnpm lint` | Verificar código |

---

## 🎯 Rutas Principales

| Ruta | Descripción |
|------|-------------|
| `/auth/login` | Página de login |
| `/dashboard` | Dashboard principal |
| `/categories` | Listado de categorías |
| `/costs` | Listado de costos |

---

## 🔧 Próximos Pasos Recomendados

### 1. Implementar Formularios de Creación

**Categorías:**
```bash
# Crear componente de formulario
ng g c features/categories/components/category-form --standalone
```

**Costos:**
```bash
# Crear componente de formulario
ng g c features/costs/components/cost-form --standalone
```

### 2. Agregar Modal Reutilizable

Crear `src/app/shared/components/modal/modal.component.ts` para formularios en modales.

### 3. Implementar Árbol de Categorías

Usar una librería como `@angular/cdk/tree` o crear un componente recursivo personalizado.

### 4. Agregar Gráficos

Instalar Chart.js o ng2-charts:
```bash
pnpm add chart.js ng2-charts
```

### 5. Implementar Filtros Avanzados

Crear un componente de filtros con:
- Rango de fechas
- Selector de categorías
- Búsqueda por descripción

---

## 📚 Recursos Adicionales

- **Documentación Completa**: Ver `PROJECT_DOCUMENTATION.md`
- **Arquitectura**: Ver `arquitectura-frontend.md`
- **Angular Docs**: https://angular.dev
- **TailwindCSS**: https://tailwindcss.com/docs

---

## 🐛 Solución de Problemas

### Error: "Cannot find module '@angular/core'"
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: "Port 4200 is already in use"
```bash
pnpm start -- --port 4201
```

### Error de compilación de Tailwind
Verifica que `tailwind.config.js` exista y tenga la configuración correcta.

---

## 💡 Tips de Desarrollo

1. **Hot Reload**: Los cambios se reflejan automáticamente en el navegador
2. **DevTools**: Usa Angular DevTools extension para Chrome
3. **Debugging**: Usa `console.log()` o breakpoints en el navegador
4. **Formato**: Usa Prettier para formatear código automáticamente

---

## 🎨 Personalización de Estilos

### Cambiar colores principales

Edita `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',    // Azul
        secondary: '#6B7280',  // Gris
        danger: '#EF4444',     // Rojo
        success: '#10B981',    // Verde
      }
    }
  }
}
```

---

## 📞 Contacto y Soporte

Para dudas o problemas, contacta al equipo de desarrollo.

---

**¡Listo para desarrollar! 🚀**
