import type PageProps from "./PageProps";
import type { ReactNode } from "react";

/**
 * The properties that are passed to all layouts.
 * @public
 */
export default interface LayoutProps<
	T extends object = object
> extends PageProps<T> {
	/** The child elements of the layout, resulting from the combination of the active page and all of its parent layouts up to this layout. */
	children: ReactNode;
}
