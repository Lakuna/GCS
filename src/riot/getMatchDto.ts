import Cluster from "types/riot/Cluster";
import type MatchDto from "types/riot/MatchDto";
import getRiotApiBaseUrl from "./getRiotApiBaseUrl";
import parseJsonSafe from "util/parseJsonSafe";
import riotFetch from "./riotFetch";

/**
 * Get a match in the Riot API.
 * @param id - The match's ID.
 * @param cluster - The cluster to use to make the request.
 * @param key - The Riot API key to use.
 * @returns The match.
 * @throws `Error` if the response has a bad status or if the Riot API key is missing.
 * @public
 */
export default async function getMatchDto(
	id: string,
	cluster = Cluster.AMERICAS,
	key: string | undefined = void 0
): Promise<MatchDto> {
	const response = await riotFetch(
		new URL(`/lol/match/v5/matches/${id}`, getRiotApiBaseUrl(cluster)).href,
		void 0,
		key
	);
	return parseJsonSafe<MatchDto>(await response.text());
}
