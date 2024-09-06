import { SurrealField } from "./SurrealField";

export class SurrealDatetime extends SurrealField {
	type: "datetime" = "datetime";
	constructor() {
		super();
	}

	public _sqlType(): string {
		return "datetime";
	}
}

export function datetime() {
	return new SurrealDatetime();
}