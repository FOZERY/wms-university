import { IsSchema, Static, StaticDecode, StaticEncode, TSchema } from 'typebox';
import { Compile, Validator } from 'typebox/compile';
import { DecodeUnsafe, EncodeUnsafe } from 'typebox/value';

export type ValidatorOptions = {
	clone?: boolean;
	clean?: boolean;
	defaults?: boolean;
	convert?: boolean;
} & (
	| { encode: true; decode?: never }
	| { encode?: never; decode: true }
	| { encode?: never; decode?: never }
);

export type CheckReturnType<T extends TSchema, Options extends ValidatorOptions> = Options extends {
	encode: true;
}
	? StaticEncode<T>
	: Options extends { decode: true }
		? StaticDecode<T>
		: Static<T>;

export type DefaultValidatorOptions = {
	clone: false;
	clean: true;
	convert: false;
	decode: true;
	defaults: true;
};

const defaultOptions: DefaultValidatorOptions = {
	clean: true,
	clone: false,
	convert: false,
	decode: true,
	defaults: true,
};

export class TypeBoxValidator<
	T extends TSchema,
	Options extends ValidatorOptions = DefaultValidatorOptions,
> {
	// biome-ignore lint/complexity/noBannedTypes: {} as default
	private readonly validator: Validator<{}, T>;

	private readonly options: Options;

	constructor(
		private readonly schema: T,
		options?: Options
	) {
		if (!IsSchema(schema)) {
			throw new TypeError('Invalid schema provided');
		}

		if (options?.encode && options?.decode) {
			throw new TypeError('Cannot use both encode and decode options simultaneously');
		}

		this.options = { ...defaultOptions, ...options } as Options;
		this.validator = Compile(schema);
	}

	public check(value: unknown): CheckReturnType<T, Options> {
		let processedValue = this.options?.clone ? structuredClone(value) : value;

		if (this.options?.clean) {
			processedValue = this.validator.Clean(processedValue);
		}

		if (this.options?.defaults) {
			processedValue = this.validator.Default(processedValue);
		}

		if (this.options?.convert) {
			processedValue = this.validator.Convert(processedValue);
		}

		if (this.options?.encode) {
			processedValue = EncodeUnsafe({}, this.schema, processedValue);
		}

		if (!this.validator.Check(processedValue)) {
			const errors = this.validator.Errors(processedValue);
			// todo: think
			throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
		}

		if (this.options?.encode) {
			return processedValue as CheckReturnType<T, Options>;
		}

		if (this.options?.decode) {
			processedValue = DecodeUnsafe({}, this.schema, processedValue) as StaticDecode<T>;
		}

		return processedValue as CheckReturnType<T, Options>;
	}
}
