// Domain Entities
export { Material } from './entities/material';
export { ProductDefinition } from './entities/product-definition';
export type { ProductLayer } from './entities/product-definition';
export { FinishedGood } from './entities/finished-good';

// Value Objects
export { ProductionRequest, ProductionRequestWithProduct, ProductionSummary, MaterialAdjustment, MultiLayerProductionRequest, MultiLayerProductionRequestWithProduct } from './value-objects/production';
export { TransactionType, TransactionLog, LogFilter } from './value-objects/transaction';

// Domain Services
export { MaterialDomainService } from './services/material-domain.service';
export { ProductionDomainService } from './services/production-domain.service';
export { ProductDomainService } from './services/product-domain.service';
export type { ProductionEfficiency, RecommendationResult } from './services/production-domain.service';
export type { FinishedGoodGroup, ProductStatistics, PriceUpdate } from './services/product-domain.service';