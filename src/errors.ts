export class TableExistsError extends Error {
	name = 'TableExistsError' as const;
	constructor(table: string) {
		super(`Table ${table} already exists.`);
	}
}