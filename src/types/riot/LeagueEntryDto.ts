import type AccountRank from "./AccountRank";
import type AccountTier from "./AccountTier";
import type MiniSeriesDto from "./MiniSeriesDto";
import type QueueType from "./QueueType";

/**
 * A summoner's rank information.
 * @public
 */
export default interface LeagueEntryDto {
	/** The ID of the ranked league. */
	leagueId: string;

	/** The summoner ID of the summoner. */
	// `summonerId: string;` // Removed

	/** The queue type. */
	queueType: QueueType;

	/** The summoner's tier. */
	tier: AccountTier;

	/** The summoner's rank. */
	rank: AccountRank;

	/** The player's league points (LP). */
	leaguePoints: number;

	/** The number of wins that the player has. */
	wins: number;

	/** The number of losses that the player has. */
	losses: number;

	/** Whether or not the player is on a hot (win) streak. */
	hotStreak: boolean;

	/** Whether or not the player is a veteran. */
	veteran: boolean;

	/** Whether or not the player is new to the league. */
	freshBlood: boolean;

	/** Whether or not the player is inactive. */
	inactive: boolean;

	/** Mini series. */
	miniSeries: MiniSeriesDto;
}
