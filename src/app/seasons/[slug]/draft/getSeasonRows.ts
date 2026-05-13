"use server";

import {
	accountTable,
	draftPlayerTable,
	playerTable,
	seasonTable,
	teamPlayerTable,
	teamTable
} from "db/schema";
import { and, eq } from "drizzle-orm";
import db from "db/db";

/**
 * Get season information.
 * @param slug - The season slug.
 * @returns Season information.
 * @public
 */
export default async function getSeasonRows(slug: string) {
	return await db
		.select()
		.from(seasonTable)
		.leftJoin(teamTable, eq(seasonTable.id, teamTable.seasonId))
		.leftJoin(teamPlayerTable, eq(teamTable.id, teamPlayerTable.teamId))
		.leftJoin(playerTable, eq(teamPlayerTable.playerId, playerTable.id))
		.leftJoin(
			draftPlayerTable,
			and(
				eq(playerTable.id, draftPlayerTable.playerId),
				eq(seasonTable.id, draftPlayerTable.seasonId)
			)
		)
		.leftJoin(
			accountTable,
			eq(draftPlayerTable.playerId, accountTable.playerId)
		)
		.where(eq(seasonTable.slug, decodeURIComponent(slug)));
}
