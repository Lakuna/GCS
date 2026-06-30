import calculateTeamMatchPoints, { isBlockFormat } from "./matchScoring";
import { describe, expect, it } from "vitest";
import MatchFormat from "types/MatchFormat";

describe("isBlockFormat", () => {
	it("treats block formats as block formats", () => {
		expect(isBlockFormat(MatchFormat.BLOCK_OF_1)).toBe(true);
		expect(isBlockFormat(MatchFormat.BLOCK_OF_3)).toBe(true);
	});

	it("treats best-of formats as non-block formats", () => {
		expect(isBlockFormat(MatchFormat.BEST_OF_3)).toBe(false);
		expect(isBlockFormat(MatchFormat.BEST_OF_5)).toBe(false);
		expect(isBlockFormat(MatchFormat.BEST_OF_7)).toBe(false);
	});
});

describe("calculateTeamMatchPoints — Block of 3 (the sweep bug)", () => {
	it("awards no bonus for a sweep: 3-0 is worth 3, not 4", () => {
		// The bug: a Block-of-3 sweep used to be scored 3 + (2 - 1 - 0) = 4.
		expect(calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 3, 0)).toBe(3);
	});

	it("awards one point per game won for a 2-1", () => {
		expect(calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 2, 1)).toBe(2);
	});

	it("awards the loser their game wins", () => {
		expect(calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 1, 2)).toBe(1);
		expect(calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 0, 3)).toBe(0);
	});

	it("keeps a sweep and a 2-1 worth the same in total (3) across both teams", () => {
		const sweep =
			calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 3, 0) +
			calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 0, 3);
		const close =
			calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 2, 1) +
			calculateTeamMatchPoints(MatchFormat.BLOCK_OF_3, 1, 2);
		expect(sweep).toBe(3);
		expect(close).toBe(3);
	});
});

describe("calculateTeamMatchPoints — Block of 1", () => {
	it("awards one point for the single game", () => {
		expect(calculateTeamMatchPoints(MatchFormat.BLOCK_OF_1, 1, 0)).toBe(1);
		expect(calculateTeamMatchPoints(MatchFormat.BLOCK_OF_1, 0, 1)).toBe(0);
	});
});

describe("calculateTeamMatchPoints — best-of formats (unchanged)", () => {
	it("credits a best-of-3 sweep winner for the unplayed game (2-0 → 3)", () => {
		// Preserves existing behaviour: the series ended early, so the winner is
		// Credited for the game that was never played to keep the series total
		// Constant. This is not a bonus — it never exceeds the games to win.
		expect(calculateTeamMatchPoints(MatchFormat.BEST_OF_3, 2, 0)).toBe(3);
	});

	it("scores a best-of-3 that went the distance (2-1 → 2, loser → 1)", () => {
		expect(calculateTeamMatchPoints(MatchFormat.BEST_OF_3, 2, 1)).toBe(2);
		expect(calculateTeamMatchPoints(MatchFormat.BEST_OF_3, 1, 2)).toBe(1);
	});

	it("keeps the series total constant regardless of how early it ended", () => {
		const sweep =
			calculateTeamMatchPoints(MatchFormat.BEST_OF_3, 2, 0) +
			calculateTeamMatchPoints(MatchFormat.BEST_OF_3, 0, 2);
		const close =
			calculateTeamMatchPoints(MatchFormat.BEST_OF_3, 2, 1) +
			calculateTeamMatchPoints(MatchFormat.BEST_OF_3, 1, 2);
		expect(sweep).toBe(3);
		expect(close).toBe(3);
	});
});
