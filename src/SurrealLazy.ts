export function lazy<T>(fn: () => T): () => T {
	return fn;
}