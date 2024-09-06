import { float, record, string, SurrealFloat, SurrealRecord, SurrealString, SurrealTable, table } from "../index";
import { SurrealBridge } from "./SurrealBridge";
import { lazy } from "./SurrealLazy";

const db = await new SurrealBridge({
	database: "main",
	host: "localhost",
	namespace: "public",
	port: 8000,
	password: "root",
	username: "root",
}).connect();

const RecordsTable = table("Records", {
	name: string(),
}, db);

const UsersTable = table("Users", {
	name: string().default("string::lowercase($value)"),
	age: float().optional(),
	records: record([RecordsTable, lazy(() => UsersTable)]).optional(),
}, db);	

//type User = sb.infer<typeof tab>;

await UsersTable.deploy(db);

// const user = await UsersTable.findMany({
// 	where: {
// 		AND: [{
// 			name: "Moritz Utcke",
// 		}]	
// 	},
// 	orderBy: {
// 		age: "asc"
// 	}
// })

const result = await UsersTable.update({
	data: {
		age: 22,
		name: "Moritz"
	},where: {
		age: 21
	},
	return: "AFTER"
})

console.log(result);


// console.log(user);

// await UsersTable.create({
// 	data: {
// 		age: 20,
// 		name: "Moritz Utcke",
// 	}
// })