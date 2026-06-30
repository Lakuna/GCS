import type MatchFormat from "types/MatchFormat";
import calculateTeamMatchPoints from "./matchScoring";

/**
 * A team as the standings domain needs to know it. Deliberately a small,
 * persistence-agnostic shape rather than the Drizzle row, so the domain does not
 * depend on the database schema.
 * @public
 */
export interface TeamStandingInput {
	/** The team's unique identifier. */
	id: number;

	/** The team's display name. */
	name: string;

	/** The pool the team competes in. Teams are ranked within their pool. */
	pool: number;

	/** The team's vanity URL slug. */
	slug: string;
}

/**
 * The outcome of a single game for a single team within a match.
 * @public
 */
export interface TeamGameOutcome {
	/** Whether the team won the game. */
	isWinner: boolean;

	/** The identifier of the team. */
	teamId: number;
}

/**
 * A match as the standings domain needs to know it.
 * @public
 */
export interface MatchStandingInput {
	/** The format of the match. */
	format: MatchFormat;

	/** Whether the match is part of playoffs (excluded from regular standings). */
	isPlayoffs: boolean;

	/** The per-team, per-game outcomes that make up the match. */
	results: readonly TeamGameOutcome[];
}

/**
 * A team's standing: the team and the victory points it has earned.
 * @public
 */
export interface TeamStanding {
	/** The team. */
	team: TeamStandingInput;

	/** The team's total regular-season victory points. */
	victoryPoints: number;
}

/**
 * The standings of a single pool, with teams ranked best-first.
 * @public
 */
export interface PoolStanding {
	/** The pool number. */
	pool: number;

	/** The teams in the pool, ordered by victory points (descending). */
	teams: readonly TeamStanding[];
}

/**
 * Compute the regular-season standings for a set of teams and matches.
 *
 * Pure: given the same teams and matches it always returns the same standings,
 * performs no I/O, and depends only on the scoring domain. Playoff matches are
 * ignored. Teams are grouped by pool, and both pools and the teams within them
 * are returned in display order (pools ascending, teams by points descending).
 * @param teams - The teams to rank.
 * @param matches - The matches to score.
 * @returns The standings, grouped by pool.
 * @public
 */
export default function computeRegularSeasonStandings(
	teams: readonly TeamStandingInput[],
	matches: readonly MatchStandingInput[]
): PoolStanding[] {
	const pointsByTeamId = new Map<number, number>();
	for (const team of teams) {
		pointsByTeamId.set(team.id, 0);
	}

	for (const match of matches) {
		// Playoff matches do not count toward regular-season standings.
		if (match.isPlayoffs) {
			continue;
		}

		// Tally each team's wins and losses within this match.
		const recordByTeamId = new Map<number, [number, number]>();
		for (const { isWinner, teamId } of match.results) {
			let record = recordByTeamId.get(teamId);
			if (!record) {
				record = [0, 0];
				recordByTeamId.set(teamId, record);
			}

			if (isWinner) {
				record[0]++;
			} else {
				record[1]++;
			}
		}

		// Award each team its victory points for the match.
		for (const [teamId, [gamesWon, gamesLost]] of recordByTeamId) {
			const current = pointsByTeamId.get(teamId);

			// Ignore results for a team that is not in the standings (e.g. removed).
			if (typeof current !== "number") {
				continue;
			}

			pointsByTeamId.set(
				teamId,
				current + calculateTeamMatchPoints(match.format, gamesWon, gamesLost)
			);
		}
	}

	// Group teams into pools.
	const poolsByNumber = new Map<number, TeamStanding[]>();
	for (const team of teams) {
		const standing: TeamStanding = {
			team,
			victoryPoints: pointsByTeamId.get(team.id) ?? 0
		};

		const pool = poolsByNumber.get(team.pool);
		if (pool) {
			pool.push(standing);
		} else {
			poolsByNumber.set(team.pool, [standing]);
		}
	}

	// Return pools in ascending order, teams within each pool by points desc.
	return Array.from(poolsByNumber)
		.sort(([a], [b]) => a - b)
		.map(([pool, poolTeams]) => ({
			pool,
			teams: poolTeams.sort(
				({ victoryPoints: a }, { victoryPoints: b }) => b - a
			)
		}));
}
