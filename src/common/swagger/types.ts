import type { ApiParamOptions } from '@nestjs/swagger';

// biome-ignore lint/suspicious/noExplicitAny: any used for Swagger schema
export type AnySchemaObject = any;

// Локальное описание опций для ApiParam и ApiQuery
export type ApiPropertyOptions = ApiParamOptions;

export type ApiSwaggerOptions = {
	request?: {
		body?: AnySchemaObject;
		params?: {
			properties: Record<string, AnySchemaObject>;
			required?: string[];
		};
		queries?: {
			properties: Record<string, AnySchemaObject>;
			required?: string[];
		};
	};
	response?: Record<number, AnySchemaObject>;
};
