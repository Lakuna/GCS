import MatchFormat from "types/MatchFormat";
import getFormatGameCount from "util/getFormatGameCount";

/**
 * Whether a match format is a "block" format, in which every game is played
 * regardless of the score.
 *
 * Block formats (e.g. Block of 3) always play their full game count — unlike
 * "best of" formats, which stop as soon as one team is mathematically
 * guaranteed the series win.
 * @param format - The match format.
 * @returns Whether the format plays all of its games unconditionally.
 * @public
 */
export const isBlockFormat = (format: MatchFormat): boolean => {
	switch (format) {
		case MatchFormat.BLOCK_OF_1:
		case MatchFormat.BLOCK_OF_3:
			return true;
		case MatchFormat.BEST_OF_3:
		case MatchFormat.BEST_OF_5:
		case MatchFormat.BEST_OF_7:
			return false;
		default:
			return format;
	}
};

/**
 * Calculate the regular-season victory points a team earns from a single match.
 *
 * League rule: **one game won is worth one point, with no bonus for a sweep.**
 *
 * - **Block formats** play every game, so a team's points are simply the number
 *   of games it won (a 3-0 Block of 3 is worth 3, a 2-1 is worth 2). This is the
 *   behaviour the league wants everywhere, and fixes the bug where a Block-of-3
 *   sweep was awarded a phantom extra point.
 * - **Best-of formats** stop early once the series is decided, so the loser of a
 *   sweep was never given the chance to play (and lose) the remaining games. To
 *   keep a series' total points constant regardless of how early it ended, the
 *   series winner is credited for the games that were not played. The winner
 *   still earns no _bonus_: their total never exceeds the games needed to win.
 * @param format - The match format.
 * @param gamesWon - The number of games the team won in the match.
 * @param gamesLost - The number of games the team lost in the match.
 * @returns The victory points the team earned from the match.
 * @public
 */
export default function calculateTeamMatchPoints(
	format: MatchFormat,
	gamesWon: number,
	gamesLost: number
): number {
	// Block formats play every game, so one game won is one point: no bonus.
	if (isBlockFormat(format)) {
		return gamesWon;
	}

	// Best-of formats end early, so the winner is credited for unplayed games.
	// Their total still never exceeds the games needed to win the series.
	const [, , gamesToWin] = getFormatGameCount(format);
	return gamesWon < gamesToWin ? gamesWon : (
			gamesWon + (gamesToWin - 1 - gamesLost)
		);
}
