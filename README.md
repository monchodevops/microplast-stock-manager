<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Microplast Stock Manager — Sistema de Inventario Rotomoldeo

Aplicación web full-stack para gestión de inventario en una empresa de rotomoldeo de plásticos. Permite administrar materias primas, recetas de productos, órdenes de producción, stock de productos terminados y despachos (remitos).

Ver la app en AI Studio: https://ai.studio/apps/drive/1sQkXdYwfRpHAUJizVQ4Cv_sbg45TFYEK

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Descripción |
|---|---|---|
| **Angular** | 19.x | Framework principal — arquitectura de componentes standalone |
| **TypeScript** | ~5.6 | Lenguaje tipado que compila a JavaScript |
| **TailwindCSS** | latest | Framework CSS utilitario para estilos |
| **RxJS** | ~7.8 | Programación reactiva y manejo de eventos asíncronos |
| **Zone.js** | ~0.15 | Detección de cambios para Angular |

### Backend / Base de Datos
| Tecnología | Descripción |
|---|---|
| **Supabase** | Backend-as-a-Service: provee PostgreSQL + autenticación + API REST automática |
| **PostgreSQL** | Base de datos relacional (gestionada por Supabase) |

### Herramientas de Build y Desarrollo
| Tecnología | Versión | Descripción |
|---|---|---|
| **Vite** | ^6.0 | Servidor de desarrollo y bundler ultrarrápido |
| **@analogjs/vite-plugin-angular** | ^1.10 | Plugin que integra Angular con Vite |
| **Angular CLI** | ^19.0 | Herramientas de línea de comandos para Angular |

### Testing
| Tecnología | Versión | Descripción |
|---|---|---|
| **Vitest** | ^4.0 | Framework de unit testing compatible con Vite |
| **Happy DOM** | ^20.7 | Entorno DOM virtual para pruebas sin navegador |
| **@vitest/coverage-v8** | ^4.0 | Reporte de cobertura de código |

### Inteligencia Artificial
| Tecnología | Descripción |
|---|---|
| **Google Gemini API** | Integración de IA generativa a través de Google AI Studio |

---

## 🚀 Ejecutar Localmente

**Prerrequisitos:** Node.js

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar la variable `GEMINI_API_KEY` en el archivo [.env.local](.env.local) con tu clave de Google AI Studio.
3. Iniciar la aplicación:
   ```bash
   npm run dev
   ```

### Otros comandos disponibles
| Comando | Descripción |
|---|---|
| `npm run build` | Build de producción |
| `npm test` | Ejecutar tests unitarios |
| `npm run test:watch` | Tests en modo watch |
