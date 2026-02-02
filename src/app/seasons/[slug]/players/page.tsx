import {
	accountTable,
	draftPlayerTable,
	playerTable,
	seasonTable
} from "db/schema";
import { forbidden, redirect, unauthorized } from "next/navigation";
import DraftPlayerForm from "./DraftPlayerForm";
import type { JSX } from "react";
import type { Metadata } from "next";
import type PageProps from "types/PageProps";
import type { SeasonsPageParams } from "app/seasons/[slug]/page";
import { auth } from "db/auth";
import db from "db/db";
import { eq } from "drizzle-orm";
import getSeasonUrl from "util/getSeasonUrl";
import leftHierarchy from "util/leftHierarchy";
import style from "./page.module.scss";

/**
 * A page that displays information about a season's players.
 * @param props - The properties that are passed to the page.
 * @returns The season players page.
 * @public
 */
export default async function Page(
	props: PageProps<SeasonsPageParams>
): Promise<JSX.Element> {
	const session = await auth();
	if (!session?.user) {
		unauthorized();
	}

	if (!session.user.isAdmin) {
		forbidden();
	}

	const { slug } = await props.params;
	const seasonRows = await db
		.select()
		.from(seasonTable)
		.leftJoin(draftPlayerTable, eq(seasonTable.id, draftPlayerTable.seasonId))
		.leftJoin(playerTable, eq(draftPlayerTable.playerId, playerTable.id))
		.leftJoin(accountTable, eq(playerTable.id, accountTable.playerId))
		.where(eq(seasonTable.slug, decodeURIComponent(slug)));
	const [first] = seasonRows;
	if (!first) {
		redirect("/seasons");
	}

	const { season } = first;
	const players = leftHierarchy(seasonRows, "draftPlayer", "player", "account");

	return (
		<>
			<header>
				<h1>{`${season.name} Players`}</h1>
				<hr />
			</header>
			<ol className={style["widgets"]}>
				{players
					.sort(
						({ value: { registeredAt: a } }, { value: { registeredAt: b } }) =>
							a.valueOf() - b.valueOf()
					)
					.map(({ value: draftPlayer, children: rest }) => {
						const [player] = rest;
						if (!player) {
							return void 0;
						}

						return (
							<DraftPlayerForm
								draftPlayer={draftPlayer}
								player={player.value}
								accounts={player.children}
								key={draftPlayer.playerId}
							/>
						);
					})}
			</ol>
		</>
	);
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
				description: `The players for Gauntlet Championship Series ${season.name}.`,
				openGraph: { url: `${getSeasonUrl(season)}/players` },
				title: `${season.name} Players`
			}
		:	{
				description:
					"The players for an unknown season of the Gauntlet Championship Series.",
				openGraph: { url: `${getSeasonUrl({ slug })}/players` },
				title: "Unknown Season Players"
			};
};
