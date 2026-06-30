/**
 * The two teams in a match, identified the way the match domain needs them.
 * Deliberately a small, persistence-agnostic shape rather than the Drizzle row.
 * @public
 */
export interface MatchTeams {
	/** The identifier of the blue team. */
	blueTeamId: number;

	/** The identifier of the red team. */
	redTeamId: number;
}

/**
 * The outcome of a single game for a single team within a match. `teamId` may be
 * null for results that are not tied to one of the match's teams.
 * @public
 */
export interface MatchGameResult {
	/** Whether the team won the game. */
	isWinner: boolean;

	/** The identifier of the team, if any. */
	teamId: number | null;
}

/**
 * Get the current score of a match: how many games the blue and red teams have
 * each won.
 *
 * Pure: depends only on its arguments. Results for teams other than the match's
 * blue and red teams (or with a null `teamId`) are ignored.
 * @param match - The match's two teams.
 * @param results - The team game results in the match.
 * @returns The number of games won by the blue and red teams, respectively.
 * @public
 */
export default function getMatchScore(
	match: MatchTeams,
	results: readonly MatchGameResult[]
): [number, number] {
	let blue = 0;
	let red = 0;
	for (const { isWinner, teamId } of results) {
		if (!isWinner) {
			continue;
		}

		switch (teamId) {
			case match.blueTeamId:
				blue++;
				continue;
			case match.redTeamId:
				red++;
				continue;
			default:
		}
	}

	return [blue, red];
}
