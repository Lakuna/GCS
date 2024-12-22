import db from "./db";
import { desc } from "drizzle-orm";
import { seasonsTable } from "./schema";

/**
 * Get the latest season by start date.
 * @returns The season, if any exists.
 * @public
 */
export default async function getLatestSeason(): Promise<
	typeof seasonsTable.$inferSelect | undefined
> {
	const [season] = await db
		.select()
		.from(seasonsTable)
		.orderBy(desc(seasonsTable.startDate))
		.limit(1);
	return season;
}
