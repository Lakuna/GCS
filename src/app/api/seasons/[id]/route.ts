import { NextRequest, NextResponse } from "next/server";
import {
	draftPlayerTable,
	matchTable,
	seasonTable,
	teamTable
} from "db/schema";
import type PageProps from "types/PageProps";
import db from "db/db";
import { eq } from "drizzle-orm";
import leftHierarchy from "util/leftHierarchy";

/**
 * Get season parameters.
 * @public
 */
export interface GetSeasonParams {
	/** The ID of the season. */
	id: string; // `${number}`;
}

/**
 * Get a Gauntlet Championship Series season.
 * @param _ - The request.
 * @param props - The page properties.
 * @returns A Gauntlet Championship Series season.
 * @public
 */
export const GET = async (
	_: NextRequest,
	props: PageProps<GetSeasonParams>
): Promise<NextResponse> => {
	const id = parseInt((await props.params).id, 10);
	const rows = await db
		.select()
		.from(seasonTable)
		.leftJoin(matchTable, eq(seasonTable.id, matchTable.seasonId))
		.where(eq(seasonTable.id, id));
	const [row] = rows;
	if (!row) {
		return NextResponse.json(null);
	}

	const { season } = row;
	const { name, playoffsStageId, playoffsTourneyId, slug, startDate } = season;
	const matches = leftHierarchy(rows, "match");
	const teams = await db
		.select()
		.from(teamTable)
		.where(eq(teamTable.seasonId, id));
	const players = await db
		.select()
		.from(draftPlayerTable)
		.where(eq(draftPlayerTable.seasonId, id));

	return NextResponse.json({
		id,
		matchIds: matches.map((match) => match.id),
		name,
		players: players.map(
			({ draftedAt, playerId, notes, pointValue, registeredAt }) => ({
				draftedAt: draftedAt?.valueOf() ?? null,
				id: playerId,
				notes,
				pointValue,
				registeredAt: registeredAt.valueOf()
			})
		),
		playoffsStageId,
		playoffsTourneyId,
		slug,
		startDate,
		teamIds: teams.map((team) => team.id)
	});
};
