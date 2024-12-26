import db from "./db";
import { eq } from "drizzle-orm";
import { seasonsTable } from "./schema";

/**
 * Get a season by its vanity URL slug.
 * @param slug - The (decoded) vanity URL slug.
 * @returns The season, if any matches.
 * @public
 */
export const getSeasonByDecodedSlug = async (slug: string) => {
	return (
		await db
			.select()
			.from(seasonsTable)
			.where(eq(seasonsTable.vanityUrlSlug, slug))
			.limit(1)
	)[0];
};

/**
 * Decode a season's vanity URL slug.
 * @param slug - The encoded vanity URL slug.
 * @returns The decoded vanity URL slug.
 */
export const decodeSeasonSlug = (slug: string) => decodeURIComponent(slug);

/**
 * Get a season by its vanity URL slug.
 * @param slug - The (encoded) vanity URL slug.
 * @returns The season, if any matches.
 * @public
 */
export default async function getSeasonByEncodedSlug(slug: string) {
	return getSeasonByDecodedSlug(decodeSeasonSlug(slug));
}
