import { NextRequest, NextResponse } from "next/server";
import { gameTable, matchTable } from "db/schema";
import type PageProps from "types/PageProps";
import db from "db/db";
import { eq } from "drizzle-orm";
import leftHierarchy from "util/leftHierarchy";

/**
 * Get match parameters.
 * @public
 */
export interface GetMatchParams {
	/** The ID of the match. */
	id: string; // `${number}`;
}

/**
 * Get a Gauntlet Championship Series match.
 * @param _ - The request.
 * @param props - The page properties.
 * @returns A Gauntlet Championship Series match.
 * @public
 */
export const GET = async (
	_: NextRequest,
	props: PageProps<GetMatchParams>
): Promise<NextResponse> => {
	const id = parseInt((await props.params).id, 10);
	const rows = await db
		.select()
		.from(matchTable)
		.leftJoin(gameTable, eq(matchTable.id, gameTable.matchId))
		.where(eq(matchTable.id, id));
	const [row] = rows;
	if (!row) {
		return NextResponse.json(null);
	}

	const { match } = row;
	const {
		blueTeamId,
		format,
		isPlayoffs,
		redTeamId,
		round,
		seasonId,
		timeSlot
	} = match;
	const games = leftHierarchy(rows, "game");

	return NextResponse.json({
		blueTeamId,
		format,
		gameIds: games.map((game) => game.id),
		id,
		isPlayoffs,
		redTeamId,
		round,
		seasonId,
		timeSlot
	});
};
