import { SurrealField } from "./SurrealField";

export class SurrealObject extends SurrealField {
	type: "object" = "object";
	constructor() {
		super();
	}

	public _sqlType(): string {
		return "object";
	}
}

export function object() {
	return new SurrealObject();
}