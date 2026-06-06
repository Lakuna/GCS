import type Region from "./Region";
import type TournamentTeam from "./TournamentTeam";

/**
 * A tournament code game.
 * @public
 */
export default interface TournamentGames {
	/** The members of the winning team. Not present in the callback. */
	winningTeam?: TournamentTeam[];

	/** The members of the losing team. Not present in the callback. */
	losingTeam?: TournamentTeam[];

	/** The tournament code associated with the game. */
	shortCode: string;

	/** The metadata associated with the game's tournament code. */
	metaData: string;

	/** The game's ID. Typed as string because Riot game IDs exceed JavaScript's safe integer range. */
	gameId: string;

	/** The game's name. */
	gameName: string;

	/** The game's type. */
	gameType: string;

	/** The game's map. */
	gameMap: number;

	/** The game's mode. */
	gameMode: string;

	/** The game's region. */
	region: Region;
}
