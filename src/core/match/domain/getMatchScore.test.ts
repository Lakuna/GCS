import { describe, expect, it } from "vitest";
import getMatchScore, { type MatchGameResult } from "./getMatchScore";

const match = { blueTeamId: 10, redTeamId: 20 };

const won = (teamId: number | null): MatchGameResult => ({
	isWinner: true,
	teamId
});

const lost = (teamId: number | null): MatchGameResult => ({
	isWinner: false,
	teamId
});

describe("getMatchScore", () => {
	it("counts wins for each team", () => {
		expect(
			getMatchScore(match, [won(10), lost(20), won(10), lost(20), won(20)])
		).toEqual([2, 1]);
	});

	it("returns zeroes for a match with no results", () => {
		expect(getMatchScore(match, [])).toEqual([0, 0]);
	});

	it("ignores losing results", () => {
		expect(getMatchScore(match, [lost(10), lost(20)])).toEqual([0, 0]);
	});

	it("ignores results for teams not in the match (incl. null)", () => {
		expect(getMatchScore(match, [won(10), won(99), won(null)])).toEqual([1, 0]);
	});
});
