import type {
	SeasonStandingsData,
	StandingsRepository
} from "../ports/StandingsRepository";
import { describe, expect, it } from "vitest";
import MatchFormat from "types/MatchFormat";
import getRegularSeasonStandings from "./getRegularSeasonStandings";

/**
 * An in-memory {@link StandingsRepository} for testing. This is the payoff of
 * dependency injection: the use case runs with no database, mocking framework,
 * or network.
 */
class FakeStandingsRepository implements StandingsRepository {
	public calledWith: number[] = [];

	public constructor(private readonly data: SeasonStandingsData) {}

	public getSeasonStandingsData(
		seasonId: number
	): Promise<SeasonStandingsData> {
		this.calledWith.push(seasonId);
		return Promise.resolve(this.data);
	}
}

describe("getRegularSeasonStandings", () => {
	it("loads via the injected repository and applies the domain scoring", async () => {
		const repository = new FakeStandingsRepository({
			matches: [
				{
					format: MatchFormat.BLOCK_OF_3,
					isPlayoffs: false,
					results: [
						{ isWinner: true, teamId: 1 },
						{ isWinner: true, teamId: 1 },
						{ isWinner: true, teamId: 1 },
						{ isWinner: false, teamId: 2 },
						{ isWinner: false, teamId: 2 },
						{ isWinner: false, teamId: 2 }
					]
				}
			],
			teams: [
				{ id: 1, name: "Alpha", pool: 1, slug: "alpha" },
				{ id: 2, name: "Bravo", pool: 1, slug: "bravo" }
			]
		});

		const standings = await getRegularSeasonStandings(42, { repository });

		// The repository was asked for the right season.
		expect(repository.calledWith).toEqual([42]);

		// And the sweep was scored without a bonus (3, not 4).
		expect(standings[0]?.teams[0]).toEqual({
			team: { id: 1, name: "Alpha", pool: 1, slug: "alpha" },
			victoryPoints: 3
		});
	});
});
