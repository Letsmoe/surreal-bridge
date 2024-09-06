import { type SurrealPermissions } from "./SurrealPermissions";
import { SurrealExpression } from "./SurrealExpression";
import type { SurrealTable } from "./SurrealTable";
import { SQLBuilder } from "./SQLBuilder";


type SurrealFieldDefaultValue = SurrealExpression | string | number | null;


export abstract class SurrealField {
	abstract type: string;
	protected _value?: SurrealExpression;
	public _optional: boolean = false;
	public _default: SurrealFieldDefaultValue = null;
	protected _assert?: SurrealExpression;
	protected _permissions?: SurrealPermissions;
	protected _comment?: string;
	protected _overwrite: boolean = false;
	protected _flexible: boolean = false;
	public _unique: boolean = false;
	public _isArray: boolean = false;

	constructor(public name?: string) {
		
	}

	array(): this & { _isArray: true } {
		this._isArray = true;
		return this as this & { _isArray: true };
	}

	default(value: SurrealFieldDefaultValue): this & { _optional: true } {
		this._default = value;
		this._optional = true;
		return this as this & { _optional: true };
	}

	getDefaultValue() {
		return this._default
	}

	isOptional() {
		return this._optional;
	}

	unique() {
		this._unique = true;
		return this;
	}

	comment(comment: string) {
		this._comment = comment;
		return this;
	}

	optional(): this & { _optional: true } {
		this._optional = true;
		return this as this & { _optional: true };
	}

	overwrite() {
		this._overwrite = true;
		return this;
	}

	value(expression: SurrealExpression) {
		this._value = expression;
		return this;
	}

	assert(expression: SurrealExpression) {
		this._assert = expression;
		return this;
	}

	permissions(permissions: SurrealPermissions) {
		this._permissions = permissions;
		return this;
	}

	flexible() {
		this._flexible = true;
		return this;
	}

	public _sqlType(): string {
		throw new Error("The sqlType method must be implemented by the subclass.");
	}

	/**
	 * DEFINE FIELD [ OVERWRITE | IF NOT EXISTS ] @name ON [ TABLE ] @table
			[ [ FLEXIBLE ] TYPE @type ]
			[ DEFAULT @expression ]
			[ READONLY ]
			[ VALUE @expression ]
			[ ASSERT @expression ]
			[ PERMISSIONS [ NONE | FULL
				| FOR select @expression
				| FOR create @expression
				| FOR update @expression
				| FOR delete @expression
			] ]
			[ COMMENT @string ]
	 */
	public _sql(table: SurrealTable<any>): string | never {
		let builder = new SQLBuilder()
		let type: string = ""

		if (this._flexible) {
			type = "FLEXIBLE"
		} else {
			if (this._optional) {
				if (this._isArray) {
					type = `TYPE array<option<${this._sqlType()}>>`
				} else {
					type = `TYPE option<${this._sqlType()}>`
				}
			} else {
				if (this._isArray) {
					type = `TYPE array<${this._sqlType()}>`
				} else {
					type = `TYPE ${this._sqlType()}`
				}
			}
		}

		builder.append(`DEFINE FIELD`)
		if (this._overwrite) {
			builder.append(` OVERWRITE`)
		}
		builder.append(` ${this.name} ON ${table.name} `)
		builder.append(type)
		if (this._default !== null) {
			if (this._default instanceof SurrealExpression) {
				builder.append(` DEFAULT ${this._default._sql()}`)
			} else {
				builder.append(` DEFAULT "${this._default}"`)
			}
		}
		if (this._value) {
			builder.append(` VALUE ${this._value._sql()}`)
		}
		if (this._assert) {
			builder.append(` ASSERT ${this._assert._sql()}`)
		}
		if (this._permissions) {
			// TODO
			builder.append(` PERMISSIONS ${this._permissions._sql()}`)
		}
		if (this._comment) {
			builder.append(` COMMENT ${this._comment}`)
		}

		builder.terminate()

		if (this._unique) {
			builder.append(`\nDEFINE INDEX ${this.name}_UNIQUE ON ${table.name} FIELDS ${this.name} UNIQUE;`)
		}

		return builder.toString()
	}
	}

