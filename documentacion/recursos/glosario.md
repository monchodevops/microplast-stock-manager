# Glosario — Microplast Stock Manager

Definiciones de los términos usados en el sistema y en la documentación.

---

## A

**Actividad reciente**  
Panel del Dashboard que muestra las últimas 5 operaciones registradas en el sistema (producciones, despachos, ajustes de precio, etc.).

**Administrador (Admin)**  
Rol de usuario con acceso a todos los módulos del sistema, incluido el de Configuración de Recetas. Puede crear y editar productos, configurar umbrales de alerta y gestionar todos los datos del sistema.

**Agregar stock**  
Acción de sumar kilogramos a un color de materia prima en el inventario. Se realiza cuando llega un nuevo lote de material al depósito.

---

## B

**Bicapa**  
Tipo de producto fabricado con dos capas de material de distintos colores. Cada capa tiene un consumo de kg independiente definido en la receta del producto. Al registrar producción de un bicapa, se selecciona el color de cada capa.

---

## C

**Capa**  
División del material en un producto. Un producto monocapa usa un solo color; uno bicapa usa dos colores; uno tricapa usa tres. Cada capa tiene un consumo propio de kilogramos por unidad fabricada.

**Categoría**  
Clasificación de los productos en el sistema. Las categorías disponibles son: Tanques, Toboganes, Piscinas, Containers y Otros.

**Color**  
Identificador del plástico por su color (ej: Blanco, Azul, Negro, Verde). Cada color se gestiona como un ítem de inventario independiente en materias primas.

**Consumo por unidad (kg/unidad)**  
Cantidad de kilogramos de material que se necesitan para fabricar una unidad de un producto determinado. Este valor está definido en la receta del producto.

---

## D

**Dashboard**  
Pantalla principal del sistema. Muestra los indicadores clave (KPIs), alertas de stock bajo y el historial de actividad reciente.

**Despacho**  
Módulo del sistema para crear remitos y registrar las salidas de productos del depósito hacia clientes.

---

## I

**Inventario**  
Registro del stock actual de materias primas y productos terminados. El sistema mantiene el inventario actualizado automáticamente con cada producción y despacho registrado.

---

## K

**KPI (Key Performance Indicator)**  
Indicador clave. En el Dashboard, los KPIs son: total de materias primas en kg, total de productos terminados en unidades y cantidad de productos registrados en el sistema.

---

## M

**Materia prima**  
Material plástico utilizado en el proceso de rotomoldeo. Se almacena y gestiona por color, en kilogramos.

**Monocapa**  
Tipo de producto fabricado con una sola capa de material, es decir, un solo color. Es la configuración estándar de la mayoría de los productos.

---

## O

**Operador**  
Rol de usuario estándar. Tiene acceso a los módulos de Producción, Inventario (Materias Primas y Productos Terminados), Despacho e Historial de Remitos. No tiene acceso a la Configuración de Recetas.

---

## P

**Producto terminado**  
Artículo fabricado y disponible para la venta o despacho. Cada combinación de producto + color es un ítem de inventario independiente con su propio stock y precio unitario.

**Precio unitario**  
Precio de venta de una unidad de un producto terminado. Se ingresa manualmente en el módulo de Inventario de Productos Terminados.

---

## R

**Receta**  
Definición de un producto en el sistema: nombre, categoría, consumo de material por unidad y configuración de capas. Sin receta, un producto no puede ser seleccionado en el módulo de Producción.

**Remito**  
Documento que registra un despacho de productos a un cliente. Contiene número correlativo, fecha, datos del cliente, repartidor, listado de ítems con cantidades y monto total.

**Repartidor / Transportista**  
Persona responsable de entregar los productos al cliente. Dato requerido al crear un remito.

**Rotomoldeo**  
Proceso de fabricación por rotomoldeo centrífugo (rotational molding) utilizado por Microplast para fabricar productos plásticos huecos como tanques, toboganes y piscinas.

---

## S

**Stock**  
Cantidad de material o producto disponible en el depósito. Se mide en kilogramos para las materias primas y en unidades para los productos terminados.

**Stock Bajo**  
Estado de una materia prima cuyo stock actual cayó por debajo del umbral de alerta configurado. Se muestra como alerta en el Dashboard.

---

## T

**Tricapa**  
Tipo de producto fabricado con tres capas de material de distintos colores. Cada capa tiene su consumo de kg definido en la receta.

---

## U

**Umbral de alerta**  
Valor mínimo de kg configurado para un color de materia prima. Cuando el stock baja de este valor, se genera una alerta visible en el Dashboard.

---

## V

**Valor total (del inventario)**  
Resultado de multiplicar las unidades disponibles de un producto terminado por su precio unitario. Dato informativo visible en el módulo de Productos Terminados.
