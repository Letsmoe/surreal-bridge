import { SurrealField } from "./SurrealField";
import type { SurrealTableOrLazyTable } from "./SurrealTable";
import { SQLBuilder } from "./SQLBuilder";

export class SurrealRecord<Tables extends SurrealTableOrLazyTable[]> extends SurrealField {
	type: "record" = "record";
	// An array of table names that this record references.
	public _tables: Tables;

	constructor(tables: Tables) {
		super();
		this._tables = tables;
	}

	public _sqlType(): string | never {
		let sql = new SQLBuilder("record<");

		sql.append(this._tables.map(table => {			
			if (typeof table === "function") {
				return table().name;
			}

			return table.name;
		}).join(" | "));

		sql.append(">");

		return sql.toString();
	}
}

export function record<Tables extends SurrealTableOrLazyTable[]>(tables: Tables) {
	return new SurrealRecord<Tables>(tables);
}
