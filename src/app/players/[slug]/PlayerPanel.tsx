import { type accountTable, type playerTable } from "db/schema";
import AddAccountForm from "./player/AddAccountForm";
import { type JSX } from "react";
import RemoveAccountForm from "./player/RemoveAccountForm";
import SetPrimaryAccountForm from "./player/SetPrimaryAccountForm";
import UpdatePlayerForm from "./player/UpdatePlayerForm";
import UpdateSkinForm from "./player/UpdateSkinForm";

/**
 * Properties that can be passed to a player panel.
 * @public
 */
export interface PlayerPanelProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	/** The player to modify. */
	player: typeof playerTable.$inferSelect;

	/** The player's accounts. */
	accounts: (typeof accountTable.$inferSelect)[];
}

/**
 * A player page player panel.
 * @param props - Properties to pass to the panel.
 * @returns The panel.
 * @public
 */
export default function PlayerPanel({
	player,
	accounts,
	...props
}: PlayerPanelProps): JSX.Element {
	return (
		<div {...props}>
			<header>
				<h2>{"Player Panel"}</h2>
			</header>
			<AddAccountForm player={player} accounts={accounts} />
			{accounts.length > 0 && (
				<RemoveAccountForm player={player} accounts={accounts} />
			)}
			{accounts.length > 1 && (
				<SetPrimaryAccountForm player={player} accounts={accounts} />
			)}
			<UpdatePlayerForm player={player} />
			{player.bgChamp && (
				<UpdateSkinForm player={player} backgroundChampionId={player.bgChamp} />
			)}
		</div>
	);
}
