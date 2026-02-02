import Form, { type FormProps } from "components/Form";
import {
	type accountTable,
	draftPlayerTable,
	type playerTable,
	teamTable
} from "db/schema";
import type { JSX } from "react";
import Link from "components/Link";
import Submit from "components/Submit";
import draftPlayerAction from "./draftPlayerAction";
import getHighestRankedAccount from "util/getHighestRankedAccount";
import getPlayerUrl from "util/getPlayerUrl";
import ugg from "util/ugg";

/**
 * Properties that can be passed to a draft player form.
 * @public
 */
export interface DraftPlayerFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The draft player. */
	draftPlayer: typeof draftPlayerTable.$inferSelect;

	/** The player. */
	player: typeof playerTable.$inferSelect;

	/** The player's accounts. */
	accounts: (typeof accountTable.$inferSelect)[];

	/** The team to draft the player to. */
	team?: typeof teamTable.$inferSelect | undefined;

	/** Whether or not the viewer of the form may submit the form. */
	enabled?: boolean | undefined;
}

/**
 * A draft player form.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function DraftPlayerForm({
	draftPlayer,
	player,
	accounts,
	team,
	enabled,
	...props
}: DraftPlayerFormProps): JSX.Element {
	const highestRankedAccount = getHighestRankedAccount(accounts);

	return (
		<Form
			action={async () =>
				await draftPlayerAction(enabled ?? false, player, team)
			}
			{...props}
		>
			<header>
				<h3>
					<Link href={getPlayerUrl(player)}>
						{player.displayName ?? player.name}
					</Link>
				</h3>
				<p>{`${draftPlayer.pointValue?.toString() ?? "?"} PV ${player.primaryRole ?? "?"}/${player.secondaryRole ?? "?"}`}</p>
				{highestRankedAccount && (
					<p>
						{`${highestRankedAccount.tier} ${highestRankedAccount.rank} - `}
						<Link href={ugg(...accounts)}>{"U.GG"}</Link>
					</p>
				)}
			</header>
			<p>
				<Submit value="Draft" disabled={!enabled} />
			</p>
		</Form>
	);
}
