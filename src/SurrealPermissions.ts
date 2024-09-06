import type { SurrealExpression } from "./SurrealExpression";

export type SurrealPermissions = {
	select?: SurrealExpression,
	create?: SurrealExpression,
	update?: SurrealExpression,
	delete?: SurrealExpression,
}