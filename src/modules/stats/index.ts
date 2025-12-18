import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

export const statsProviders = [StatsService];
export const statsControllers = [StatsController];
