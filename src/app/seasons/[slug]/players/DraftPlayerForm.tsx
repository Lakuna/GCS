import Form, { type FormProps } from "components/Form";
import {
	type accountTable,
	draftPlayerTable,
	type playerTable
} from "db/schema";
import { and, eq } from "drizzle-orm";
import type { JSX } from "react";
import Link from "components/Link";
import Submit from "components/Submit";
import db from "db/db";
import getFormField from "util/getFormField";
import getHighestRankedAccount from "util/getHighestRankedAccount";
import getPlayerUrl from "util/getPlayerUrl";
import { revalidatePath } from "next/cache";
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
	...props
}: DraftPlayerFormProps): JSX.Element {
	const highestRankedAccount = getHighestRankedAccount(accounts);

	return (
		<Form
			action={async (form) => {
				"use server";
				const pointValueString = getFormField(form, "pointValue");
				await db
					.update(draftPlayerTable)
					.set({
						pointValue: pointValueString ? parseInt(pointValueString, 10) : null
					})
					.where(
						and(
							eq(draftPlayerTable.playerId, draftPlayer.playerId),
							eq(draftPlayerTable.seasonId, draftPlayer.seasonId)
						)
					);
				revalidatePath("");
			}}
			{...props}
		>
			<header>
				<h3>
					<Link href={getPlayerUrl(player)}>
						{player.displayName ?? player.name}
					</Link>
				</h3>
				{highestRankedAccount ?
					<p>
						{`${highestRankedAccount.tier} ${highestRankedAccount.rank} - `}
						{player.primaryRole && player.secondaryRole && (
							<span>{`${player.primaryRole}/${player.secondaryRole} - `}</span>
						)}
						<Link href={ugg(...accounts)}>{"U.GG"}</Link>
					</p>
				:	player.primaryRole &&
					player.secondaryRole && (
						<p>{`${player.primaryRole}/${player.secondaryRole}`}</p>
					)
				}
				{draftPlayer.notes && <p>{`Notes: ${draftPlayer.notes}`}</p>}
			</header>
			<p>
				<label>
					{"Point value"}
					<input
						type="number"
						name="pointValue"
						defaultValue={draftPlayer.pointValue ?? void 0}
					/>
				</label>
			</p>
			<p>
				<Submit value="Update" />
			</p>
		</Form>
	);
}
