import type {
	gameResultTable,
	matchTable,
	seasonTable,
	teamGameResultTable
} from "db/schema";
import Platform from "types/riot/Platform";
import getMatchDateTime from "./getMatchDateTime";

/**
 * Create game result and team game result data representing a forfeit for the given match.
 * @param match - The match.
 * @param season - The season that the match is part of.
 * @param blueWon - Whether or not the match's blue team won the game.
 * @returns The game result and team game results.
 * @public
 */
export default function createForfeit(
	match: Pick<
		typeof matchTable.$inferSelect,
		"round" | "seasonId" | "timeSlot" | "blueTeamId" | "redTeamId"
	>,
	season: Pick<typeof seasonTable.$inferSelect, "startDate">,
	blueWon: boolean
): [
	typeof gameResultTable.$inferInsert,
	[
		typeof teamGameResultTable.$inferInsert,
		typeof teamGameResultTable.$inferInsert
	]
] {
	const now = Date.now();
	const id = (-now).toString();

	return [
		{
			duration: 0,
			id,
			map: 11,
			mode: "CLASSIC",
			queue: 0,
			region: Platform.NA1,
			startTimestamp: getMatchDateTime(match, season).valueOf(),
			tournamentCode: `FF-${now.toString(16)}`,
			type: "CUSTOM_GAME",
			version: "0.0.0.0"
		},
		[
			{
				gameResultId: id,
				isWinner: blueWon,
				team: 100,
				teamId: match.blueTeamId
			},
			{
				gameResultId: id,
				isWinner: !blueWon,
				team: 200,
				teamId: match.redTeamId
			}
		]
	];
}
