import getMatchScore, {
	type MatchGameResult,
	type MatchTeams
} from "./getMatchScore";
import type MatchFormat from "types/MatchFormat";
import getFormatGameCount from "util/getFormatGameCount";

/**
 * A match whose outcome can be decided: its two teams plus its format.
 * @public
 */
export interface DecidableMatch extends MatchTeams {
	/** The format of the match. */
	format: MatchFormat;
}

/**
 * Whether a match has already been won — i.e. a team has reached the number of
 * game wins required to take the match for its format.
 *
 * Used to decide whether another game needs to be created: once the match is
 * decided, no further game is required. Pure.
 * @param match - The match's teams and format.
 * @param results - The team game results in the match.
 * @returns Whether one of the teams has clinched the match.
 * @public
 */
export default function isMatchDecided(
	match: DecidableMatch,
	results: readonly MatchGameResult[]
): boolean {
	const [, , gamesToWin] = getFormatGameCount(match.format);
	const [blue, red] = getMatchScore(match, results);
	return blue >= gamesToWin || red >= gamesToWin;
}
