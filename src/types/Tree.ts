import type { Shift } from "./Shift";

/**
 * A hierarchical representation of a left-joined SQL query result. `T` is the type of the query response, `U` is the order of the keys within the hierarchy.
 * @public
 */
export type Tree<T extends object, U extends (keyof T)[]> =
	Shift<U> extends [] ?
		// Leaf node.
		NonNullable<T[U[0]]>
	:	// Internal node.
		{ value: NonNullable<T[U[0]]>; children: Tree<T, Shift<U>>[] };
