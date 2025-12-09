import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AnySchemaObject, ApiPropertyOptions, ApiSwaggerOptions } from 'src/common/swagger/types';

/**
 * Хелпер опций для ApiParam и ApiQuery
 */
function optProperty(
	property: string,
	schema: AnySchemaObject,
	required: string[] = []
): ApiPropertyOptions {
	return {
		description: schema.description,
		example: schema.example,
		explode: schema.explode,
		name: property,
		required: required.includes(property),
		schema: schema,
		style: schema.style,
	};
}

/**
 * Декоратор для описания сваггер-схем роутов
 */
// eslint-disable-next-line complexity
export function ApiSwagger(options: ApiSwaggerOptions): MethodDecorator {
	const { request, response } = options;
	const { body, params, queries } = request || {};

	const decorators: Array<MethodDecorator> = [];

	if (body) {
		decorators.push(ApiBody({ schema: body }));
	}

	if (params) {
		const required = params.required || [];

		for (const [property, schema] of Object.entries(params.properties)) {
			const optParam = optProperty(property, schema, required);

			decorators.push(ApiParam(optParam));
		}
	}

	if (queries) {
		const required = queries.required || [];

		for (const [property, schema] of Object.entries(queries.properties)) {
			const optQuery = optProperty(property, schema, required);

			decorators.push(ApiQuery(optQuery));
		}
	}

	if (response) {
		for (const [status, schema] of Object.entries(response)) {
			const optResponse = {
				description: schema.description,
				example: schema.example,
				schema: schema,
				status: Number(status),
			};

			decorators.push(ApiResponse(optResponse));
		}
	}

	return applyDecorators(...decorators);
}
