import { NextResponse } from "next/server";
import db from "db/db";
import { matchTable } from "db/schema";

/**
 * Get a list of identifying information of Gauntlet Championship Series matches (series).
 * @returns A list of identifying information of Gauntlet Championship Series matches (series).
 * @public
 */
export const GET = async (): Promise<NextResponse> =>
	NextResponse.json(
		(await db.select().from(matchTable)).map(
			({ id, round, seasonId, timeSlot }) => ({ id, round, seasonId, timeSlot })
		)
	);
