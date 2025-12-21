import { Body, Param, Query } from '@nestjs/common';
import { createValidatorPipe } from 'src/common/utils/typebox/pipes';
import { ValidatorOptions } from 'src/common/utils/typebox/validator';
import { TSchema } from 'typebox';

export function addConvert(options?: ValidatorOptions): ValidatorOptions {
	return { convert: true, ...options };
}

export function TypeboxBody(schema: TSchema, options?: ValidatorOptions): ParameterDecorator {
	return Body(createValidatorPipe(schema, options));
}

export function TypeboxQueries(schema: TSchema, options?: ValidatorOptions): ParameterDecorator {
	return Query(createValidatorPipe(schema, addConvert(options)));
}

export function TypeboxParams(schema: TSchema, options?: ValidatorOptions): ParameterDecorator {
	return Param(createValidatorPipe(schema, addConvert(options)));
}
