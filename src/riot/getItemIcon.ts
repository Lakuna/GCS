import getDataDragonVersion from "./getDataDragonVersion";

/**
 * Get the URl of a item's icon.
 * @param id - The item's ID.
 * @returns The URL of the item's icon.
 * @public
 */
export default async function getItemIcon(
	id: number | `${number}`
): Promise<string | undefined> {
	const version = await getDataDragonVersion();
	return version ?
			`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id.toString()}.png`
		:	void 0;
}
