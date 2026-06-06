import type ParticipantDto from "./ParticipantDto";
import type Platform from "./Platform";
import type Region from "./Region";
import type TeamDto from "./TeamDto";

/**
 * Information about a match.
 * @public
 */
export default interface InfoDto {
	/** Indicates whether or not the game ended in termination. */
	endOfGameResult: string;

	/** The Unix timestamp at which the game was created on the game server. */
	gameCreation: number;

	/** The game's length in seconds or, for games played prior to patch 11.20, the game's length in milliseconds. It is best to treat this value as milliseconds if the `gameEndTimestamp` field isn't in the response or as seconds otherwise. */
	gameDuration: number;

	/** The Unix timestamp at which the game ended on the game server. Can occasionally be significantly later than when the match actually ends, so it is better to determine the timestamp of the end of the match by adding the `gameDuration` to the `gameStartTimestamp`. Added on patch 11.20. */
	gameEndTimestamp?: number;

	/** The game's ID. Typed as string because Riot game IDs exceed JavaScript's safe integer range. */
	gameId: string;

	/** The game's mode. */
	gameMode: string;

	/** The game's name. */
	gameName: string;

	/** The Unix timestamp at which the game was started on the game server. */
	gameStartTimestamp: number;

	/** The game's type. */
	gameType: string;

	/** The game's version. The first two parts can be used to determine the patch that the game was played on. */
	gameVersion: `${number}.${number}.${number}.${number}`;

	/** The game's map's ID. */
	mapId: number;

	/** The participants in the match. */
	participants: ParticipantDto[];

	/** The platform where the match was played. */
	platformId: Platform;

	/** The game's queue's ID. */
	queueId: number;

	/** The teams in the match. */
	teams: TeamDto[];

	/** The tournament code used to generate the match. Added in patch 11.13. */
	tournamentCode?:
		| `${Region | "STUB"}${string}-${string}-${string}-${string}-${string}-${string}`
		| ""; // Empty string for games without tournament codes.
}
