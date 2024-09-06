import { z } from "zod";
import { SurrealField } from "./SurrealField";
import type { SurrealTable } from "./SurrealTable";

export class SurrealInteger extends SurrealField {
	type: "int" = "int";
	constructor() {
		super();
	}
}

export function int() {
	return new SurrealInteger();
}