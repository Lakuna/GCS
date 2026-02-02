import DeleteGameForm from "./admin/DeleteGameForm";
import { type JSX } from "react";
import type { gameTable } from "db/schema";

/**
 * Properties that can be passed to a captain panel.
 * @public
 */
export interface AdminPanelProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	/** The game. */
	game: typeof gameTable.$inferSelect;
}

/**
 * A game page captain panel.
 * @param props - Properties to pass to the panel.
 * @returns The panel.
 * @public
 */
export default function AdminPanel({
	game,
	...props
}: AdminPanelProps): JSX.Element {
	return (
		<div {...props}>
			<header>
				<h2>{"Admin Panel"}</h2>
			</header>
			<DeleteGameForm game={game} />
		</div>
	);
}
