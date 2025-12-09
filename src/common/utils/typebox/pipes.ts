import { PipeTransform } from '@nestjs/common';
import {
	CheckReturnType,
	TypeBoxValidator,
	ValidatorOptions,
} from 'src/common/utils/typebox/validator';
import { TSchema } from 'typebox';

export class TypeboxValidatorPipe<
	Schema extends TSchema,
	Options extends ValidatorOptions = ValidatorOptions,
> implements PipeTransform
{
	private readonly validator: TypeBoxValidator<Schema, Options>;

	constructor(schema: Schema, options?: Options) {
		this.validator = new TypeBoxValidator(schema, options);
	}

	public transform(value: unknown): CheckReturnType<Schema, Options> {
		return this.validator.check(value);
	}
}

export function createValidatorPipe<
	Schema extends TSchema,
	Options extends ValidatorOptions = ValidatorOptions,
>(schema: Schema, options?: Options): TypeboxValidatorPipe<Schema, Options> {
	return new TypeboxValidatorPipe(schema, options);
}
