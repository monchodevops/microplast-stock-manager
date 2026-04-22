# Manual 08 — Configuración y Recetas

> 🔒 **Este módulo es exclusivo para Administradores.**  
> La capacitación de este módulo se realiza en una **sesión separada**, guiada por el administrador del sistema. Este manual es material de apoyo para esa sesión.

---

**Módulo:** Configuración / Recetas  
**Dirigido a:** Administradores del sistema

---

## ¿Qué vas a aprender en este manual?

- Qué son las recetas de productos
- Cómo crear una nueva receta
- Cómo configurar productos multicapa (bicapa / tricapa)
- Cómo editar una receta existente
- Cómo gestionar los umbrales globales de alerta de materias primas

---

## 1. ¿Para qué sirve el módulo de Configuración?

Las **recetas** son las definiciones de cada producto: qué categoría tiene, cuántos kilogramos de material consume por unidad fabricada y, en el caso de los tanques, cuántas capas tiene y el consumo específico de cada capa.

Sin receta, un producto no puede ser seleccionado en el módulo de Producción.

---

## 2. Acceder al módulo

1. En el menú lateral, hacé clic en **"Configuración"** o **"Recetas"**

> 🔒 Este acceso solo está disponible para usuarios con rol Administrador. Si no ves este menú, tu usuario es de tipo Operador.


---

## 3. Crear una nueva receta

### Paso 1: Abrir el formulario de nueva receta

1. Hacé clic en el botón **"Nueva Receta"** o **"+ Agregar Producto"**

### Paso 2: Completar los datos básicos

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre del producto** | Nombre completo del artículo | "Tanque 1000L", "Tobogán Mediano" |
| **Categoría** | Tipo de producto | Tanques, Toboganes, Piscinas, Containers, etc. |
| **Consumo por unidad (kg)** | Kilogramos de material que requiere fabricar 1 unidad | 12.5 |

### Paso 3: Configurar capas (solo para Tanques)

Si el producto es un **Tanque**, podés definir si es monocapa, bicapa o tricapa:

**Monocapa (1 capa):**
- Solo tiene 1 color de material
- El consumo por unidad es el total de la receta

**Bicapa (2 capas):**
- Usa 2 colores de material distintos
- Configurar el **consumo de la Capa 1** (kg) y el **consumo de la Capa 2** (kg)
- La suma de ambas capas debe coincidir con el consumo total

**Tricapa (3 capas):**
- Usa 3 colores de material distintos
- Configurar el consumo de cada una de las 3 capas
- La suma de las 3 capas debe coincidir con el consumo total


> 💡 El consumo por capa se usa para descontar los kg de cada color específico cuando se registra una producción.

### Paso 4: Guardar la receta

1. Revisá que todos los campos estén completos
2. Hacé clic en **"Guardar"** o **"Crear Producto"**

✅ El nuevo producto ya estará disponible en el módulo de Producción para que los operadores lo usen.

---

## 4. Editar una receta existente

Si cambia el consumo por unidad de un producto o se ajusta la configuración de capas:

1. En el listado de recetas, buscá el producto a editar
2. Hacé clic en el botón de editar (ícono de lápiz)
3. Modificá los campos necesarios
4. Guardá los cambios

> ⚠️ Los cambios en el consumo de kg/unidad aplican a las **producciones futuras**. Las producciones ya registradas no se modifican.

---

## 5. Dar de baja una receta

Si un producto dejó de fabricarse:

1. En el listado de recetas, buscá el producto
2. Hacé clic en el botón de eliminar o "Dar de baja"
3. Confirmá la acción

> ⚠️ Dar de baja una receta hace que el producto deje de aparecer en el módulo de Producción. El historial de producciones y el stock existente no se borran.

---

## 6. Gestionar umbrales de alerta de materias primas

Desde la configuración también podés ajustar el **umbral mínimo de kg** de cada color de materia prima para las alertas del Dashboard.

1. En el módulo de Configuración, buscá la sección de **"Materias Primas"** o **"Alertas"**
2. Para cada color, ingresá el umbral mínimo en kg deseado
3. Guardá los cambios

Los cambios aplican de inmediato: si algún color ya está por debajo del nuevo umbral, aparecerá como alerta en el Dashboard.

---

## 7. Categorías de productos disponibles

Las categorías definen cómo se agrupan los productos en el sistema:

| Categoría | Ejemplos |
|-----------|---------|
| Tanques | Tanque 500L, Tanque 1000L, Tanque 2500L |
| Toboganes | Tobogán Pequeño, Tobogán Mediano |
| Piscinas | Piscina Infantil, Piscina Familiar |
| Containers | Container 200L |
| Otros | Cualquier producto que no encaje en las anteriores |

---

## 8. Errores frecuentes

| Situación | Causa probable | Solución |
|-----------|---------------|----------|
| Un producto no aparece en Producción | No tiene receta activa | Verificar en Configuración si el producto existe y está activo |
| El consumo de materia prima calculado parece incorrecto | El valor de consumo/unidad en la receta está mal cargado | Editar la receta y corregir el consumo |
| Las capas de un bicapa no consumen los colores correctos | Los consumos de capa están invertidos | Editar la receta y reorganizar los consumos de capa |

---

## Resumen rápido

| Tarea | Pasos |
|-------|-------|
| Crear producto nuevo | Configuración → "+ Nueva Receta" → completar datos → guardar |
| Editar receta existente | Configuración → buscar producto → editar → guardar |
| Configurar producto bicapa/tricapa | Al crear/editar → seleccionar N° de capas → ingresar consumo por capa |
| Ajustar umbral de alerta | Configuración → sección Materias Primas → modificar umbral del color → guardar |
| Dar de baja producto | Configuración → buscar producto → "Dar de baja" → confirmar |
