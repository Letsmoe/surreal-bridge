import { z } from "zod";
import { SurrealField } from "./SurrealField";
import type { SurrealTable } from "./SurrealTable";

export class SurrealFloat extends SurrealField {
	type: "float" = "float";
	constructor() {
		super();
	}
}

export function float() {
	return new SurrealFloat();
}