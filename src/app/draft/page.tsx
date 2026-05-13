import type { Metadata } from "next";
import db from "db/db";
import { desc } from "drizzle-orm";
import getSeasonUrl from "util/getSeasonUrl";
import { redirect } from "next/navigation";
import { seasonTable } from "db/schema";

/**
 * Redirect to the latest season's draft page.
 * @public
 */
export default async function Page(): Promise<never> {
	const [latestSeason] = await db
		.select()
		.from(seasonTable)
		.orderBy(desc(seasonTable.startDate))
		.limit(1);

	redirect(latestSeason ? `${getSeasonUrl(latestSeason)}/draft` : "/seasons");
}

/**
 * The latest draft redirect page's metadata.
 * @public
 */
export const metadata = {
	description: "The latest Gauntlet Championship Series draft.",
	openGraph: { url: "/draft" },
	title: "Draft"
} satisfies Metadata;
