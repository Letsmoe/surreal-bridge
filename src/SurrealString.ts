import { SurrealField } from "./SurrealField";

export class SurrealString extends SurrealField {
	type: "string" = "string";
	constructor() {
		super();
	}

	public _sqlType(): string {
		return "string";
	}
}

export function string() {
	return new SurrealString();
}