import Form, { type FormProps } from "components/Form";
import { and, eq } from "drizzle-orm";
import { type playerTable, teamPlayerTable, type teamTable } from "db/schema";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import getFormField from "util/getFormField";
import getTeamUrl from "util/getTeamUrl";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a remove player form.
 * @public
 */
export interface RemovePlayerFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The team to add the player to. */
	team: typeof teamTable.$inferSelect;

	/** The players already on the team. */
	teamPlayers: (typeof teamPlayerTable.$inferSelect)[];

	/** The players already on the team. */
	players: (typeof playerTable.$inferSelect)[];
}

/**
 * A form for removing a player from a team.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function RemovePlayerForm({
	team,
	teamPlayers,
	players,
	...props
}: RemovePlayerFormProps): JSX.Element {
	const captainId = teamPlayers.find(({ isCaptain }) => isCaptain)?.playerId;
	const [newCaptain] = teamPlayers.filter(
		({ playerId: id }) => id !== captainId
	);

	return (
		<Form
			action={async (form) => {
				"use server";

				// Remove the player from the team.
				const playerId = getFormField(form, "playerId", true);
				await db
					.delete(teamPlayerTable)
					.where(
						and(
							eq(teamPlayerTable.playerId, playerId),
							eq(teamPlayerTable.teamId, team.id)
						)
					);

				// If the player was the captain and there are any other players on the team, make one of them the captain.
				if (playerId === captainId && newCaptain) {
					await db
						.update(teamPlayerTable)
						.set({ isCaptain: true })
						.where(
							and(
								eq(teamPlayerTable.playerId, newCaptain.playerId),
								eq(teamPlayerTable.teamId, team.id)
							)
						);
				}

				revalidatePath(getTeamUrl(team));
			}}
			{...props}
		>
			<header>
				<h3>{"Remove Player"}</h3>
			</header>
			<p>
				<label>
					{"Player"}
					<select name="playerId" required>
						{players.map((player) => (
							<option value={player.id} key={player.id}>
								{player.displayName ?? player.name}
							</option>
						))}
					</select>
				</label>
			</p>
			<p>
				<Submit value="Remove" />
			</p>
		</Form>
	);
}
