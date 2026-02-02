import getDataDragonVersion from "./getDataDragonVersion";

/**
 * Get the URl of a champion's icon.
 * @param id - The champion's ID (referred to as the champion's name in the Riot API).
 * @returns The URL of the champion's icon.
 * @public
 */
export default async function getChampionIcon(
	id: string
): Promise<string | undefined> {
	const version = await getDataDragonVersion();
	return version ?
			`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${id}.png`
		:	void 0;
}
