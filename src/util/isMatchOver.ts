import type { matchTable, seasonTable } from "db/schema";
import { TIME_SLOT_DURATION } from "./const";
import getMatchDateTime from "./getMatchDateTime";

/**
 * Determine whether the given match took place in the past.
 * @param match - The match.
 * @param season - The match's season.
 * @returns Whether or not the match is over.
 * @public
 */
export default function isMatchOver(
	match: Pick<
		typeof matchTable.$inferSelect,
		"round" | "seasonId" | "timeSlot"
	>,
	season: Pick<typeof seasonTable.$inferSelect, "startDate">
): boolean {
	const start = getMatchDateTime(match, season).valueOf();
	const now = Date.now();
	return start + TIME_SLOT_DURATION * 1000 * 60 * 60 < now;
}
