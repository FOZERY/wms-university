import { BadRequestException, PipeTransform } from '@nestjs/common';
import {
	CheckReturnType,
	TypeBoxValidator,
	TypeBoxValidatorError,
	ValidatorOptions,
} from 'src/common/utils/typebox/validator';
import { TSchema } from 'typebox';

export class TypeboxValidatorPipe<
	Schema extends TSchema,
	Options extends ValidatorOptions = ValidatorOptions,
> implements PipeTransform
{
	private readonly validator: TypeBoxValidator<Schema, Options>;

	public constructor(schema: Schema, options?: Options) {
		this.validator = new TypeBoxValidator(schema, options);
	}

	public transform(value: unknown): CheckReturnType<Schema, Options> {
		try {
			return this.validator.check(value);
		} catch (error: unknown) {
			if (error instanceof TypeBoxValidatorError) {
				throw new BadRequestException({
					errors: error.errors,
					message: error.message,
				});
			} else {
				throw new BadRequestException('Validation failed');
			}
		}
	}
}

export function createValidatorPipe<
	Schema extends TSchema,
	Options extends ValidatorOptions = ValidatorOptions,
>(schema: Schema, options?: Options): TypeboxValidatorPipe<Schema, Options> {
	return new TypeboxValidatorPipe(schema, options);
}
