export class SurrealExpression {	
	constructor(private _raw?: string) {
	}

	raw(str: string) {
		this._raw = str;
		return this;
	}

	_sql() {
		if (!this._raw) {
			throw new Error('Currently only raw expressions are supported.');
		}

		return this._raw;
	}
}

export function expression(...args: ConstructorParameters<typeof SurrealExpression>) {
	return new SurrealExpression(...args);
}