import computeRegularSeasonStandings, {
	type MatchStandingInput,
	type TeamGameOutcome,
	type TeamStandingInput
} from "./standings";
import { describe, expect, it } from "vitest";
import MatchFormat from "types/MatchFormat";

const team = (id: number, pool = 1): TeamStandingInput => ({
	id,
	name: `Team ${id.toString()}`,
	pool,
	slug: `team-${id.toString()}`
});

/** Build a match from a sequence of winning team ids. */
const match = (
	format: MatchFormat,
	winners: readonly number[],
	losers: readonly number[],
	isPlayoffs = false
): MatchStandingInput => {
	const results: TeamGameOutcome[] = [
		...winners.map((teamId) => ({ isWinner: true, teamId })),
		...losers.map((teamId) => ({ isWinner: false, teamId }))
	];
	return { format, isPlayoffs, results };
};

describe("computeRegularSeasonStandings", () => {
	it("scores a Block-of-3 sweep without a bonus", () => {
		const standings = computeRegularSeasonStandings(
			[team(1), team(2)],
			[match(MatchFormat.BLOCK_OF_3, [1, 1, 1], [2, 2, 2])]
		);

		const [pool] = standings;
		expect(pool?.teams[0]).toEqual({ team: team(1), victoryPoints: 3 });
		expect(pool?.teams[1]).toEqual({ team: team(2), victoryPoints: 0 });
	});

	it("ranks teams within a pool by points descending", () => {
		const standings = computeRegularSeasonStandings(
			[team(1), team(2), team(3)],
			[
				match(MatchFormat.BLOCK_OF_3, [2, 2, 1], [1, 1, 2]), // 2 beats 1, 2-1
				match(MatchFormat.BLOCK_OF_3, [3, 3, 3], [1, 1, 1]) // 3 sweeps 1
			]
		);

		const [pool] = standings;
		expect(pool?.teams.map(({ team: { id } }) => id)).toEqual([3, 2, 1]);
		expect(pool?.teams.map(({ victoryPoints }) => victoryPoints)).toEqual([
			3, 2, 1
		]);
	});

	it("separates teams into pools, pools ascending", () => {
		const standings = computeRegularSeasonStandings(
			[team(1, 2), team(2, 1)],
			[]
		);
		expect(standings.map(({ pool }) => pool)).toEqual([1, 2]);
	});

	it("ignores playoff matches", () => {
		const standings = computeRegularSeasonStandings(
			[team(1), team(2)],
			[match(MatchFormat.BLOCK_OF_3, [1, 1, 1], [2, 2, 2], true)]
		);
		expect(
			standings[0]?.teams.every(({ victoryPoints }) => victoryPoints === 0)
		).toBe(true);
	});

	it("ignores results for teams not in the standings", () => {
		const standings = computeRegularSeasonStandings(
			[team(1)],
			[match(MatchFormat.BLOCK_OF_3, [1, 1], [99, 99, 1])]
		);
		// Team 1 won 2, lost 1 → 2 points. Team 99 is not ranked.
		expect(standings[0]?.teams).toEqual([{ team: team(1), victoryPoints: 2 }]);
	});
});
