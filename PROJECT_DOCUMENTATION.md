# 🐄 Sistema de Costos Ganaderos - Frontend Angular 19

## 📋 Descripción del Proyecto

Sistema frontend desarrollado en **Angular 19** para la gestión y registro de costos en empresas ganaderas. Implementa una arquitectura empresarial escalable siguiendo las mejores prácticas de desarrollo.

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
livestock-costs-app/
├── src/
│   ├── app/
│   │   ├── core/                      # Servicios singleton y configuración global
│   │   │   ├── guards/                # Guards de autenticación
│   │   │   ├── interceptors/          # HTTP Interceptors
│   │   │   ├── services/              # Servicios core (API, Notifications, Loading)
│   │   │   └── models/                # Interfaces globales
│   │   │
│   │   ├── shared/                    # Componentes reutilizables
│   │   │   └── components/
│   │   │       ├── button/            # Botón configurable
│   │   │       ├── table/             # Tabla genérica
│   │   │       ├── loader/            # Loader global
│   │   │       └── navbar/            # Barra de navegación
│   │   │
│   │   ├── features/                  # Módulos de funcionalidad
│   │   │   ├── auth/                  # Autenticación
│   │   │   ├── costs/                 # Gestión de costos
│   │   │   └── categories/            # Gestión de categorías
│   │   │
│   │   └── layout/                    # Layouts de la aplicación
│   │       └── main-layout/
│   │
│   ├── environments/                  # Variables de entorno
│   └── styles.scss                    # Estilos globales
│
├── angular.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ o 22+
- pnpm (recomendado) o npm
- Angular CLI 19

### Pasos de Instalación

```bash
# 1. Navegar al directorio del proyecto
cd livestock-costs-app

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
# Editar src/environments/environment.development.ts con la URL de tu backend

# 4. Ejecutar en modo desarrollo
pnpm start

# 5. Abrir en el navegador
# http://localhost:4200
```

---

## 🔧 Configuración del Backend

Edita el archivo `src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',  // ← Cambia esto por tu URL
  tokenKey: 'livestock_access_token',
  refreshTokenKey: 'livestock_refresh_token'
};
```

---

## 🔐 Sistema de Autenticación

### Flujo de Login

1. Usuario ingresa credenciales en `/auth/login`
2. El sistema consume el endpoint `POST /api/v1/auth/login/`
3. Los tokens JWT se guardan en `localStorage`
4. El `AuthInterceptor` inyecta el token en cada request
5. El `AuthGuard` protege las rutas privadas

### Credenciales de Prueba

```json
{
  "identifier": "yeison.admin",
  "password": "Admin123!"
}
```

---

## 📦 Características Implementadas

### ✅ Core Features

- **Autenticación JWT** con access y refresh tokens
- **Guards** para protección de rutas
- **Interceptors** (Auth, Error, Loading)
- **Servicio de API** centralizado y tipado
- **Sistema de notificaciones** con ngx-toastr
- **Loader global** para estados de carga

### ✅ Componentes Reutilizables (Shared)

- **Button Component**: Botón configurable con variantes (primary, secondary, danger, success)
- **Table Component**: Tabla genérica con columnas dinámicas y paginación
- **Loader Component**: Indicador de carga global
- **Navbar Component**: Barra de navegación con información del usuario

### ✅ Features Implementados

#### 1. Autenticación (Auth)
- LoginComponent con validación de formularios
- AuthService con gestión de tokens
- Persistencia de sesión

#### 2. Dashboard
- Vista general de costos del mes
- Reporte mensual por categorías
- Tarjetas informativas

#### 3. Categorías
- Listado de categorías con tabla
- Estructura jerárquica (árbol de categorías)
- CRUD completo (servicios implementados)

#### 4. Costos
- Listado de costos con paginación
- Filtros por categoría y fecha
- Reportes y totales

---

## 🎨 Sistema de Diseño

### TailwindCSS

El proyecto utiliza **TailwindCSS 4** para los estilos. Todas las clases están disponibles en los componentes.

### Paleta de Colores

- **Primary**: Blue (bg-blue-600, text-blue-600)
- **Secondary**: Gray (bg-gray-600, text-gray-600)
- **Danger**: Red (bg-red-600, text-red-600)
- **Success**: Green (bg-green-600, text-green-600)

### Componentes Estilizados

Todos los componentes shared incluyen estilos predefinidos y son completamente responsivos.

---

## 📡 Integración con Backend

### Endpoints Implementados

#### Autenticación
- `POST /api/v1/auth/login/` - Login de usuario

#### Categorías
- `GET /api/v1/costs/categories/` - Listar categorías
- `GET /api/v1/costs/categories/{id}/` - Obtener categoría
- `GET /api/v1/costs/categories/tree/` - Árbol de categorías
- `POST /api/v1/costs/categories/` - Crear categoría
- `PUT /api/v1/costs/categories/{id}/` - Actualizar categoría
- `DELETE /api/v1/costs/categories/{id}/` - Eliminar categoría

#### Costos
- `GET /api/v1/costs/costs/` - Listar costos
- `POST /api/v1/costs/costs/` - Crear costo
- `GET /api/v1/costs/costs/total_month/` - Total del mes
- `GET /api/v1/costs/costs/total_by_category/` - Total por categoría
- `GET /api/v1/costs/costs/monthly_report/` - Reporte mensual

---

## 🧪 Testing

### Ejecutar Tests Unitarios

```bash
pnpm test
```

### Ejecutar Tests E2E

```bash
pnpm e2e
```

---

## 📦 Build para Producción

```bash
# Build de producción
pnpm build

# Los archivos se generan en dist/livestock-costs-app
```

---

## 🛠️ Scripts Disponibles

```json
{
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test"
}
```

---

## 📚 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Angular | 19.2.18 | Framework principal |
| TypeScript | 5.7+ | Lenguaje de programación |
| TailwindCSS | 4.1.18 | Framework de estilos |
| ngx-toastr | 19.1.0 | Sistema de notificaciones |
| RxJS | 7.8+ | Programación reactiva |
| pnpm | 10.28.0 | Gestor de paquetes |

---

## 🎯 Próximas Funcionalidades

- [ ] Formularios de creación/edición de categorías
- [ ] Formularios de creación/edición de costos
- [ ] Visualización de árbol de categorías
- [ ] Gráficos y reportes avanzados
- [ ] Exportación de datos (PDF, Excel)
- [ ] Filtros avanzados
- [ ] Modo oscuro
- [ ] PWA para uso offline

---

## 🔒 Seguridad

- Tokens JWT almacenados en `localStorage`
- Interceptor de autenticación automático
- Guards para protección de rutas
- Manejo de errores centralizado
- Validación de formularios

---

## 📖 Convenciones de Código

### Nomenclatura

- **Componentes**: PascalCase + Component suffix (`LoginComponent`)
- **Servicios**: PascalCase + Service suffix (`AuthService`)
- **Interfaces**: PascalCase + Interface suffix (`UserInterface`)
- **Variables**: camelCase (`currentUser`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)

### Estructura de Archivos

- Un componente por archivo
- Máximo 400 líneas por archivo
- Separar lógica compleja en servicios
- Componentes standalone (sin módulos)

---

## 👨‍💻 Arquitectura de Componentes

### Smart Components (Containers)
Manejan lógica de negocio y estado:
- `LoginComponent`
- `DashboardComponent`
- `CategoryListComponent`
- `CostListComponent`

### Presentational Components (Dumb)
Solo presentan datos:
- `ButtonComponent`
- `TableComponent`
- `LoaderComponent`
- `NavbarComponent`

---

## 🔄 Gestión de Estado

El proyecto utiliza **Services with BehaviorSubject** para la gestión de estado:

- `AuthService`: Estado de autenticación
- `LoadingService`: Estado de carga global
- `NotificationService`: Sistema de notificaciones

---

## 📞 Soporte

Para dudas o problemas, contacta al equipo de desarrollo.

---

## 📝 Licencia

Este proyecto es privado y confidencial.

---

**Desarrollado con ❤️ usando Angular 19**
