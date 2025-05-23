import { gameTable, matchTable } from "db/schema";
import type Cluster from "types/riot/Cluster";
import type TournamentCodeParameters from "types/riot/TournamentCodeParameters";
import db from "db/db";
import makeTournamentCodes from "riot/makeTournamentCodes";

/**
 * Create matches and the first games in each match.
 * @param matches - The matches.
 * @param codes - The tournament codes to use for the first games in the matches, or `undefined` to generate the correct number of codes.
 * @param params - The parameters to use to generate tournament codes.
 * @param cluster - The cluster to execute the request to make tournament codes against.
 * @param key - The Riot API key, or `undefined` to pull one from the environment variables.
 * @returns When finished.
 * @throws `Error` if the response has a bad status, if the Riot API key is missing, or if there is a database error.
 * @public
 */
export default async function createMatchesWithGames(
	matches: (typeof matchTable.$inferInsert)[],
	codes?: string[],
	params?: TournamentCodeParameters,
	cluster?: Cluster,
	key?: string
) {
	// Ensure that tournament codes are accessible before creating anything.
	const tournamentCodes =
		codes ??
		(await makeTournamentCodes(
			params,
			matches.length,
			matches[0]?.seasonId,
			cluster,
			key
		));
	if (tournamentCodes.length < matches.length) {
		throw new Error("Not enough tournament codes!");
	}

	// Create the matches.
	const createdMatches = await db
		.insert(matchTable)
		.values(matches)
		.returning();

	// Build the games.
	const games = [];
	for (const { id: matchId } of createdMatches) {
		const tournamentCode = tournamentCodes.pop();
		if (!tournamentCode) {
			throw new Error("Not enough tournament codes!");
		}

		games.push({ matchId, tournamentCode });
	}

	// Create the games.
	await db.insert(gameTable).values(games);
}
