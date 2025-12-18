import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

export const documentsProviders = [DocumentsService];
export const documentsControllers = [DocumentsController];
