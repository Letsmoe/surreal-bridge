import { SurrealField } from "./SurrealField";

export class SurrealBoolean extends SurrealField {
	type: "bool" = "bool";

	constructor() {
		super();
	}

	public _sqlType(): string {
		return "bool";
	}
}

export function bool() {
	return new SurrealBoolean();
}