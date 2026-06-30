import computeRegularSeasonStandings, {
	type PoolStanding
} from "../domain/standings";
import type { StandingsRepository } from "../ports/StandingsRepository";

/**
 * The dependencies required by {@link getRegularSeasonStandings}. Injected by
 * the caller so the use case can be exercised against a fake repository in unit
 * tests and the real Drizzle adapter in production.
 * @public
 */
export interface GetRegularSeasonStandingsDeps {
	/** The repository used to load the season's standings data. */
	repository: StandingsRepository;
}

/**
 * Compute the regular-season standings for a season.
 *
 * Orchestration only: load the data through the injected repository port, then
 * delegate the ranking to the pure standings domain.
 * @param seasonId - The identifier of the season to rank.
 * @param deps - The injected dependencies.
 * @returns The season's standings, grouped by pool.
 * @public
 */
export default async function getRegularSeasonStandings(
	seasonId: number,
	{ repository }: GetRegularSeasonStandingsDeps
): Promise<PoolStanding[]> {
	const { matches, teams } = await repository.getSeasonStandingsData(seasonId);
	return computeRegularSeasonStandings(teams, matches);
}
