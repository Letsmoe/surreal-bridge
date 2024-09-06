import type { SurrealBridge } from "./SurrealBridge";
import { SurrealString } from "./SurrealString";
import { SurrealFloat } from "./SurrealFloat";
import { SurrealInteger } from "./SurrealInteger";
import { SurrealRecord } from "./SurrealRecord";
import { SurrealBoolean } from "./SurrealBoolean";
import { SurrealObject } from "./SurrealObject";
import { SurrealDatetime } from "./SurrealDatetime";
import { z } from "zod";
import { SQLBuilder } from "./SQLBuilder";
import { SurrealField } from "./SurrealField";

export class SurrealTable<Schema extends SurrealTableSchema> {
	constructor(public name: string, public fields: Schema, public bridge: SurrealBridge) {
		for (const name in fields) {
			const field = fields[name];

			if (!(field instanceof SurrealField)) {
				throw new Error('Invalid field type.');
			}

			field.name = name;
		}
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

	zod() {
		const zodSchema = z.object({} as any);
		for (const name in this.fields) {
			const field = this.fields[name];

			if (field instanceof SurrealString) {
				zodSchema.shape[name] = z.string();
			} else if (field instanceof SurrealFloat) {
				zodSchema.shape[name] = z.number();
			} else if (field instanceof SurrealInteger) {
				zodSchema.shape[name] = z.number();
			} else if (field instanceof SurrealRecord) {
				zodSchema.shape[name] = z.string();
			} else if (field instanceof SurrealBoolean) {
				zodSchema.shape[name] = z.boolean();
			} else if (field instanceof SurrealObject) {
				zodSchema.shape[name] = z.any();
			} else if (field instanceof SurrealDatetime) {
				zodSchema.shape[name] = z.date();
			}

			if (field instanceof SurrealField && field.isOptional()) {
				zodSchema.shape[name] = zodSchema.shape[name].optional();
			}
		}

		return zodSchema;
	}

	/**
	 * SELECT [ VALUE ] @fields [ AS @alias ]
			[ OMIT @fields ...]
			FROM [ ONLY ] @targets
			[ WITH [ NOINDEX | INDEX @indexes ... ]]
			[ WHERE @conditions ]
			[ SPLIT [ ON ] @field ... ]
			[ GROUP [ BY ] @fields ... ]
			[ ORDER [ BY ]
				@fields [
					RAND()
					| COLLATE
					| NUMERIC
				] [ ASC | DESC ] ...
			]
			[ LIMIT [ BY ] @limit ]
			[ START [ AT ] @start ]
			[ FETCH @fields ... ]
			[ TIMEOUT @duration ]
			[ PARALLEL ]
			[TEMPFILES]
			[ EXPLAIN [ FULL ]]
	 */
	async findMany<Query extends SurrealSelectQueryParameters<Schema>>(query: Query, _: SurrealSelectQueryOptions = {}): Promise<SurrealSelectQueryReturnType<Schema, Query>[]> {
		const sql = new SQLBuilder("SELECT ");
		let bindings: Record<string, any> = {};

		if (query.include) {
			sql.append(Object.entries(query.include).map(([key, isIncluded]) => {
				if (isIncluded) {
					return key;
				}

				return `OMIT ${key}`;
			}).join(", "));
		} else {
			sql.append("*");
		}

		sql.append(` FROM ${this.name} `);

		if (query.where) {
			sql.append("WHERE ");

			const { bindings: localBindings, sql: code } = generateSQLForSurrealWhereFilter(query.where)

			bindings = { ...bindings, ...localBindings };
			
			sql.append(code);
		}

		if (query.orderBy) {
			sql.append(" ORDER BY ");

			sql.append(Object.entries(query.orderBy).map(([key, value]) => {
				return `${key} ${value}`;
			}).join(", "));
		}

		if (query.limit) {
			sql.append(` LIMIT ${query.limit}`);
		}

		if (typeof query.offset !== "undefined") {
			sql.append(` START AT ${query.offset}`);
		}

		if (_.parallel) {
			sql.append(" PARALLEL ");
		}

		if (_.timeoutMs && _.timeoutMs > 0) {
			sql.append(` TIMEOUT ${_.timeoutMs}ms `);
		}

		// The return type is usually an array of arrays as each subquery has its own array.
		// We only have one query so we can just return the first element.
		return (await this.bridge.connector.query(sql.toString(), bindings))[0] as SurrealSelectQueryReturnType<Schema, Query>[];
	}

	/**
	 * UPDATE [ ONLY ] @targets
			[ CONTENT @value
				| MERGE @value
				| PATCH @value
				| [ SET @field = @value, ... | UNSET @field, ... ]
			]
			[ WHERE @condition ]
			[ RETURN NONE | RETURN BEFORE | RETURN AFTER | RETURN DIFF | RETURN @statement_param, ... ]
			[ TIMEOUT @duration ]
			[ PARALLEL ]
	 */
	update(query: {
		data: Partial<ResolveSurrealSchemaType<Schema>>,
		return?: SurrealReturnOption,
		where?: SurrealWhereFilter<Schema>
	}, _: SurrealUpdateQueryOptions = {}) {
		const sql = new SQLBuilder("UPDATE ");
		let bindings: Record<string, any> = {};

		sql.append(this.name);

		sql.append(" SET ");

		sql.append(Object.entries(query.data).map(([key, value]) => {
			bindings[key] = value;
			return `${key} = $${key}`;
		}).join(", "));

		if (query.where) {
			sql.append(" WHERE ");

			const { bindings: localBindings, sql: code } = generateSQLForSurrealWhereFilter(query.where)

			bindings = { ...bindings, ...localBindings };
			
			sql.append(code);
		}

		if (query.return) {
			sql.append(` RETURN ${query.return}`)
		}

		if (_.timeoutMs && _.timeoutMs > 0) {
			sql.append(` TIMEOUT ${_.timeoutMs}ms `);
		}

		if (_.parallel) {
			sql.append(" PARALLEL ");
		}
		
		return this.bridge.connector.query(sql.toString(), bindings);
	}

	/**
	 * CREATE [ ONLY ] @targets
			[ CONTENT @value
				| SET @field = @value ...
			]
			[ RETURN NONE | RETURN BEFORE | RETURN AFTER | RETURN DIFF | RETURN @statement_param, ... ]
			[ TIMEOUT @duration ]
			[ PARALLEL ]
	 */
	create(_: {
		data: SurrealCreateInputType<Schema>,
		id?: string,

	}) {
		const sql = new SQLBuilder("CREATE ONLY ");
		const bindings: Record<string, any> = {};

		if (_.id) {
			sql.append(`${this.name}:${_.id}`);
		} else {
			sql.append(this.name);
		}

		sql.append(" CONTENT {");

		sql.append(Object.entries(_.data).map(([key, value]) => {
			bindings[key] = value;
			return `${key}: $${key}`;
		}).join(", "));

		sql.append("}");

		return this.bridge.connector.query(sql.toString(), bindings);
	}

	createMany(_: {
		data: SurrealCreateInputType<Schema>[],
	}) {
		for (const dataset of _.data) {
			this.create({
				data: dataset
			})
		}
	}

	/**
		DEFINE TABLE [ OVERWRITE | IF NOT EXISTS ] @name
		[ DROP ]
		[ SCHEMAFULL | SCHEMALESS ]
		[ TYPE [ ANY | NORMAL | RELATION [ IN | FROM ] @table [ OUT | TO ] @table ] ]
		[ AS SELECT @projections
			FROM @tables
			[ WHERE @condition ]
			[ GROUP [ BY ] @groups ]
		]
		[CHANGEFEED @duration [INCLUDE ORIGINAL] ]
		[ PERMISSIONS [ NONE | FULL
			| FOR select @expression
			| FOR create @expression
			| FOR update @expression
			| FOR delete @expression
		] ]
			[ COMMENT @string ]
	 */
	async deploy() {
		if (!this.name) {
			throw new Error('Table name not set.');
		}

		let builder = new SQLBuilder()

		builder.appendLine(`DEFINE TABLE ${this.name} SCHEMAFULL PERMISSIONS NONE`);

		await this.bridge.connector.query(builder.toString());		

		// This query will error out if the table already exists.
		// await surreal.query(`DEFINE TABLE IF NOT EXISTS ${this._table} SCHEMAFULL PERMISSIONS NONE`);

		// Add all the fields to the table.		
		for (const name in this.fields) {
			let sql: string = this.fields[name]._sql(this);

			builder.appendLine(sql);			
			
			await this.bridge.connector.query(sql);
		}

		console.log(builder.toString());


		return this;
	}
}

function generateSQLForSurrealWhereFilter(filter: SurrealWhereFilter<any>, bindings: Record<string, any> = {}, i: number = 0): {
	bindings: Record<string, any>,
	sql: string
} {
	const sql = "(" + Object.entries(filter).map(([key, value]) => {
		if (key === "OR") {
			return `(${generateSQLForSurrealWhereFilterOR(value as SurrealWhereFilter<any>[], bindings, i + 1)})`;
		}

		if (key === "AND") {
			return `(${generateSQLForSurrealWhereFilterAND(value as SurrealWhereFilter<any>[], bindings, i + 1)})`;
		}

		bindings[`${key}_${i}`] = value;

		return `${key} = $${key}_${i}`;
	}).join(" && ") + ")";

	return { bindings, sql };
}

function generateSQLForSurrealWhereFilterAND(and: SurrealWhereFilter<any>[], bindings: Record<string, any> = {}, i: number = 0) {
	return and.map((filter, j) => {
		return generateSQLForSurrealWhereFilter(filter, bindings, i + j).sql;
	}).join(" && ");
}

function generateSQLForSurrealWhereFilterOR(or: SurrealWhereFilter<any>[], bindings: Record<string, any> = {}, i: number = 0) {
	return or.map((filter, j) => {
		return generateSQLForSurrealWhereFilter(filter, bindings, i + j).sql;
	}).join(" OR ");
}

type SurrealReturnOption =
	"NONE" |
	"BEFORE" |
	"AFTER" |
	"DIFF";

type SurrealSelectQueryOptions = {
	timeoutMs?: number,
	parallel?: boolean,
	tempfiles?: boolean,
	explain?: true | "full"
}

type SurrealUpdateQueryOptions = {
	timeoutMs?: number,
	parallel?: boolean,
}

// Filter out all optional keys.
type OptionalKeys<Schema extends SurrealTableSchema> = {
	[K in keyof Schema]: Schema[K]["_optional"] extends true ? K : never;
}[keyof Schema]

type ResolveSurrealSchemaType<Schema extends SurrealTableSchema> = Omit<{
	[K in keyof Schema]: Schema[K] extends SurrealField ? ResolveSurrealFieldType<Schema[K]> : never;
}, OptionalKeys<Schema>> & Partial<{
	[K in OptionalKeys<Schema>]: Schema[K] extends SurrealField ? ResolveSurrealFieldType<Schema[K]> : never;
}> & {
	id?: string
}

type SurrealWhereFilter<Schema extends SurrealTableSchema> = {
	[K in keyof Schema]?: Schema[K] extends SurrealField ? ResolveSurrealFieldType<Schema[K]> : never;
} & {
	OR?: SurrealWhereFilter<Schema>[];
	AND?: SurrealWhereFilter<Schema>[];
}

type ResolveSurrealFieldOutputType<Field extends SurrealField> = 
Field extends SurrealString ? string :
Field extends SurrealFloat ? number :
Field extends SurrealInteger ? number :
Field extends SurrealRecord<infer Tables> ? ResolveSurrealTableAsObject<Tables[number]> :
Field extends SurrealBoolean ? boolean :
Field extends SurrealObject ? object :
Field extends SurrealDatetime ? Date : never;

type ResolveSurrealTableAsObject<Table extends SurrealTableOrLazyTable> = Table extends (() => SurrealTable<any>) ?
	{
		[K in keyof ReturnType<Table>["fields"]]: ResolveSurrealFieldType<ReturnType<Table>["fields"][K]>
	}
: Table extends SurrealTable<any> ? {
	[K in keyof Table["fields"]]?: ResolveSurrealFieldType<Table["fields"][K]>
} : never;


type ResolveSurrealFieldInputType<Field extends SurrealField> = 
Field extends SurrealString ? string :
Field extends SurrealFloat ? number :
Field extends SurrealInteger ? number :
Field extends SurrealRecord<SurrealTable<any>[]> ? SurrealCreateRecordType<Field> :
Field extends SurrealBoolean ? boolean :
Field extends SurrealObject ? object :
Field extends SurrealDatetime ? Date : never;


type ResolveTableOrLazyTable<Table extends SurrealTableOrLazyTable> = Table extends () => SurrealTable<any> ? ReturnType<Table> : Table;


type SurrealCreateInputType<Schema extends SurrealTableSchema> = ResolveSurrealSchemaType<Schema>;

// TODO
type SurrealCreateRecordType<Schema extends SurrealRecord<SurrealTableOrLazyTable[]>> = {
	connectWhere?: SurrealWhereFilter<ResolveTableOrLazyTable<Schema["_tables"][number]>["fields"]>,
	connectOrCreate?: SurrealCreateInputType<ResolveTableOrLazyTable<Schema["_tables"][number]>["fields"]> | SurrealWhereFilter<ResolveTableOrLazyTable<Schema["_tables"][number]>["fields"]>,
	create?: SurrealCreateInputType<ResolveTableOrLazyTable<Schema["_tables"][number]>["fields"]>,
	id?: string
}


// TODO: This doesn't work since the typescript checker doesn't evaluate it correctly...
type ResolveSurrealFieldType<Field extends SurrealField> = 
Field["_isArray"] extends true ? Array<ResolveSurrealFieldInputType<Field>> : ResolveSurrealFieldInputType<Field>;


type SurrealTableSchema = Record<string, SurrealField>;
type SurrealTableSchemaWithFilteredFields<T> = T extends SurrealField ? T : never;
type SurrealTableSchemaWithFilteredTables<T> = T extends SurrealTable<any> ? T : T extends () => SurrealTable<any> ? ReturnType<T> : never;

type SurrealSelectQueryParameters<Schema extends SurrealTableSchema> = {
	where: SurrealWhereFilter<Schema>,
	limit?: number,
	offset?: number,
	orderBy?: {
		[K in keyof Schema]?: "asc" | "desc";
	},
	select?: {
		[K in keyof SurrealTableSchemaWithFilteredFields<Schema>]?: boolean;
	},
	include?: {
		[K in keyof SurrealTableSchemaWithFilteredTables<Schema>]?: boolean;
	}
}

type SurrealSelectQueryReturnType<
	Schema extends SurrealTableSchema,
  Query extends SurrealSelectQueryParameters<Schema>
> = Query["include"] extends Partial<Record<keyof Schema, boolean>>
    ? { [K in keyof Query["include"]]: K extends keyof Schema ? ResolveSurrealTableAsObject<SurrealTableSchemaWithFilteredTables<Schema[K]>> : never }
    : { [K in keyof Schema]: ResolveSurrealFieldOutputType<SurrealTableSchemaWithFilteredFields<Schema[K]>> };


export function table<Schema extends SurrealTableSchema>(name: string, fields: Schema, bridge: SurrealBridge) {
	return new SurrealTable(name, fields, bridge);
}

export type inferTable<Schema extends SurrealTable<any>> = Schema extends SurrealTable<infer T> ? {
	[K in keyof T]: T[K] extends SurrealField ? ResolveSurrealFieldType<T[K]> : T[K] extends SurrealTable<any> ? ResolveSurrealTableAsObject<T[K]> : never;
} : never;

export type SurrealTableOrLazyTable = SurrealTable<any> | (() => SurrealTable<any>);
