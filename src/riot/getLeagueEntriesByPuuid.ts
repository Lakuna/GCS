import type LeagueEntryDto from "types/riot/LeagueEntryDto";
import Platform from "types/riot/Platform";
import getRiotApiBaseUrl from "./getRiotApiBaseUrl";
import riotFetch from "./riotFetch";

/**
 * Get a league entry in the Riot API.
 * @param id - The summoner ID.
 * @param platform - The platform to use to make the request.
 * @param key - The Riot API key to use.
 * @returns The league entry.
 * @throws `Error` if the response has a bad status or if the Riot API key is missing.
 * @public
 */
export default async function getLeagueEntriesByPuuid(
	puuid: string,
	platform: Platform = Platform.NA1,
	key: string | undefined = void 0
): Promise<LeagueEntryDto[]> {
	return (await (
		await riotFetch(
			new URL(
				`/lol/league/v4/entries/by-puuid/${puuid}`,
				getRiotApiBaseUrl(platform)
			).href,
			void 0,
			key
		)
	).json()) as LeagueEntryDto[];
}
