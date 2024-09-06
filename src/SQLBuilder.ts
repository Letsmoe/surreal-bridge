export class SQLBuilder {
	private _parts: string[] = [];

	constructor(initial?: string) {
		if (initial) {
			this._parts = [initial];
		}
	}

	append(str: string) {
		this._parts.push(str);
	}

	appendLine(str: string) {
		this._parts.push(str);
		this._parts.push('\n');
	}

	terminate() {
		this._parts.push(';');
	}

	left() {
		this._parts.push('(');
	}

	toString() {
		return this._parts.join('');
	}
}