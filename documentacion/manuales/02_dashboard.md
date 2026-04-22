# Manual 02 — Panel Principal (Dashboard)

**Módulo:** Dashboard  
**Dirigido a:** Todos los usuarios

---

## ¿Qué vas a aprender en este manual?

- Qué información muestra el Dashboard
- Cómo interpretar los indicadores (KPIs)
- Cómo leer las alertas de stock bajo
- Cómo consultar la actividad reciente

---

## 1. ¿Qué es el Dashboard?

El Dashboard es la **pantalla principal** del sistema. Es lo primero que ves cuando iniciás sesión y te da un resumen del estado actual del inventario y de los últimos movimientos registrados.

Desde acá podés identificar rápidamente:
- Cuánto material hay disponible
- Cuántos productos terminados hay en stock
- Si hay algún material con stock bajo que deba reponerse
- Qué operaciones se realizaron recientemente

---

## 2. Indicadores principales (KPIs)

En la parte superior del Dashboard vas a ver tarjetas con los siguientes indicadores:

[Captura: tarjetas KPI del Dashboard]

### Total de Materias Primas
Muestra el **total acumulado en kilogramos** de todos los colores de material disponibles en el depósito.

> 💡 Este número suma todos los colores. Para ver el detalle por color, andá a **Materias Primas**.

### Total de Productos Terminados
Muestra la **cantidad total de unidades** de todos los productos fabricados disponibles en stock.

> 💡 Para ver el detalle por producto y color, andá a **Productos Terminados**.

### Productos Registrados
Indica cuántos productos (recetas) hay definidos en el sistema.

---

## 3. Alertas de stock bajo

Si algún material tiene su stock por debajo del umbral configurado, aparecerá una **alerta visible** en el Dashboard.

[Captura: sección de alertas con un material en stock bajo]

### ¿Cómo leer una alerta?

Cada alerta muestra:
- **Nombre del color** del material con stock bajo
- **Cantidad actual** en kg disponibles
- **Umbral configurado** (el mínimo aceptable)

### ¿Qué hacer ante una alerta?

1. Comunicar al responsable de compras que ese color está bajo
2. Una vez que llega el material, ingresar el stock en el módulo **Materias Primas**
3. La alerta desaparecerá automáticamente cuando el stock supere el umbral

> ⚠️ Las alertas no bloquean el sistema. Podés seguir registrando producciones aunque haya alertas activas, pero el sistema podría quedarse sin stock.

---

## 4. Actividad reciente

En la parte inferior del Dashboard hay un panel que muestra los **últimos 5 movimientos** registrados en el sistema.

[Captura: panel de actividad reciente]

Cada entrada del historial muestra:
- **Tipo de operación** (producción registrada, despacho, ajuste de precio, etc.)
- **Descripción** del movimiento (producto, cantidad, color)
- **Fecha y hora** del registro
- **Usuario** que realizó la operación (en algunos casos)

> 💡 Este panel sirve para verificar que las operaciones del día se registraron correctamente.

---

## 5. Navegación desde el Dashboard

Desde el Dashboard podés ir a cualquier módulo haciendo clic en el menú lateral. No necesitás volver siempre al Dashboard para navegar entre secciones.

---

## Resumen rápido

| Indicador | Qué muestra |
|-----------|-------------|
| Total de Materias Primas | Kg totales de todos los colores en stock |
| Total de Productos Terminados | Unidades totales de todos los productos en stock |
| Productos Registrados | Cantidad de productos definidos en el sistema |
| Alertas | Materiales por debajo del umbral mínimo configurado |
| Actividad Reciente | Últimas 5 operaciones realizadas en el sistema |
