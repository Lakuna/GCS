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
 * Properties that can be passed to an add player form.
 * @public
 */
export interface AddPlayerFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The team to add the player to. */
	team: typeof teamTable.$inferSelect;

	/** The players already on the team. */
	teamPlayers: (typeof teamPlayerTable.$inferSelect)[];

	/** The players that may be added to the team. */
	players: (typeof playerTable.$inferSelect)[];

	/** The other teams in the team's season. */
	otherTeams: (typeof teamTable.$inferSelect)[];
}

/**
 * A form for adding a player to a team.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function AddPlayerForm({
	team,
	teamPlayers,
	players,
	otherTeams,
	...props
}: AddPlayerFormProps): JSX.Element {
	const collator = new Intl.Collator();
	const otherTeamIds = otherTeams.map(({ id }) => id);
	const teamPlayerPlayerIds = teamPlayers.map(({ playerId }) => playerId);

	return (
		<Form
			action={async (form) => {
				"use server";
				const playerId = getFormField(form, "playerId", true);

				// If the player is already part of the selected team, do nothing.
				for (const id of teamPlayerPlayerIds) {
					if (id === playerId) {
						return;
					}
				}

				// Remove the player from all other teams in the team's season.
				for (const id of otherTeamIds) {
					// eslint-disable-next-line no-await-in-loop
					await db
						.delete(teamPlayerTable)
						.where(
							and(
								eq(teamPlayerTable.playerId, playerId),
								eq(teamPlayerTable.teamId, id)
							)
						);
				}

				// If the team has no captain, make this player the captain. Must be `null` rather than `false` for non-captains in order to meet a database constraint.
				let isCaptain: true | null = true;
				for (const teamPlayer of teamPlayers) {
					if (teamPlayer.isCaptain) {
						isCaptain = null;
						break;
					}
				}

				// Add the player to the team.
				await db
					.insert(teamPlayerTable)
					.values({ isCaptain, playerId, teamId: team.id });
				revalidatePath(getTeamUrl(team));
			}}
			{...props}
		>
			<header>
				<h3>{"Add Player"}</h3>
			</header>
			<p>
				<label>
					{"Player"}
					<select name="playerId" required>
						{players
							.sort((a, b) =>
								collator.compare(
									a.displayName ?? a.name,
									b.displayName ?? b.name
								)
							)
							.map((player) => (
								<option value={player.id} key={player.id}>
									{player.displayName ?? player.name}
								</option>
							))}
					</select>
				</label>
			</p>
			<p>
				<Submit value="Add" />
			</p>
		</Form>
	);
}
