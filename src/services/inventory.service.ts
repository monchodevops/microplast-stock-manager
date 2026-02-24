import { Injectable, signal, computed } from '@angular/core';
import { supabase } from './supabase.client';

export interface RawMaterial {
  id: string;
  colorName: string;
  currentStockKg: number;
  alertThresholdKg: number;
}

export interface ProductDefinition {
  id: string;
  name: string;
  consumptionPerUnitKg: number;
  category: string;
}

export interface FinishedGood {
  id: string;
  productDefinitionId: string;
  colorName: string;
  quantityUnits: number;
}

export interface ProductionLog {
  id: string;
  transactionType: 'INCOMING_MATERIAL' | 'PRODUCTION_RUN' | 'MANUAL_ADJUSTMENT';
  description: string;
  amountChange: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // Signals (State)
  readonly rawMaterials = signal<RawMaterial[]>([]);
  readonly products = signal<ProductDefinition[]>([]);
  readonly finishedGoods = signal<FinishedGood[]>([]);
  readonly logs = signal<ProductionLog[]>([]);

  // Computed Signals
  readonly lowStockAlerts = computed(() => {
    return this.rawMaterials().filter(m => m.currentStockKg <= m.alertThresholdKg);
  });

  readonly totalRawMaterialStock = computed(() => {
    return this.rawMaterials().reduce((acc, curr) => acc + curr.currentStockKg, 0);
  });

  readonly totalFinishedUnits = computed(() => {
    return this.finishedGoods().reduce((acc, curr) => acc + curr.quantityUnits, 0);
  });

  constructor() {
    this.loadData();
  }

  /**
   * Carga inicial de todos los datos desde Supabase
   */
  async loadData() {
    try {
      const [rmRes, prodRes, goodsRes, logsRes] = await Promise.all([
        supabase.from('raw_materials').select('*').order('color_name'),
        // FILTRO AGREGADO: .is('deleted_at', null) para traer solo productos activos
        supabase.from('product_definitions').select('*').is('deleted_at', null).order('name'),
        supabase.from('finished_goods_stock').select('*'),
        supabase.from('production_logs').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (rmRes.data) {
        this.rawMaterials.set(rmRes.data.map((d: any) => ({
          id: d.id,
          colorName: d.color_name,
          currentStockKg: d.current_stock_kg,
          alertThresholdKg: d.alert_threshold_kg
        })));
      }

      if (prodRes.data) {
        this.products.set(prodRes.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          consumptionPerUnitKg: d.consumption_per_unit_kg,
          category: d.category
        })));
      }

      if (goodsRes.data) {
        this.finishedGoods.set(goodsRes.data.map((d: any) => ({
          id: d.id,
          productDefinitionId: d.product_definition_id,
          colorName: d.color_name,
          quantityUnits: d.quantity_units
        })));
      }

      if (logsRes.data) {
        this.logs.set(logsRes.data.map((d: any) => ({
          id: d.id,
          transactionType: d.transaction_type,
          description: d.description,
          amountChange: d.amount_change,
          createdAt: new Date(d.created_at)
        })));
      }
    } catch (error) {
      console.error('Error cargando datos de Supabase:', error);
    }
  }

  // --- Actions (Async) ---

  async addRawMaterialStock(colorName: string, amountKg: number) {
    // 1. Check existing
    const existing = this.rawMaterials().find(m => m.colorName.toLowerCase() === colorName.toLowerCase());

    try {
      if (existing) {
        // Update
        await supabase
          .from('raw_materials')
          .update({ current_stock_kg: existing.currentStockKg + amountKg, last_updated: new Date() })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('raw_materials')
          .insert({
            color_name: colorName,
            current_stock_kg: amountKg,
            alert_threshold_kg: 100 // Default alert
          });
      }

      // Log transaction
      await supabase.from('production_logs').insert({
        transaction_type: 'INCOMING_MATERIAL',
        description: `Ingreso de materia prima: ${colorName}`,
        amount_change: amountKg
      });

      // Reload state
      await this.loadData();

    } catch (err) {
      console.error('Error agregando stock:', err);
    }
  }

  /**
   * Actualización Individual de Materia Prima (Corrección y Configuración)
   */
  async updateRawMaterial(id: string, newStockKg: number, newThresholdKg: number) {
    try {
      const oldData = this.rawMaterials().find(m => m.id === id);
      const diff = oldData ? newStockKg - oldData.currentStockKg : 0;

      // 1. Update Table
      const { error } = await supabase
        .from('raw_materials')
        .update({
          current_stock_kg: newStockKg,
          alert_threshold_kg: newThresholdKg,
          last_updated: new Date()
        })
        .eq('id', id);

      if (error) throw error;

      // 2. Log Adjustment if stock changed significantly (> 0.01kg)
      if (Math.abs(diff) > 0.01) {
        await supabase.from('production_logs').insert({
          transaction_type: 'INCOMING_MATERIAL', // Usamos un tipo existente o podríamos crear 'MANUAL_ADJUSTMENT' si modificamos el enum en DB
          description: `Ajuste manual de inventario (${oldData?.colorName})`,
          amount_change: diff
        });
      }

      await this.loadData();
    } catch (err) {
      console.error('Error actualizando materia prima:', err);
      throw err;
    }
  }

  /**
   * Ajuste Manual de Producto Terminado
   */
  async ajustarStockProductoTerminado(finishedGoodId: string, stockActual: number, nuevaCantidad: number, motivo: string) {
    try {
      const diferencia = nuevaCantidad - stockActual;

      if (diferencia === 0) {
        return { success: true, message: 'No hay cambios en el stock.' };
      }

      // Fetch the finished good to get the product details for the log
      const good = this.finishedGoods().find(g => g.id === finishedGoodId);
      if (!good) throw new Error('Producto terminado no encontrado en el estado local.');

      const productDef = this.products().find(p => p.id === good.productDefinitionId);
      const productName = productDef?.name || 'Desconocido';
      const colorName = good.colorName || 'Desconocido';

      // 1. Update Table
      const { error: updateError } = await supabase
        .from('finished_goods_stock')
        .update({
          quantity_units: nuevaCantidad
        })
        .eq('id', finishedGoodId);

      if (updateError) {
        throw new Error(`Error al actualizar el stock: ${updateError.message}`);
      }

      // 2. Log Adjustment 
      const { error: logError } = await supabase.from('production_logs').insert({
        transaction_type: 'MANUAL_ADJUSTMENT',
        description: `Ajuste [${productName} - ${colorName}]: ${motivo}`,
        amount_change: diferencia
      });

      if (logError) {
        // Critical error: Updated stock but failed to log.
        console.error('CRITICAL ERROR: Stock updated but failed to log transaction!', logError);
        // In a real application, we might alert a monitoring system here.
        // For now, we throw an error so the UI can notify the user of the partial failure.
        throw new Error('Stock actualizado, pero falló el registro de auditoría. Contacte a soporte.');
      }

      await this.loadData();
      return { success: true, message: 'Stock ajustado correctamente.' };
    } catch (err: any) {
      console.error('Error ajustando stock de producto terminado:', err);
      throw err;
    }
  }

  /**
   * Actualización Masiva de Alertas
   */
  async updateGlobalAlertThreshold(thresholdKg: number) {
    try {
      // Usamos un filtro "no igual a nulo" o similar para afectar a todos. 
      // Supabase requiere un WHERE por seguridad en updates cliente.
      // Asumimos que los IDs no son nulos.
      const { error } = await supabase
        .from('raw_materials')
        .update({ alert_threshold_kg: thresholdKg })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack seguro para "todos"

      if (error) throw error;
      await this.loadData();
    } catch (err) {
      console.error('Error actualizando alertas globales:', err);
      throw err;
    }
  }

  async updateProductDefinition(product: ProductDefinition) {
    try {
      const dbPayload = {
        name: product.name,
        category: product.category,
        consumption_per_unit_kg: product.consumptionPerUnitKg,
        deleted_at: null // Ensure it's active if we are saving/updating it
      };

      const { data, error } = await supabase
        .from('product_definitions')
        .upsert({ id: product.id, ...dbPayload })
        .select();

      if (error) throw error;
      await this.loadData();
    } catch (err) {
      console.error('Error guardando producto:', err);
    }
  }

  async deleteProduct(id: string) {
    try {
      // BORRADO LÓGICO: Actualizamos el campo deleted_at en lugar de borrar la fila
      const { error } = await supabase
        .from('product_definitions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await this.loadData();
    } catch (err) {
      console.error('Error borrando producto (lógico):', err);
      alert('Error al borrar el producto. Verifica la consola para más detalles.');
    }
  }

  /**
   * CORE LOGIC: Production Run (Async)
   */
  async runProduction(productId: string, colorName: string, quantity: number): Promise<{ success: boolean, message: string }> {
    // 1. Fresh Data Check (Optimistic local check is fine for UX, but should be careful)
    const product = this.products().find(p => p.id === productId);
    if (!product) return { success: false, message: 'Producto no encontrado.' };

    const material = this.rawMaterials().find(m => m.colorName === colorName);
    if (!material) return { success: false, message: `Color ${colorName} no disponible en materia prima.` };

    const totalNeededKg = quantity * product.consumptionPerUnitKg;

    if (material.currentStockKg < totalNeededKg) {
      return {
        success: false,
        message: `Stock insuficiente. Necesario: ${totalNeededKg.toFixed(2)}kg, Disponible: ${material.currentStockKg.toFixed(2)}kg`
      };
    }

    try {
      // 2. Perform DB Updates
      // Note: Ideally this would be a Postgres Transaction or RPC function to ensure atomicity.
      // For this implementation, we will chain them sequentially.

      // A. Deduct Material
      const { error: matError } = await supabase
        .from('raw_materials')
        .update({ current_stock_kg: material.currentStockKg - totalNeededKg })
        .eq('id', material.id);

      if (matError) throw matError;

      // B. Add Finished Good
      // Check if exists first
      const { data: existingGoods } = await supabase
        .from('finished_goods_stock')
        .select('*')
        .eq('product_definition_id', productId)
        .eq('color_name', colorName)
        .maybeSingle();

      if (existingGoods) {
        await supabase
          .from('finished_goods_stock')
          .update({ quantity_units: existingGoods.quantity_units + quantity })
          .eq('id', existingGoods.id);
      } else {
        await supabase
          .from('finished_goods_stock')
          .insert({
            product_definition_id: productId,
            color_name: colorName,
            quantity_units: quantity
          });
      }

      // C. Log Transaction
      await supabase.from('production_logs').insert({
        transaction_type: 'PRODUCTION_RUN',
        description: `Producción: ${quantity}u de ${product.name} (${colorName})`,
        amount_change: -totalNeededKg
      });

      // 3. Refresh Local State
      await this.loadData();

      return { success: true, message: 'Producción registrada con éxito.' };

    } catch (err: any) {
      console.error('Error en producción:', err);
      // In a real app, we might need to rollback here manually if step A succeeded but B failed.
      return { success: false, message: 'Error de base de datos: ' + (err.message || 'Desconocido') };
    }
  }

  // --- Production Reports Logic ---

  /**
   * Registra que se ha generado un nuevo reporte impreso.
   * Esto marca un nuevo "punto de corte" para el cálculo de novedades.
   */
  async registerProductionReport(): Promise<void> {
    try {
      const { error } = await supabase
        .from('production_report_logs')
        .insert({
          production_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          generated_at: new Date()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error registrando reporte de producción:', err);
      throw err;
    }
  }

  /**
   * Obtiene las estadísticas para el reporte de producción del día.
   * Calcula totales del día y "novedades" (delta) desde el último reporte impreso.
   */
  async getProductionReportStatistics() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Obtener último reporte generado hoy (para saber el punto de corte)
      const { data: lastReport } = await supabase
        .from('production_report_logs')
        .select('generated_at')
        .eq('production_date', today)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const cutoffTime = lastReport ? new Date(lastReport.generated_at) : new Date(`${today}T00:00:00`);

      // 2. Obtener logs de producción del día (Solo OUTPUTS / Producción realizada)
      // Buscamos transacciones de tipo 'PRODUCTION_RUN' creadas hoy
      // IMPORTANTE: Manejo de Timezones.
      // Si el usuario genera reporte el "2026-02-19" (Local), en UTC podría ser ya 20 por la hora.
      // Los registros en DB están en UTC.
      // ESTRATEGIA: Buscar un rango amplio que cubra "el día local" convertido a UTC.

      const now = new Date();
      // Inicio del día LOCAL convertido a UTC String
      const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      // Fin del día LOCAL convertido a UTC String
      const endLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const startOfDay = startLocal.toISOString();
      const endOfDay = endLocal.toISOString();

      console.log('Fetching logs between:', startOfDay, endOfDay);

      const { data: logs, error } = await supabase
        .from('production_logs')
        .select('*')
        .eq('transaction_type', 'PRODUCTION_RUN')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) {
        console.error('Error fetching production logs:', error);
        return [];
      }

      console.log('Logs found:', logs?.length, logs);

      if (!logs) return [];

      // 3. Procesar y Agrupar por Producto/Color
      // Estructura deseada: { key: "ProdId-Color", totalDay: 0, newSinceCutoff: 0, ...metadata }
      const statsMap = new Map<string, any>();

      for (const log of logs) {
        // Parsear descripción para extraer producto y color (Un poco frágil, idealmente guardaríamos IDs en logs o relational table)
        // Formato actual: "Producción: {quantity}u de {product.name} ({colorName})"
        // Regex simple para extraer. Si falla, agrupamos como "Desconocido".
        const quantity = Math.abs(log.amount_change / (this.getConsumptionPerUnit(log.description) || 1)); // Estimación reversa o parseo directo

        // Parsing más robusto basado en el texto del log actual:
        // "Producción: 10u de Maceta (Rojo)"
        const match = log.description.match(/Producción: (\d+)u de (.*?) \((.*?)\)/);

        if (match) {
          const qty = parseInt(match[1], 10);
          const prodName = match[2];
          const colorName = match[3];
          const key = `${prodName}-${colorName}`;
          const logTime = new Date(log.created_at);

          if (!statsMap.has(key)) {
            statsMap.set(key, {
              productName: prodName,
              colorName: colorName,
              totalDay: 0,
              newSinceCutoff: 0
            });
          }

          const entry = statsMap.get(key);
          entry.totalDay += qty;

          if (logTime > cutoffTime) {
            entry.newSinceCutoff += qty;
          }
        } else {
          console.warn('Could not parse log description:', log.description);
        }
      }

      const result = Array.from(statsMap.values());
      console.log('Report Stats Calculated:', result.length, result);
      return result;

    } catch (err) {
      console.error('Error calculando estadísticas de reporte:', err);
      return [];
    }
  }

  // Helper para revertir consumo (no ideal, pero funcional con el esquema actual de logs de texto)
  private getConsumptionPerUnit(description: string): number {
    // Intentar buscar el producto en memoria para sacar su consumo
    // Esto es un fallback si no podemos parsear la cantidad directa del string
    return 1;
  }
}