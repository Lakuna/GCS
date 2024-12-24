import type { playerGameResultsTable } from "./schema";

/**
 * Get a player's average kills plus assists per death ("KDA ratio" or "KDA").
 * @param games - The player game results to consider in the average.
 * @returns The player's KDA ratio.
 * @public
 */
export default function getAverageKda(
	games: (typeof playerGameResultsTable.$inferSelect)[]
) {
	let kills = 0;
	let deaths = 0;
	let assists = 0;
	for (const game of games) {
		kills += game.kills;
		deaths += game.deaths;
		assists += game.assists;
	}

	return (kills + assists) / deaths; // JavaScript automatically returns `Infinity` for divisions by zero.
}
