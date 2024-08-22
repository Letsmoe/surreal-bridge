import { z } from "zod";
import { expression, init, integer, lazy, record, string, SurrealExpression, SurrealField, SurrealTable, table, type SurrealORM } from "./surrealdb-creator";
import { SurrealBridge } from "./SurrealBridge";

const db = new SurrealBridge({
	database: "main",
	host: "localhost",
	namespace: "public",
	port: 8000,
	password: "root",
	username: "root"
}).connect()


// const RecordsTable = await table("records", {
// 	name: string().default().raw("string::lowercase($value)")
// })

// const UsersTable = await table("users", {
// 	name: string().default().raw("string::lowercase($value)"),
// 	records: record([RecordsTable]).optional(),
// 	age: integer().permissions({
// 		create: expression().raw("1"),
// 	})
// }).create(db);

// type User = SurrealORM.infer<typeof UsersTable>;

// UsersTable.where({
	
// })