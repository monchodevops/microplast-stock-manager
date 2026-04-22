# Manual 06 — Despacho: Crear Remito

**Módulo:** Despacho  
**Dirigido a:** Todos los usuarios

---

## ¿Qué vas a aprender en este manual?

- Para qué sirve el módulo de Despacho
- Cómo completar los datos del remito
- Cómo agregar productos al remito
- Cómo generar e imprimir el remito

---

## 1. ¿Para qué sirve el módulo de Despacho?

Cuando se envían productos a un cliente, se genera un **remito** que documenta la entrega. El sistema asigna automáticamente un **número correlativo** a cada remito y descuenta las unidades del inventario de productos terminados.

Al crear un remito, el sistema:
- Registra el envío con cliente, transportista y productos
- Asigna un número de remito único y correlativo
- **Descuenta** las unidades despachadas del inventario de productos terminados
- Guarda el remito en el historial para consulta y reimpresión futura

> ⚠️ Una vez creado, el remito no se puede modificar. Revisá bien los datos antes de confirmar.

---

## 2. Acceder al módulo

1. En el menú lateral, hacé clic en **"Despacho"**



---

## 3. Crear un remito — Paso a paso

### Paso 1: Completar los datos del encabezado

En la parte superior del formulario, completá:

| Campo | Descripción |
|-------|-------------|
| **Cliente / Razón** | Nombre del cliente o destino del despacho (ej: "Ferretería El Perno", "Obra Belgrano 1234") |
| **Repartidor / Transportista** | Nombre de la persona que realiza la entrega |


> 💡 El campo "Cliente / Razón" también acepta una descripción del motivo si no es un cliente registrado.

### Paso 2: Agregar productos al remito

En la sección de ítems del remito:

1. Buscá el producto a despachar en el campo de búsqueda de ítems
2. Seleccioná el producto y color correspondiente
3. Ingresá la **cantidad** a despachar
4. Hacé clic en **"Agregar"** para incluirlo en el remito


> 💡 Podés agregar tantos productos como necesites. Repetí el proceso para cada uno.

> ⚠️ No podés despachar más unidades de las que hay disponibles en stock. Si la cantidad pedida supera el stock, el sistema no permitirá agregar ese ítem.

### Paso 3: Revisar el remito

Antes de confirmar, revisá el resumen del remito:
- Los datos del encabezado (cliente y repartidor) son correctos
- Todos los productos y cantidades son los correctos
- No falta ningún ítem

Para eliminar un ítem del remito antes de confirmar, usá el botón "Eliminar" (ícono de papelera) de esa línea.

### Paso 4: Generar el remito

1. Una vez verificado todo, hacé clic en **"Generar Remito"** (o "Confirmar Despacho")
2. El sistema procesará el remito y mostrará el **número de remito asignado**
3. Aparecerá la opción de **imprimir** el remito

✅ El remito quedó generado y las unidades fueron descontadas del inventario.


---

## 4. Imprimir el remito

Inmediatamente después de generar el remito:

1. Hacé clic en **"Imprimir remito"**
2. Se abrirá una vista de impresión con el formato del remito
3. Usá la función de impresión del navegador (Ctrl+P o el botón que aparece en pantalla)
4. Seleccioná la impresora o guardá como PDF según corresponda

> 💡 Si no imprimís en el momento, podés reimprimir desde el [Historial de Remitos](07_historial-remitos.md) en cualquier momento.

---

## 5. Efecto en el inventario

| Acción | Efecto |
|--------|--------|
| Generar remito | Las unidades despachadas se descuentan del stock de productos terminados |
| El stock llega a 0 | El producto con 0 unidades sigue visible en el inventario pero no puede despacharse |

---

## 6. Errores frecuentes

| Situación | Causa probable | Solución |
|-----------|---------------|----------|
| No puedo agregar más unidades de las disponibles | El stock del producto es menor a lo pedido | Verificar el stock real; si hay más unidades, primero registrar la producción |
| Olvidé imprimir el remito | Cerré la pantalla sin imprimir | Ir a Historial de Remitos → buscar por número → reimprimir |
| Puse mal el nombre del cliente | El remito ya fue generado | Los remitos son definitivos; en caso de error grave, contactar al administrador |
| El botón "Confirmar" no está disponible | El formulario está incompleto | Verificar que cliente, repartidor y al menos 1 ítem estén cargados |

---

## Resumen rápido

| Paso | Acción |
|------|--------|
| 1 | Ir a "Despacho" en el menú |
| 2 | Completar Cliente y Repartidor |
| 3 | Buscar productos → ingresar cantidad → clic en "Agregar" |
| 4 | Repetir paso 3 para cada producto a despachar |
| 5 | Verificar el resumen y hacer clic en "Generar Remito" |
| 6 | Anotar el número de remito asignado e imprimir |
