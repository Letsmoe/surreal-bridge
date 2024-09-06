import { Surreal, type AnyAuth } from "surrealdb.js";

export class SurrealBridge {
	private host: string;
	private port: number;
	private username?: string;
	private password?: string;
	private database: string;
	private namespace: string;

	private surreal: Surreal;

	constructor(auth: {
		host: string,
		port: number,
		username?: string,
		password?: string,
		database: string,
		namespace: string
	}) {
		this.host = auth.host;
		this.port = auth.port;
		this.username = auth.username;
		this.password = auth.password;
		this.database = auth.database;
		this.namespace = auth.namespace;

		this.surreal = new Surreal();
	}

	get connector() {
		return this.surreal;
	}

	async connect() {
		if (this.surreal.connection?.ready) {
			return this;
		}

		await this.surreal.connect(`http://${this.host}:${this.port}/rpc`);

		await this.surreal.use({
			namespace: this.namespace,
			database: this.database
		});

		if (this.username && this.password) {
			await this.surreal.signin({
				username: this.username,
				password: this.password
			});
		}
		
		return this;
	}
}