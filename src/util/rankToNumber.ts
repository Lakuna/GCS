import type { accountRankEnum } from "db/schema";

const rankList = [
	"IV",
	"III",
	"II",
	"I"
] satisfies (typeof accountRankEnum.enumValues)[number][];

/**
 * Convert a rank string to a number that represents its order compared to other ranks (lower is worse).
 * @param rank - The rank string.
 * @returns The rank number.
 * @internal
 */
export default function rankToNumber(
	rank: (typeof accountRankEnum.enumValues)[number]
): number {
	return rankList.indexOf(rank);
}
