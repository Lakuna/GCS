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
 * Properties that can be passed to a set captain form.
 * @public
 */
export interface SetCaptainFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The team to set the captain of. */
	team: typeof teamTable.$inferSelect;

	/** The players already on the team. */
	teamPlayers: (typeof teamPlayerTable.$inferSelect)[];

	/** The players already on the team. */
	players: (typeof playerTable.$inferSelect)[];
}

/**
 * A form for setting the captain of a team.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function SetCaptainForm({
	team,
	teamPlayers,
	players,
	...props
}: SetCaptainFormProps): JSX.Element {
	const captainId = teamPlayers.find(({ isCaptain }) => isCaptain)?.playerId;

	return (
		<Form
			action={async (form) => {
				"use server";

				// Do nothing if the captain is already the chosen player.
				const playerId = getFormField(form, "playerId", true);
				if (captainId === playerId) {
					return;
				}

				// Remove any existing captain.
				await db
					.update(teamPlayerTable)
					.set({ isCaptain: null })
					.where(eq(teamPlayerTable.teamId, team.id));

				// Set the new captain.
				await db
					.update(teamPlayerTable)
					.set({ isCaptain: true })
					.where(
						and(
							eq(teamPlayerTable.playerId, playerId),
							eq(teamPlayerTable.teamId, team.id)
						)
					);

				revalidatePath(getTeamUrl(team));
			}}
			{...props}
		>
			<header>
				<h3>{"Set Captain"}</h3>
			</header>
			<p>
				<label>
					{"Player"}
					<select name="playerId" required>
						{players
							.filter((player) => player.id !== captainId)
							.map((player) => (
								<option value={player.id} key={player.id}>
									{player.displayName ?? player.name}
								</option>
							))}
					</select>
				</label>
			</p>
			<p>
				<Submit value="Set" />
			</p>
		</Form>
	);
}
