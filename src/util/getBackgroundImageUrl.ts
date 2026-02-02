import type { playerTable } from "db/schema";

/**
 * Get the URL of the image of the player's selected background skin.
 * @param player - The player.
 * @returns The URL, or `undefined` if the player hasn't selected a background skin.
 * @public
 */
export default function getBackgroundImageUrl({
	bgChamp,
	bgSkin
}: Pick<typeof playerTable.$inferSelect, "bgChamp" | "bgSkin">):
	| `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${string}_${string}.jpg`
	| undefined {
	return bgChamp && typeof bgSkin === "number" ?
			`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${bgChamp}_${bgSkin.toString()}.jpg`
		:	void 0;
}
