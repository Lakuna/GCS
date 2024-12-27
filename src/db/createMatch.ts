import { gameTable, matchTable } from "./schema";
import type Cluster from "types/riot/Cluster";
import type TournamentCodeParameters from "types/riot/TournamentCodeParameters";
import db from "./db";
import makeTournamentCodes from "riot/makeTournamentCodes";

/**
 * Create a match.
 * @param match - The match.
 * @param code - The tournament code to use for the first game in the match, or `undefined` to generate one.
 * @param params - The parameters to use if a tournament code needs to be generated.
 * @param cluster - The cluster to execute the request to make tournament codes against.
 * @param key - The Riot API key, or `undefined` to pull one from the environment variables.
 * @returns When finished.
 * @throws `Error` if the response has a bad status or if the Riot API key is missing.
 */
export default async function createMatch(
	match: typeof matchTable.$inferInsert,
	code?: string,
	params?: TournamentCodeParameters,
	cluster?: Cluster,
	key?: string
) {
	// Ensure that a tournament code is accessible before creating anything.
	const tournamentCode =
		code ??
		(await makeTournamentCodes(params, 1, match.seasonId, cluster, key))[0];
	if (!tournamentCode) {
		throw new Error("Failed to create a tournament code.");
	}

	// Create the match.
	await db.insert(matchTable).values(match);

	// Create the first game in the match.
	return await db.insert(gameTable).values({ tournamentCode });
}
