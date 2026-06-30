import { describe, expect, it } from "vitest";
import isMatchDecided, { type DecidableMatch } from "./isMatchDecided";
import MatchFormat from "types/MatchFormat";
import type { MatchGameResult } from "./getMatchScore";

const decidable = (format: MatchFormat): DecidableMatch => ({
	blueTeamId: 10,
	format,
	redTeamId: 20
});

const won = (teamId: number): MatchGameResult => ({ isWinner: true, teamId });

describe("isMatchDecided", () => {
	it("is not decided before a team reaches the wins needed", () => {
		// Block of 3 needs 2 game wins to take the match.
		expect(isMatchDecided(decidable(MatchFormat.BLOCK_OF_3), [won(10)])).toBe(
			false
		);
	});

	it("is decided once a team reaches the wins needed", () => {
		expect(
			isMatchDecided(decidable(MatchFormat.BLOCK_OF_3), [won(10), won(10)])
		).toBe(true);
	});

	it("recognises either team winning", () => {
		expect(
			isMatchDecided(decidable(MatchFormat.BLOCK_OF_3), [won(20), won(20)])
		).toBe(true);
	});

	it("handles a single-game block format", () => {
		expect(isMatchDecided(decidable(MatchFormat.BLOCK_OF_1), [])).toBe(false);
		expect(isMatchDecided(decidable(MatchFormat.BLOCK_OF_1), [won(10)])).toBe(
			true
		);
	});
});
