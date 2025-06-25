/**
 * A Riot summoner DTO.
 * @public
 */
export default interface SummonerDto {
	/** The encrypted account ID. */
	// `accountId: string;` // Removed

	/** The summoner's profile icon ID. */
	profileIconId: number;

	/** The date that the summoner was last modified (summoner name change, summoner level change, or profile icon change) as epoch milliseconds. */
	revisionDate: number;

	/** Encrypted summoner ID. */
	// `id: string;` // Removed

	/** Encrypted player universally unique ID. */
	puuid: string;

	/** Summoner level. */
	summonerLevel: number;
}
