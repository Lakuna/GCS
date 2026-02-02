import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { matchTable, teamPlayerTable, teamTable } from "db/schema";
import type PageProps from "types/PageProps";
import db from "db/db";
import leftHierarchy from "util/leftHierarchy";

/**
 * Get team parameters.
 * @public
 */
export interface GetTeamParams {
	/** The ID of the team. */
	id: string; // `${number}`;
}

/**
 * Get a Gauntlet Championship Series team.
 * @param _ - The request.
 * @param props - The page properties.
 * @returns A Gauntlet Championship Series team.
 * @public
 */
export const GET = async (
	_: NextRequest,
	props: PageProps<GetTeamParams>
): Promise<NextResponse> => {
	const id = parseInt((await props.params).id, 10);
	const rows = await db
		.select()
		.from(teamTable)
		.leftJoin(teamPlayerTable, eq(teamTable.id, teamPlayerTable.teamId))
		.where(eq(teamTable.id, id));
	const [row] = rows;
	if (!row) {
		return NextResponse.json(null);
	}

	const { team } = row;
	const {
		code,
		color,
		draftOrder,
		isWinner,
		logoUrl,
		name,
		pool,
		seasonId,
		slug
	} = team;
	const players = leftHierarchy(rows, "teamPlayer");
	const matches = await db
		.select()
		.from(matchTable)
		.where(or(eq(matchTable.blueTeamId, id), eq(matchTable.redTeamId, id)));

	return NextResponse.json({
		code,
		color,
		draftOrder,
		id,
		isWinner: Boolean(isWinner),
		logoUrl,
		matchIds: matches.map((match) => match.id),
		name,
		players: players.map(({ playerId, isCaptain }) => ({
			id: playerId,
			isCaptain: Boolean(isCaptain)
		})),
		pool,
		seasonId,
		slug
	});
};
