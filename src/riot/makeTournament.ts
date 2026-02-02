import Cluster from "types/riot/Cluster";
import type TournamentRegistrationParameters from "types/riot/TournamentRegistrationParameters";
import getRiotApiBaseUrl from "./getRiotApiBaseUrl";
import getTournamentProvider from "util/getTournamentProvider";
import riotFetch from "./riotFetch";

/**
 * Make a tournament in the Riot API.
 * @param params - The tournament registration parameters or the name of the tournament.
 * @param cluster - The cluster to use to make the request.
 * @param key - The Riot API key to use.
 * @returns The tournament ID.
 * @throws `Error` if the response has a bad status or if the Riot API key is missing.
 * @public
 */
export default async function makeTournament(
	params?: TournamentRegistrationParameters | string,
	cluster = Cluster.AMERICAS,
	key: string | undefined = void 0
): Promise<number> {
	return (await (
		await riotFetch(
			new URL("/lol/tournament/v5/tournaments", getRiotApiBaseUrl(cluster))
				.href,
			{
				body: JSON.stringify(
					params ?
						typeof params === "string" ?
							{ name: params, providerId: (await getTournamentProvider()).id }
						:	params
					:	{ providerId: (await getTournamentProvider()).id }
				),
				method: "POST"
			},
			key
		)
	).json()) as number;
}
