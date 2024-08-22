import { AnyAuth, Surreal } from 'surrealdb.js';
import { z } from 'zod';
import { TableExistsError } from './errors';
import { SurrealTable } from './SurrealTable';

export class SurrealQueryBuilder {
	private query: string;

	constructor() {
		this.query = '';
	}
}

export namespace SurrealORM {
	export type infer<ST extends SurrealTable<any>> = {
    [K in keyof ST['fields']]: ST['fields'][K] extends SurrealExpressionWithSurrealFieldParent
        ? ST['fields'][K]['parent']
        : ST['fields'][K];
};

}

export class SurrealExpression {
	private _raw?: string;
	
	constructor() {
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

export class SurrealExpressionWithSurrealFieldParent extends SurrealExpression {
	constructor(public parent: SurrealField) {
		super();
	}
}

export type SurrealPermissions = {
	select?: SurrealExpression,
	create?: SurrealExpression,
	update?: SurrealExpression,
	delete?: SurrealExpression,
}

export abstract class SurrealField {
	protected _default?: SurrealExpressionWithSurrealFieldParent;
	protected _optional: boolean = false;
	protected _value?: SurrealExpressionWithSurrealFieldParent;
	protected _assert?: SurrealExpressionWithSurrealFieldParent;
	protected _permissions?: SurrealPermissions;
	protected _comment?: string;
	protected _overwrite: boolean = false;

	constructor(public schema: z.ZodType, public name?: string) {
	}

	default() {
		this._default = new SurrealExpressionWithSurrealFieldParent(this);
		return this._default;
	}

	comment(comment: string) {
		this._comment = comment;
		this.schema.describe(comment)
		return this;
	}

	optional() {
		this._optional = true;
		return this;
	}

	overwrite() {
		this._overwrite = true;
		return this;
	}

	value() {
		this._value = new SurrealExpressionWithSurrealFieldParent(this);
		return this._value;
	}

	assert() {
		this._assert = new SurrealExpressionWithSurrealFieldParent(this);
		return this._assert;
	}

	permissions(permissions: SurrealPermissions) {
		this._permissions = permissions;
		return this;
	}

	public _sql(table: SurrealTable<any>): string | never {
		throw new Error("The sql method must be implemented by the subclass.");
	}
}

export class SurrealString extends SurrealField {
	constructor() {
		super(z.string());
	}

	public _sql(table: SurrealTable<any>): string | never {
		let sql =  `DEFINE FIELD ${this.name} ON ${table.name} TYPE `;

		if (this._optional) {
			sql += `option<string>`
		} else {
			sql += `string`
		}

		if (this._default) {
			sql += ` DEFAULT ${this._default._sql()}`;
		}

		return sql;
	}
}

export class SurrealInteger extends SurrealField {
	constructor() {
		super(z.number());
	}

	public _sql(table: SurrealTable<any>): string | never {
		let sql = `DEFINE FIELD ${this.name} ON ${table.name} TYPE `;

		if (this._optional) {
			sql += `option<int>`
		} else {
			sql += `int`
		}

		if (this._default) {
			sql += ` DEFAULT ${this._default._sql()}`;
		}

		return sql;
	}
}

export class SurrealFloat extends SurrealField {
	constructor() {
		super(z.number());
	}

	public _sql(table: SurrealTable<any>): string | never {
		let sql = `DEFINE FIELD ${this.name} ON ${table.name} TYPE `;

		if (this._optional) {
			sql += `option<float>`
		} else {
			sql += `float`
		}

		if (this._default) {
			sql += ` DEFAULT ${this._default._sql()}`;
		}

		return sql;
	}
}

export class SurrealRecord extends SurrealField {
	// An array of table names that this record references.
	private _tables: SurrealTable<any>[];

	constructor(tables: SurrealTable<any>[]) {
		super(z.string());
		this._tables = tables;
	}

	public _sql(table: SurrealTable<any>): string | never {
		let sql = new SQLBuilder(`DEFINE FIELD ${this.name} ON ${table.name} TYPE `);

		if (this._optional) {
			sql.append(`option<`);
		}
		if (this._tables.length === 0) {
			sql.append(`record`);
		} else {
			sql.append(`record<${this._tables.join(' | ')}>`);
		}
		if (this._optional) {
			sql.append(`>`);
		}

		if (this._default) {
			sql.append(` DEFAULT ${this._default._sql()}`);
		}

		return sql.toString();
	}
}

class SQLBuilder {
	private _parts: string[] = [];

	constructor(initial?: string) {
		if (initial) {
			this._parts = [initial];
		}
	}

	append(str: string) {
		this._parts.push(str);
	}

	left() {
		this._parts.push('(');
	}

	toString() {
		return this._parts.join('');
	}
}

export function lazy<T>(fn: () => T): T {
	return fn();
}

export async function init(url: string, vars: { password: string, username: string, database: string, namespace: string }): Promise<Surreal> {
	const surreal = new Surreal();
	await surreal.connect(url);
	await surreal.use({ namespace: vars.namespace, database: vars.database })
	await surreal.signin({
		password: vars.password,
		username: vars.username
	})
	return surreal;
}

export function string() {
	return new SurrealString();
}

export function integer() {
	return new SurrealInteger();
}

export function float() {
	return new SurrealFloat();
}

export function record(tables: (SurrealTable<any> | ReturnType<typeof lazy<SurrealTable<any>>>)[]) {
	return new SurrealRecord(tables);
}

export function expression() {
	return new SurrealExpression();
}

export function table(name: string, fields: Record<string, SurrealField | SurrealExpressionWithSurrealFieldParent>) {
	return new SurrealTable(name, fields);
}