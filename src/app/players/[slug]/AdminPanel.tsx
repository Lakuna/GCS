import type { accountTable, playerTable } from "db/schema";
import BanPlayerForm from "./admin/BanPlayerForm";
import ForceVerifyAccountsForm from "./player/ForceVerifyAccountsForm";
import { type JSX } from "react";
import MakeAdminForm from "./admin/MakeAdminForm";

/**
 * Properties that can be passed to an admin panel.
 * @public
 */
export interface AdminPanelProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	/** The player to modify. */
	player: typeof playerTable.$inferSelect;

	/** The player's accounts. */
	accounts: (typeof accountTable.$inferSelect)[];
}

/**
 * A player page admin panel.
 * @param props - Properties to pass to the panel.
 * @returns The panel.
 * @public
 */
export default function AdminPanel({
	player,
	accounts,
	...props
}: AdminPanelProps): JSX.Element {
	return (
		<div {...props}>
			<header>
				<h2>{"Admin Panel"}</h2>
			</header>
			{accounts.filter(({ isVerified }) => !isVerified).length > 0 && (
				<ForceVerifyAccountsForm player={player} />
			)}
			<BanPlayerForm player={player} />
			{!player.isAdmin && <MakeAdminForm player={player} />}
		</div>
	);
}
