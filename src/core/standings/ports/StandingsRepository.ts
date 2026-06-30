import type {
	MatchStandingInput,
	TeamStandingInput
} from "../domain/standings";

/**
 * The teams and matches a season needs in order to compute its standings,
 * expressed entirely in the standings domain's own types.
 * @public
 */
export interface SeasonStandingsData {
	/** The matches played in the season. */
	matches: readonly MatchStandingInput[];

	/** The teams competing in the season. */
	teams: readonly TeamStandingInput[];
}

/**
 * A port describing what the standings use case needs from persistence: the
 * data required to rank a season's teams. The core depends on this interface;
 * adapters (e.g. a Drizzle-backed repository) provide the implementation.
 * @public
 */
export interface StandingsRepository {
	/**
	 * Load the teams and match results for a season.
	 * @param seasonId - The identifier of the season.
	 * @returns The season's standings data, mapped to domain types.
	 */
	getSeasonStandingsData(seasonId: number): Promise<SeasonStandingsData>;
}
