import type {
	MatchStandingInput,
	TeamGameOutcome
} from "core/standings/domain/standings";
import type {
	SeasonStandingsData,
	StandingsRepository
} from "core/standings/ports/StandingsRepository";
import {
	gameResultTable,
	gameTable,
	matchTable,
	teamGameResultTable,
	teamTable
} from "db/schema";
import database from "db/db";
import { eq } from "drizzle-orm";
import leftHierarchy from "util/leftHierarchy";

/**
 * A {@link StandingsRepository} backed by the Drizzle/Neon database. Maps
 * persistence rows onto the standings domain's types so the core never sees a
 * Drizzle row. The database client is injected (defaulting to the app
 * singleton) so the adapter itself can be exercised against a test double.
 * @public
 */
export default class DrizzleStandingsRepository implements StandingsRepository {
	/** The Drizzle database client this repository reads from. */
	private readonly db: typeof database;

	/**
	 * Create a repository.
	 * @param db - The Drizzle database client. Defaults to the app singleton.
	 */
	public constructor(db: typeof database = database) {
		this.db = db;
	}

	public async getSeasonStandingsData(
		seasonId: number
	): Promise<SeasonStandingsData> {
		const teams = (
			await this.db
				.select()
				.from(teamTable)
				.where(eq(teamTable.seasonId, seasonId))
		).map(({ id, name, pool, slug }) => ({ id, name, pool, slug }));

		// Flatten the joined rows into matches, each with its team game results.
		const matchRows = await this.db
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
			.where(eq(matchTable.seasonId, seasonId));

		const matches: MatchStandingInput[] = leftHierarchy(
			matchRows,
			"match",
			"teamGameResult"
		).map(({ value: match, children }) => ({
			format: match.format,
			isPlayoffs: match.isPlayoffs,
			results: children.reduce<TeamGameOutcome[]>(
				(outcomes, { isWinner, teamId }) => {
					// A team game result may not be tied to one of our teams.
					if (teamId !== null) {
						outcomes.push({ isWinner, teamId });
					}

					return outcomes;
				},
				[]
			)
		}));

		return { matches, teams };
	}
}
