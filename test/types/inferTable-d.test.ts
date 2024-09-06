import { expectType } from "tsd";
import { int, string, SurrealBridge, table, type inferTable } from "../../index";
import {faker} from "@faker-js/faker"
import { describe, test } from "bun:test"

describe("inferTable", () => {
	test("should infer the type of a table", () => {
		const bridge = new SurrealBridge({
			host: "localhost",
			port: 3306,
			username: "root",
			password: "password",
			database: "test",
			namespace: "test"
		})
		
		const UsersTable = table("User", {
			name: string(),
			age: int().optional()
		}, bridge)
		
		type User = inferTable<typeof UsersTable>
		
		expectType<User>({
			name: faker.string.sample(),
			age: faker.number.int()
		})
	})
})