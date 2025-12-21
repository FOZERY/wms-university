import { StockController } from './stock.controller';
import { StockService } from './stock.service';

export const stockProviders = [StockService];
export const stockControllers = [StockController];
