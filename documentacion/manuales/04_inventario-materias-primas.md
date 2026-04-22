# Manual 04 — Inventario: Materias Primas

**Módulo:** Materias Primas  
**Dirigido a:** Todos los usuarios

---

## ¿Qué vas a aprender en este manual?

- Cómo ver el stock actual de materias primas
- Cómo interpretar los estados de stock (OK, Stock Bajo, Dado de baja)
- Cómo agregar kilogramos cuando llega material nuevo
- Cómo entender los umbrales de alerta

---

## 1. ¿Qué son las materias primas en este sistema?

En Microplast, la materia prima es el **material plástico** que se usa en el proceso de rotomoldeo. Cada color de plástico se gestiona como un ítem de inventario independiente.

El sistema registra:
- El **color** del material (ej: Blanco, Negro, Azul, Verde)
- El **stock actual** en kilogramos (kg)
- El **umbral de alerta** mínimo configurado

---

## 2. Acceder al módulo

1. En el menú lateral, hacé clic en **"Materias Primas"**

[Captura: tabla de materias primas con colores, stock y estado]

---

## 3. Ver el stock actual

La pantalla principal muestra una tabla con todos los colores registrados:

| Columna | Descripción |
|---------|-------------|
| **Color** | Nombre del color del material |
| **Stock actual (kg)** | Kilogramos disponibles en este momento |
| **Umbral de alerta (kg)** | Mínimo configurado; si el stock baja de este valor, se activa la alerta |
| **Estado** | Ver la siguiente sección para los posibles estados |

---

## 4. Estados de stock

Cada color tiene un estado que indica la situación de su inventario:

| Estado | Significado | Acción recomendada |
|--------|-------------|-------------------|
| ✅ **OK** | El stock está por encima del umbral mínimo | Ninguna, el stock es suficiente |
| ⚠️ **Stock Bajo** | El stock cayó por debajo del umbral de alerta | Reponer el material a la brevedad |
| ❌ **Dado de baja** | El color fue desactivado del sistema | No disponible para nuevas producciones |

> 💡 Los colores en estado "Stock Bajo" también aparecen como alertas en el Dashboard.

---

## 5. Agregar kilogramos (ingreso de material)

Cuando llega un lote nuevo de material, se debe registrar en el sistema:

1. En la tabla, ubicá el **color** del material que llegó
2. Hacé clic en el botón de agregar stock (ícono de "+" o "Agregar stock") de esa fila
3. En el campo que aparece, ingresá los **kilogramos a sumar** (no el total, sino lo que llegó)
4. Confirmá la operación

✅ El sistema sumará esa cantidad al stock actual de ese color.

[Captura: formulario de ingreso de kg abierto para un color]

> ⚠️ Ingresá la cantidad que **llegó en ese lote**, no el total acumulado. El sistema suma automáticamente.

**Ejemplo:**
- Stock actual de Azul: 80 kg
- Llegó un nuevo lote de 200 kg
- Ingresás: 200
- Stock nuevo de Azul: 280 kg

---

## 6. Umbrales de alerta

El umbral de alerta es el **mínimo de kg configurado** para cada color. Cuando el stock baja de ese valor, el sistema genera la alerta visible en el Dashboard.

> 🔒 La configuración de los umbrales de alerta es una tarea de **Administrador**. Si creés que el umbral de un color está mal configurado, solicitalo al administrador.

---

## 7. Errores frecuentes

| Situación | Causa probable | Solución |
|-----------|---------------|----------|
| Un color no aparece en la lista | No fue dado de alta o está dado de baja | Consultá con el administrador para que lo active |
| El stock bajó a 0 o está en negativo | Se registraron más producciones de las que el stock permitía | Agregar el stock faltante; contactar al administrador si el negativo es grande |
| Ingresé los kg equivocados | Error al cargar el ingreso de material | Contactar al administrador para ajustar el valor |

---

## Resumen rápido

| Tarea | Pasos |
|-------|-------|
| Ver el stock | Ir a "Materias Primas" → ver la tabla |
| Agregar kg al llegar material | Buscar el color → clic en "+" → ingresar kg del lote → confirmar |
| Ver si hay alertas | Ver la columna "Estado" o ir al Dashboard |
