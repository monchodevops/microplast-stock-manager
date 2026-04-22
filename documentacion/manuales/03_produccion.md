# Manual 03 — Producción

**Módulo:** Producción  
**Dirigido a:** Todos los usuarios

---

## ¿Qué vas a aprender en este manual?

- Cómo registrar una producción
- Cómo seleccionar el producto y el color del material
- Qué pasa en el inventario cuando confirmás una producción
- Cómo registrar producciones de productos multicapa (bicapa / tricapa)

---

## 1. ¿Para qué sirve el módulo de Producción?

Cada vez que se fabrica un lote de productos en planta, ese movimiento se registra en el sistema desde este módulo.

Al registrar una producción, el sistema automáticamente:
- **Descuenta** los kilogramos de materia prima correspondientes del inventario
- **Agrega** las unidades producidas al inventario de productos terminados
- **Registra** el movimiento en el historial de actividad

> ⚠️ Una producción registrada es definitiva. Verificá los datos antes de confirmar.

---

## 2. Acceder al módulo

1. En el menú lateral, hacé clic en **"Producción"**

[Captura: módulo de producción con el formulario vacío]

---

## 3. Registrar una producción — Paso a paso

### Paso 1: Seleccionar el producto

1. En el campo **"Producto"**, hacé clic para abrir la lista
2. Buscá y seleccioná el producto que fabricaste

> 💡 Al seleccionar el producto, podés ver cuántos kg de material consume por unidad. Este dato es informativo; el sistema lo calcula automáticamente.

### Paso 2: Seleccionar el color del material

1. En el campo **"Color"**, seleccioná el color del material plástico que usaste en la fabricación
2. El listado muestra los colores de materiales disponibles en stock

> 💡 El color que seleccionés es el color del producto terminado que va a quedar en el inventario.

### Paso 3: Ingresar la cantidad

1. En el campo **"Cantidad"**, ingresá el número de unidades fabricadas en este lote
2. Verificá que el número sea correcto antes de continuar

### Paso 4: Confirmar la producción

1. Revisá que todos los campos estén completos y correctos:
   - Producto correcto
   - Color correcto
   - Cantidad correcta
2. Hacé clic en **"Registrar Producción"** (o "Confirmar")
3. El sistema procesará el registro y mostrará un mensaje de confirmación

✅ Resultado: Las unidades se suman al inventario de productos terminados y el material se descuenta.

[Captura: formulario completo antes de confirmar]

---

## 4. Productos multicapa (Bicapa y Tricapa)

Algunos productos, como los **tanques**, pueden tener dos o tres capas de material de distintos colores. En estos casos, el formulario pedirá que selecciones el color para cada capa por separado.

### Producto Bicapa (2 colores)

El formulario mostrará **2 campos de color**:
- **Capa 1:** el primer color de material
- **Capa 2:** el segundo color de material

Debés seleccionar el color correspondiente a cada capa y luego ingresar la cantidad de unidades.

### Producto Tricapa (3 colores)

El formulario mostrará **3 campos de color**:
- **Capa 1:** primer color
- **Capa 2:** segundo color
- **Capa 3:** tercer color

> 💡 Si no sabés qué colores corresponden a cada capa, consultá la receta del producto con el encargado de producción o con el administrador del sistema.

[Captura: formulario con selección de 2 colores para producto bicapa]

---

## 5. Verificar el resultado

Después de confirmar la producción, podés verificar que se registró correctamente de dos formas:

**Opción A — Desde el Dashboard:**
- El total de productos terminados debe haber aumentado
- El total de materias primas debe haber disminuido

**Opción B — Desde el inventario:**
- Andá a **Productos Terminados** y buscá el producto que produjiste → las unidades aumentaron
- Andá a **Materias Primas** y buscá el color usado → los kg disminuyeron

---

## 6. Errores frecuentes

| Situación | Causa probable | Solución |
|-----------|---------------|----------|
| El botón "Confirmar" no está disponible | Algún campo obligatorio está vacío | Completar todos los campos (producto, color y cantidad) |
| El producto que busco no aparece en la lista | No tiene receta activa en el sistema | Consultá con el administrador para que lo cree en Configuración |
| El stock de materia prima queda en negativo | Se fabricaron más unidades de las que el stock de material permite | Primero cargar el material faltante en Materias Primas |
| Ingresé la cantidad equivocada y ya confirmé | La producción ya quedó registrada | Contactar al administrador para realizar un ajuste |

---

## Resumen rápido

| Paso | Acción |
|------|--------|
| 1 | Ir a "Producción" en el menú |
| 2 | Seleccionar el producto fabricado |
| 3 | Seleccionar el color del material (uno por capa si es multicapa) |
| 4 | Ingresar la cantidad de unidades producidas |
| 5 | Verificar los datos y hacer clic en "Registrar Producción" |
| 6 | Confirmar que el inventario se actualizó correctamente |
