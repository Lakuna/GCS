"use server";

import { playerTable, teamPlayerTable, teamTable } from "db/schema";
import db from "db/db";
import { revalidatePath } from "next/cache";

/**
 * Draft a player to a team.
 * @param enabled - Whether the user is allowed to draft a player.
 * @param player - The player to draft.
 * @param team - The team to draft the player to.
 * @returns An error message on failure only.
 * @public
 */
export default async function draftPlayerAction(
	enabled: boolean,
	player: typeof playerTable.$inferSelect,
	team?: typeof teamTable.$inferSelect
): Promise<string | undefined> {
	if (!enabled || !team) {
		return "You aren't the drafting captain!";
	}

	await db
		.insert(teamPlayerTable)
		.values({ playerId: player.id, teamId: team.id });
	revalidatePath("");
	return void 0;
}
