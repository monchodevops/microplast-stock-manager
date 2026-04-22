# Manual 05 — Inventario: Productos Terminados

**Módulo:** Productos Terminados  
**Dirigido a:** Todos los usuarios

---

## ¿Qué vas a aprender en este manual?

- Cómo ver el stock de productos fabricados
- Cómo buscar y filtrar productos
- Cómo actualizar el precio unitario de un producto
- Cómo interpretar el valor total del stock

---

## 1. ¿Qué son los productos terminados?

Los productos terminados son todos los artículos que ya fueron **fabricados y están disponibles para la venta o despacho**. El sistema registra cada combinación de producto + color como un ítem de inventario independiente.

Por ejemplo:
- Tanque 500L — Color Blanco: 25 unidades
- Tanque 500L — Color Azul: 10 unidades
- Tobogán Mediano — Color Amarillo: 8 unidades

---

## 2. Acceder al módulo

1. En el menú lateral, hacé clic en **"Productos Terminados"**

---

## 3. Ver el stock actual

La pantalla principal muestra una tabla con todos los productos terminados en stock:

| Columna | Descripción |
|---------|-------------|
| **Producto** | Nombre del producto (ej: Tanque 1000L) |
| **Color** | Color del material con el que fue fabricado |
| **Unidades** | Cantidad de unidades disponibles en stock |
| **Precio unitario** | Precio de venta por unidad |
| **Valor total** | Multiplicación de unidades × precio unitario |

> 💡 El inventario se actualiza automáticamente cada vez que se registra una producción o se despacha un remito.

---

## 4. Buscar y filtrar productos

Si tenés muchos productos, podés usar el **buscador** para encontrar rápidamente lo que necesitás:

1. En el campo de búsqueda (parte superior de la tabla), escribí el nombre del producto o el color
2. La tabla filtra automáticamente los resultados mientras escribís
3. Para ver todos los productos de vuelta, borrá el texto del buscador

---

## 5. Actualizar el precio unitario

Cuando cambia el precio de un producto, se debe actualizar en el sistema:

1. En la tabla, ubicá el producto cuyo precio querés actualizar
2. Hacé clic en el botón de editar (ícono de lápiz o "Editar precio") de esa fila
3. Ingresá el nuevo precio unitario
4. Confirmá el cambio

✅ El sistema actualizará el precio y recalculará automáticamente el valor total del stock.


> 💡 El precio unitario afecta únicamente el **valor de inventario** mostrado en el sistema. No genera documentos de venta ni facturas.

---

## 6. Valor total del stock

La columna **"Valor total"** muestra el resultado de multiplicar las unidades disponibles por el precio unitario configurado.

Sirve para tener una referencia del valor monetario del stock de cada ítem, pero no reemplaza a los documentos contables o de ventas.

> 💡 Si el precio unitario es cero (0), el valor total también será cero. Acordate de cargar los precios cuando se fabriquen nuevos productos.

---

## 7. Relación con otros módulos

| Módulo que genera el movimiento | Efecto en Productos Terminados |
|--------------------------------|-------------------------------|
| Producción | Suma unidades al stock |
| Despacho (Remito) | Resta unidades del stock |

---

## 8. Errores frecuentes

| Situación | Causa probable | Solución |
|-----------|---------------|----------|
| Un producto tiene 0 unidades | Se despachó todo el stock | Registrar una nueva producción si hay más fabricados |
| El valor total aparece en $ 0 | El precio unitario no fue cargado | Actualizar el precio unitario del producto |
| Un producto no aparece en la lista | Nunca se registró producción para ese producto/color | Registrar una producción primero |

---

## Resumen rápido

| Tarea | Pasos |
|-------|-------|
| Ver el stock | Ir a "Productos Terminados" → ver la tabla |
| Buscar un producto | Escribir en el campo de búsqueda |
| Actualizar precio | Buscar el producto → clic en editar → ingresar nuevo precio → confirmar |
| Ver el valor del stock | Ver la columna "Valor total" |
