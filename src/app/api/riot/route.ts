import { NextRequest, NextResponse } from "next/server";
import {
	accountTable,
	gameResultTable,
	gameTable,
	matchTable,
	playerTable,
	teamGameResultTable,
	teamPlayerTable,
	teamTable
} from "db/schema";
import { and, eq, or } from "drizzle-orm";
import type TournamentGames from "types/riot/TournamentGames";
import db from "db/db";
import getFormatGameCount from "util/getFormatGameCount";
import getPlatformForRegion from "util/getPlatformForRegion";
import leftHierarchy from "util/leftHierarchy";
import makeTournamentCodes from "riot/makeTournamentCodes";
import parseJsonSafe from "util/parseJsonSafe";
import saveGame from "util/saveGame";

/**
 * Receive a tournament code game callback.
 * @public
 */
export const POST = async (request: NextRequest): Promise<NextResponse> => {
	const games = parseJsonSafe(await request.text()) as TournamentGames[];
	if (games.length > 1) {
		return new NextResponse(
			"More than one game was returned. Did you use the same tournament code twice?",
			{ status: 400 }
		);
	}

	const [game] = games;
	if (!game) {
		return new NextResponse("No games were returned.", { status: 400 });
	}

	try {
		// Get relevant GCS game, match, player, and account data.
		const rows = await db
			.select()
			.from(gameTable)
			.leftJoin(matchTable, eq(gameTable.matchId, matchTable.id))
			.leftJoin(
				teamTable,
				or(
					eq(matchTable.blueTeamId, teamTable.id),
					eq(matchTable.redTeamId, teamTable.id)
				)
			)
			.leftJoin(teamPlayerTable, eq(teamTable.id, teamPlayerTable.teamId))
			.leftJoin(playerTable, eq(teamPlayerTable.playerId, playerTable.id))
			.leftJoin(accountTable, eq(playerTable.id, accountTable.playerId))
			.where(eq(gameTable.tournamentCode, game.shortCode));

		// Convert and store game results.
		await saveGame(
			game.gameId,
			new Map(
				leftHierarchy(rows, "team", "account").map(
					({ value: { id }, children: accounts }) => [
						id,
						accounts.map(({ puuid }) => puuid)
					]
				)
			),
			void 0,
			getPlatformForRegion(game.region)
		);

		// Get the match that the game belongs to.
		const [match] = leftHierarchy(rows, "match");
		if (!match) {
			return new NextResponse(void 0, { status: 200 });
		}

		// Count the number of wins that each team has.
		const winningTeamGameResults = leftHierarchy(
			await db
				.select()
				.from(matchTable)
				.leftJoin(gameTable, eq(matchTable.id, gameTable.matchId))
				.leftJoin(
					gameResultTable,
					eq(gameTable.tournamentCode, gameResultTable.tournamentCode)
				)
				.leftJoin(
					teamGameResultTable,
					eq(gameResultTable.id, teamGameResultTable.gameResultId)
				)
				.where(
					and(
						eq(matchTable.id, match.id),
						eq(teamGameResultTable.isWinner, true)
					)
				),
			"teamGameResult"
		);
		const wins = new Map<number, number>();
		for (const result of winningTeamGameResults) {
			if (!result.teamId) {
				continue;
			}

			wins.set(result.teamId, (wins.get(result.teamId) ?? 0) + 1);
		}

		// Check if another game needs to be made.
		const [, , toWin] = getFormatGameCount(match.format);
		if (wins.values().some((value) => value >= toWin)) {
			return new NextResponse(void 0, { status: 200 });
		}

		// Make a new tournament code for the next game.
		const [tournamentCode] = await makeTournamentCodes(
			void 0,
			1,
			match.seasonId
		);
		if (!tournamentCode) {
			return new NextResponse(void 0, { status: 200 });
		}

		// Create the next game.
		await db.insert(gameTable).values({ matchId: match.id, tournamentCode });
		return new NextResponse(void 0, { status: 200 });
	} catch (e) {
		return new NextResponse(JSON.stringify(e), { status: 500 });
	}
};
