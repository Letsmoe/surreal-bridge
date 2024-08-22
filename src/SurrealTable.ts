import type Surreal from "surrealdb.js";
import { SurrealField, SurrealExpressionWithSurrealFieldParent } from "./surrealdb-creator";

export class SurrealTable<Schema extends Record<string, SurrealField | SurrealExpressionWithSurrealFieldParent>> {
	public fields: Schema;

	constructor(public name: string, fields: Schema) {
		const processed: Record<string, SurrealField | SurrealExpressionWithSurrealFieldParent> = {};

		for (const name in fields) {
			const field = fields[name];

			if (field instanceof SurrealExpressionWithSurrealFieldParent) {
				if (!field.parent) {
					throw new Error('Expression parent not set.');
				}

				processed[name] = field.parent as SurrealField;
				field.parent.name = name
				continue;
			}

			if (!(field instanceof SurrealField)) {
				throw new Error('Invalid field type.');
			}

			field.name = name;
		}

		this.fields = processed as Schema;
	}

	field(field: SurrealField) {
		if (!field.name) {
			throw new Error('Field name not set.');
		}

		if (field.name in this.fields) {
			throw new Error(`Tried to redefine field '${field.name}' in table '${this.name}'. Please use the 'alter' method instead or delete the field first.`);
		}

		this.fields[field.name as keyof Schema] = field as Schema[keyof Schema];
		return this;
	}

	where(filter: SurrealWhereFilter<Schema>) {

	}

	async create(surreal: Surreal) {
		if (!this.name) {
			throw new Error('Table name not set.');
		}

		// This query will error out if the table already exists.
		// await surreal.query(`DEFINE TABLE IF NOT EXISTS ${this._table} SCHEMAFULL PERMISSIONS NONE`);

		// Add all the fields to the table.
		for (const name in this.fields) {
			const field = this.fields[name];

			if (!(field instanceof SurrealField)) {
				throw new Error('Invalid field type.');
			}

			const sql = field._sql(this);

			console.log(sql);
			

			//await surreal.query(sql);
		}

		return this;
	}
}

type SurrealWhereFilter<Schema extends Record<string, SurrealField | SurrealExpressionWithSurrealFieldParent>> = {
	[K in keyof Schema]?: Schema[K] extends SurrealField ? Schema[K]['schema'] : never;
}