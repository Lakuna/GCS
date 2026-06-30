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
import getPlatformForRegion from "util/getPlatformForRegion";
import isMatchDecided from "core/match/domain/isMatchDecided";
import leftHierarchy from "util/leftHierarchy";
import makeTournamentCodes from "riot/makeTournamentCodes";
import saveGame from "util/saveGame";

/**
 * Receive a tournament code game callback.
 * @public
 */
export const POST = async (request: NextRequest): Promise<NextResponse> => {
	const games = (await request.json()) as TournamentGames[];
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

		// Load the winning game results for the match.
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

		// If the match is already decided, no further game is needed.
		if (isMatchDecided(match, winningTeamGameResults)) {
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
