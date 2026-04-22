# Guía del Instructor — Microplast Stock Manager

**Capacitación operativa para usuarios finales**  
**Duración:** 1 hora a 1 hora 30 minutos  
**Ambiente:** Demo en vivo con práctica individual

---

## Antes de la sesión

### Preparación técnica
1. Verificar que el sistema esté disponible en la URL de producción
2. Tener un usuario de demostración con datos cargados (stock real o de prueba)
3. Confirmar que cada participante tiene usuario y contraseña activos
4. Si es virtual: preparar pantalla compartida con el sistema abierto
5. Tener la [Guía Rápida](../recursos/guia-rapida.md) lista para distribuir al final

### Datos de prueba recomendados
- Al menos 2–3 materias primas con stock cargado en distintos colores
- Al menos 2 productos terminados disponibles para un despacho de prueba
- Al menos 1 alerta de stock bajo activa (para mostrar un escenario real)

---

## Script por bloque

---

### Bloque 0 — Bienvenida (5 min)

**Qué decir:**
> "Bienvenidos a la capacitación del sistema Microplast Stock Manager. Este sistema nos va a permitir registrar todo lo que producimos, controlar el stock de materiales y productos, y generar los remitos de despacho de forma rápida y ordenada."

> "Hoy vamos a ver los módulos que van a usar en el día a día. Todo lo que tiene que ver con la configuración de productos y recetas lo vamos a ver en otra sesión aparte."

**Puntos clave a transmitir:**
- El sistema reemplaza/complementa los registros manuales
- Los datos que ingresen quedan guardados y son visibles por todo el equipo
- No hay riesgo de "romper" nada haciendo las prácticas de hoy

---

### Bloque 1 — Acceso y navegación (10 min)

**Demo paso a paso:**
1. Abrir el navegador e ingresar a la URL del sistema
2. Mostrar la pantalla de login
3. Ingresar usuario y contraseña en vivo
4. Señalar el menú lateral: Dashboard, Producción, Materias Primas, Productos Terminados, Despacho, Historial de Remitos
5. Mostrar cómo cerrar sesión (esquina superior/menú de usuario)

**Práctica individual (~5 min):**
> "Ahora cada uno inicia sesión con su usuario. Si tienen algún problema, me avisan."

**Errores comunes a anticipar:**
- Contraseña incorrecta → pedir que verifiquen mayúsculas/minúsculas
- No pueden ver algún módulo → verificar que el rol asignado sea correcto

**💡 Consejo:** Si algún participante olvidó su contraseña, mostrar el flujo de recuperación (link "Olvidé mi contraseña" en la pantalla de login).

---

### Bloque 2 — Dashboard (10 min)

**Demo paso a paso:**
1. Entrar al Dashboard desde el menú
2. Señalar cada KPI: total de materias primas en kg, total de productos terminados en unidades, cantidad de productos registrados
3. Mostrar las alertas de stock bajo si hay alguna activa → explicar qué significan y qué acción tomar
4. Mostrar el panel de actividad reciente: cada registro de producción, despacho o ajuste aparece listado acá

**Puntos clave a transmitir:**
- El Dashboard es la vista de "resumen rápido" — arranca acá cada vez que abrís el sistema
- Una alerta roja de stock bajo significa que hay que reponer ese material
- La actividad reciente permite ver quién hizo qué y cuándo

**Preguntas frecuentes que pueden surgir:**
- *"¿Por qué no me aparece el número actualizado?"* → El dashboard se actualiza en tiempo real; si el número no cambió, es porque la producción aún no se registró
- *"¿Qué pasa cuando hay stock bajo?"* → El sistema avisa, pero la decisión de reponer la toma el responsable de compras

---

### Bloque 3 — Producción (20 min)

**Demo paso a paso (~ 10 min):**
1. Navegar a "Producción" en el menú
2. Buscar y seleccionar un producto de la lista
3. Ver que aparece la cantidad de kg que consume por unidad (dato informativo)
4. Seleccionar el color del material a usar
5. Ingresar una cantidad (ej: 10 unidades)
6. Hacer clic en "Confirmar" o "Registrar producción"
7. Mostrar el mensaje de éxito
8. Ir al Dashboard → el stock de materias primas bajó, el de productos terminados subió

**Para productos multicapa (si aplica):**
> "Algunos productos, como los tanques bicapa o tricapa, piden que selecciones más de un color de material. El sistema te va a pedir un color por cada capa del producto."

**Práctica individual (~10 min):**
> "Ahora cada uno va a registrar una producción. Elijan el producto que más usan en su trabajo habitual, seleccionen el color del material y registren 10 unidades. Después fíjense en el inventario de productos terminados si aparecen esas 10 unidades nuevas."

**Errores comunes a anticipar:**
- Seleccionan el producto pero no el color → el botón de confirmar no está disponible hasta completar todos los campos
- No saben qué color usar → el color es el del material físico que cargaron en el molde ese día
- La práctica no modifica el inventario → probablemente no hicieron clic en "Confirmar"

**⚠️ Punto importante:** Una producción registrada no se puede borrar fácilmente. Pedirles que verifiquen los datos antes de confirmar.

---

### Bloque 4a — Inventario de Materias Primas (7 min)

**Demo paso a paso:**
1. Navegar a "Materias Primas" en el menú
2. Mostrar la tabla de colores con su stock actual en kg y el estado (OK / Stock Bajo / Dado de baja)
3. Mostrar cómo agregar kg a un color: hacer clic en el botón de agregar stock, ingresar cantidad, confirmar
4. Si hay estados de alerta, señalarlos y explicar qué significa cada uno

**Puntos clave:**
- Cuando reciben un lote de material nuevo, acá es donde lo registran
- El estado "Stock Bajo" se activa automáticamente cuando el kg disponible cae por debajo del umbral configurado

**Práctica rápida:**
> "Agreguen 50 kg al color que usen con más frecuencia."

---

### Bloque 4b — Inventario de Productos Terminados (8 min)

**Demo paso a paso:**
1. Navegar a "Productos Terminados" en el menú
2. Mostrar la tabla: producto, color, unidades, precio unitario, valor total
3. Usar el buscador para filtrar por nombre de producto
4. Mostrar cómo editar el precio unitario de un producto
5. Señalar la columna de valor total (unidades × precio unitario)

**Puntos clave:**
- Este inventario se actualiza automáticamente con cada producción registrada
- Los precios unitarios se actualizan acá cuando hay cambios de lista
- El valor total sirve para tener una idea del stock valuado

---

### Bloque 5 — Despacho y Remitos (15 min)

**Demo paso a paso (~ 10 min):**
1. Navegar a "Despacho" en el menú
2. Completar el encabezado:
   - **Cliente / Razón:** nombre del cliente o destino del despacho
   - **Repartidor / Transportista:** nombre de quien entrega
3. En la sección de ítems, buscar un producto terminado y seleccionarlo
4. Ingresar la cantidad a despachar
5. Añadir más ítems si aplica
6. Verificar el resumen del remito
7. Hacer clic en "Generar Remito" → el sistema asigna un número automático
8. Mostrar la opción de imprimir el remito
9. Navegar a "Historial de Remitos" → el remito recién creado aparece al tope

**Práctica individual (~5 min):**
> "Creen un remito de prueba con cliente 'TEST', su nombre como repartidor, y agreguen 2 productos cualesquiera. No hace falta imprimir."

**Puntos clave:**
- El número de remito lo asigna el sistema automáticamente y en orden correlativo
- Una vez creado, el remito descuenta automáticamente las unidades del inventario de productos terminados
- Desde el historial se puede reimprimir cualquier remito anterior

**Errores comunes a anticipar:**
- Dejan el campo "Cliente" vacío → el sistema no deja continuar
- Quieren modificar un remito ya creado → los remitos son definitivos; si hay error, crear uno nuevo de corrección

---

### Bloque 6 — Cierre y preguntas (5–15 min)

**Qué hacer:**
1. Proyectar la [Guía Rápida](../recursos/guia-rapida.md) y recorrerla brevemente
2. Recordar dónde están los manuales de cada módulo para consulta posterior
3. Abrir espacio de preguntas

**Frases de cierre sugeridas:**
> "Recuerden que tienen los manuales disponibles para consultar cuando tengan dudas. La guía rápida la pueden tener a mano en su escritorio."

> "Para la configuración de nuevos productos y recetas, eso lo vemos en otra sesión. Si tienen dudas sobre eso por ahora, me consultan a mí directamente."

---

## Preguntas frecuentes durante la capacitación

| Pregunta | Respuesta sugerida |
|---------|-------------------|
| "¿Qué pasa si registro una producción mal?" | Una vez confirmada no se puede editar. Si el error es grande, consultá con el administrador para hacer un ajuste manual. |
| "¿Puedo borrar un remito?" | No. Los remitos son registros definitivos. Si hubo un error, se registra un nuevo remito con la corrección. |
| "¿Por qué no veo todos los productos en Producción?" | Solo aparecen los productos con receta activa. Si falta alguno, hay que crearlo en Configuración (sesión de admin). |
| "¿El sistema funciona desde el celular?" | Sí, es accesible desde cualquier navegador en cualquier dispositivo. |
| "¿Cuándo se actualiza el Dashboard?" | En tiempo real. Cada vez que se registra una producción o un despacho, los números cambian. |
| "¿Puedo ver lo que hicieron otros usuarios?" | Sí, el historial de actividad reciente en el Dashboard muestra los últimos movimientos de todos los usuarios. |

---

## Notas post-sesión

- Distribuir los manuales digitales a todos los participantes
- Enviar la [Guía Rápida](../recursos/guia-rapida.md) para que la tengan impresa o guardada
- Anotar las preguntas que no pudiste responder en el momento para resolverlas después
- Agendar la sesión de administración (recetas) con los usuarios que lo necesiten
