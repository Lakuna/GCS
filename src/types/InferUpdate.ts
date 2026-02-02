/**
 * Equivalent to an "infer insert" type, but accepts any subset of properties. Used for updating a value in a relation.
 * @public
 */
export type InferUpdate<T> = { [U in keyof T]?: T[U] | undefined };
