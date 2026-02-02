import { type JSX } from "react";
import type { Metadata } from "next";
import type PageProps from "types/PageProps";
import Refresher from "./Refresher";
import type { SeasonsPageParams } from "app/seasons/[slug]/page";
import { auth } from "db/auth";
import db from "db/db";
import { eq } from "drizzle-orm";
import getSeasonUrl from "util/getSeasonUrl";
import { seasonTable } from "db/schema";

/**
 * A page that displays information about a season's players.
 * @param props - The properties that are passed to the page.
 * @returns The season players page.
 * @public
 */
export default async function Page(
	props: PageProps<SeasonsPageParams>
): Promise<JSX.Element> {
	const params = await props.params;

	return <Refresher slug={params.slug} session={await auth()} />;
}

/**
 * The season players page's metadata.
 * @param props - The properties that are passed to the page.
 * @returns The metadata.
 * @public
 */
export const generateMetadata = async (
	props: PageProps<SeasonsPageParams>
): Promise<Metadata> => {
	const { slug: encoded } = await props.params;
	const slug = decodeURIComponent(encoded);
	const [season] = await db
		.select()
		.from(seasonTable)
		.where(eq(seasonTable.slug, slug))
		.limit(1);
	return season ?
			{
				description: `The draft for Gauntlet Championship Series ${season.name}.`,
				openGraph: { url: `${getSeasonUrl(season)}/draft` },
				title: `${season.name} Draft`
			}
		:	{
				description:
					"The draft for an unknown season of the Gauntlet Championship Series.",
				openGraph: { url: `${getSeasonUrl({ slug })}/draft` },
				title: "Unknown Season Draft"
			};
};
