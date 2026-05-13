"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import {
	draftPlayerTable,
	playerTable,
	teamPlayerTable,
	teamTable
} from "db/schema";
import { TEAM_SIZE } from "util/const";
import { auth } from "db/auth";
import db from "db/db";
import getDraftedPlayersRows from "./getDraftedPlayersRows";
import getNextDraftTeam from "./getNextDraftTeam";
import { revalidatePath } from "next/cache";

/**
 * Draft a player to a team.
 * @param player - The player to draft.
 * @param team - The team to draft the player to.
 * @returns An error message on failure only.
 * @public
 */
export default async function draftPlayerAction(
	player: typeof playerTable.$inferSelect,
	team?: typeof teamTable.$inferSelect
): Promise<string | undefined> {
	const session = await auth();
	if (!session?.user || !team) {
		return "You aren't the drafting captain!";
	}

	const [draftingTeam] = await db
		.select()
		.from(teamTable)
		.where(eq(teamTable.id, team.id))
		.limit(1);
	if (!draftingTeam) {
		return "That team doesn't exist.";
	}

	const seasonTeamPlayersRows = await db
		.select()
		.from(teamPlayerTable)
		.innerJoin(teamTable, eq(teamPlayerTable.teamId, teamTable.id))
		.where(eq(teamTable.seasonId, draftingTeam.seasonId));
	const draftingTeamPlayers = seasonTeamPlayersRows.filter(
		({ teamPlayer }) => teamPlayer.teamId === draftingTeam.id
	);

	if (
		draftingTeamPlayers.length >= TEAM_SIZE ||
		!draftingTeamPlayers.some(
			({ teamPlayer }) =>
				teamPlayer.playerId === session.user?.id && teamPlayer.isCaptain
		)
	) {
		return "You aren't the drafting captain!";
	}

	if (
		seasonTeamPlayersRows.some(
			({ teamPlayer }) => teamPlayer.playerId === player.id
		)
	) {
		return "That player has already been drafted.";
	}

	const [draftPlayer] = await db
		.select()
		.from(draftPlayerTable)
		.where(
			and(
				eq(draftPlayerTable.playerId, player.id),
				eq(draftPlayerTable.seasonId, draftingTeam.seasonId),
				isNotNull(draftPlayerTable.pointValue),
				isNull(draftPlayerTable.draftedAt)
			)
		)
		.limit(1);
	if (!draftPlayer) {
		return "That player isn't available to draft.";
	}

	const teams = await db
		.select()
		.from(teamTable)
		.where(eq(teamTable.seasonId, draftingTeam.seasonId));
	const draftedPlayers = await getDraftedPlayersRows(draftingTeam.seasonId);
	const nextTeam = getNextDraftTeam(teams, draftedPlayers.length);
	if (nextTeam?.id !== draftingTeam.id) {
		return "It isn't your turn to draft.";
	}

	await db
		.insert(teamPlayerTable)
		.values({ playerId: player.id, teamId: draftingTeam.id });
	await db
		.update(draftPlayerTable)
		.set({ draftedAt: new Date() })
		.where(
			and(
				eq(draftPlayerTable.playerId, player.id),
				eq(draftPlayerTable.seasonId, draftingTeam.seasonId)
			)
		);
	revalidatePath("/seasons");
	return void 0;
}
