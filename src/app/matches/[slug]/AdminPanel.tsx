import CreateGameForm from "./admin/CreateGameForm";
import DeleteMatchForm from "./admin/DeleteMatchForm";
import { type JSX } from "react";
import type { matchTable } from "db/schema";

/**
 * Properties that can be passed to an admin panel.
 * @public
 */
export interface AdminPanelProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	/** The current match. */
	match: typeof matchTable.$inferSelect;
}

/**
 * A match page admin panel.
 * @param props - Properties to pass to the panel.
 * @returns The panel.
 * @public
 */
export default function AdminPanel({
	match,
	...props
}: AdminPanelProps): JSX.Element {
	return (
		<div {...props}>
			<header>
				<h2>{"Admin Panel"}</h2>
			</header>
			<CreateGameForm match={match} />
			<DeleteMatchForm match={match} />
		</div>
	);
}
