import {
	accountTable,
	draftPlayerTable,
	gameResultTable,
	gameTable,
	matchTable,
	playerTable,
	seasonTable,
	teamGameResultTable,
	teamPlayerTable,
	teamTable
} from "db/schema";
import { eq, or } from "drizzle-orm";
import AdminPanel from "./AdminPanel";
import Image from "components/Image";
import type { JSX } from "react";
import Link from "components/Link";
import MatchCard from "components/MatchCard";
import type { Metadata } from "next";
import type PageProps from "types/PageProps";
import PlayerCard from "components/PlayerCard";
import { auth } from "db/auth";
import db from "db/db";
import getPlayerUrl from "util/getPlayerUrl";
import getSeasonUrl from "util/getSeasonUrl";
import getTeamUrl from "util/getTeamUrl";
import leftHierarchy from "util/leftHierarchy";
import { redirect } from "next/navigation";
import style from "./page.module.scss";
import ugg from "util/ugg";

/**
 * Parameters that are passed to a team page.
 * @public
 */
export interface TeamsPageParams {
	/** The team's encoded vanity URL slug. */
	slug: string;
}

/**
 * A page that displays information about a team.
 * @param props - The properties that are passed to the page.
 * @returns The team page.
 * @public
 */
export default async function Page(
	props: PageProps<TeamsPageParams>
): Promise<JSX.Element> {
	const { slug } = await props.params;
	const seasonRows = await db
		.select()
		.from(seasonTable)
		.innerJoin(teamTable, eq(seasonTable.id, teamTable.seasonId))
		.leftJoin(teamPlayerTable, eq(teamTable.id, teamPlayerTable.teamId))
		.leftJoin(playerTable, eq(teamPlayerTable.playerId, playerTable.id))
		.leftJoin(accountTable, eq(playerTable.id, accountTable.playerId))
		.where(eq(teamTable.slug, decodeURIComponent(slug)));
	const [first] = seasonRows;
	if (!first) {
		redirect("/teams");
	}

	// Organize season, team, team player, player, and account data.
	const { season, team } = first;
	const teamPlayers = leftHierarchy(seasonRows, "teamPlayer");
	const players = leftHierarchy(seasonRows, "player");
	const accounts = leftHierarchy(seasonRows, "account");
	const captainId = teamPlayers.find(({ isCaptain }) => isCaptain)?.playerId;
	const captain = players.find(({ id }) => id === captainId);

	// Organize (other) team, match, game, game result, and team game result data.
	const matches = leftHierarchy(
		await db
			.select()
			.from(matchTable)
			.leftJoin(gameTable, eq(matchTable.id, gameTable.matchId))
			.leftJoin(
				gameResultTable,
				eq(gameTable.tournamentCode, gameResultTable.tournamentCode)
			)
			.leftJoin(
				teamGameResultTable,
				eq(gameResultTable.id, teamGameResultTable.gameResultId)
			)
			.where(
				or(
					eq(matchTable.blueTeamId, team.id),
					eq(matchTable.redTeamId, team.id)
				)
			),
		"match",
		"game",
		"gameResult",
		"teamGameResult"
	);
	const teamRows = await db
		.select()
		.from(teamTable)
		.leftJoin(teamPlayerTable, eq(teamTable.id, teamPlayerTable.teamId))
		.where(eq(teamTable.seasonId, team.seasonId));
	const teams = leftHierarchy(teamRows, "team");
	const allTeamPlayers = leftHierarchy(teamRows, "teamPlayer");
	return (
		<div className={style["content"]}>
			<header>
				<Image
					alt="Logo"
					src={team.logoUrl}
					untrusted
					width={512}
					height={512}
					style={{ border: `1px solid #${team.color}` }}
				/>
				<div>
					<h1>{`${team.code} | ${team.name}`}</h1>
					<p>
						<Link href={getSeasonUrl(season)}>{season.name}</Link>
						{`, Pool ${team.pool.toString()}`}
					</p>
					{captain && (
						<p>
							{"Captain: "}
							<Link href={getPlayerUrl(captain)}>
								{captain.displayName ?? captain.name}
							</Link>
						</p>
					)}
				</div>
			</header>
			<div>
				<div>
					<div>
						<header>
							<h2>
								{"Players"}
								{accounts.length > 0 && (
									<>
										{" | "}
										<Link href={ugg(...accounts)}>{"U.GG"}</Link>
									</>
								)}
							</h2>
						</header>
						<ul>
							{players.map((player) => (
								<li key={player.id}>
									<PlayerCard
										player={player}
										accounts={accounts.filter(
											({ playerId }) => playerId === player.id
										)}
									/>
								</li>
							))}
						</ul>
					</div>
					{(await auth())?.user?.isAdmin && (
						<AdminPanel
							team={team}
							teamPlayers={teamPlayers}
							players={players}
							potentialPlayers={(
								await db
									.select()
									.from(draftPlayerTable)
									.innerJoin(
										playerTable,
										eq(draftPlayerTable.playerId, playerTable.id)
									)
									.where(eq(draftPlayerTable.seasonId, season.id))
							)
								.filter(
									({ player }) =>
										!allTeamPlayers.find(
											({ playerId }) => playerId === player.id
										)
								)
								.map(({ player }) => player)}
							otherTeams={teams}
							className={style["admin"]}
						/>
					)}
				</div>
				<div>
					<div>
						<header>
							<h2>{"Match Schedule"}</h2>
						</header>
						<ol>
							{Array.from(matches)
								.sort(
									(
										{ value: { round: a, timeSlot: c, id: e } },
										{ value: { round: b, timeSlot: d, id: f } }
									) => a - b || c - d || e - f
								)
								.map(({ children: games, value: match }) => (
									<li key={match.id}>
										<MatchCard
											match={match}
											season={season}
											teams={teams}
											teamGameResults={games
												.flatMap(({ children }) => children)
												.flatMap(({ children }) => children)}
											dateTimeFormatOptions={{
												day: "numeric",
												hour: "numeric",
												minute: "numeric",
												month: "long",
												timeZoneName: "short",
												weekday: "long"
											}}
										/>
									</li>
								))}
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * The team page's metadata.
 * @param props - The properties that are passed to the page.
 * @returns The metadata.
 * @public
 */
export const generateMetadata = async (
	props: PageProps<TeamsPageParams>
): Promise<Metadata> => {
	const { slug: encoded } = await props.params;
	const slug = decodeURIComponent(encoded);
	const [team] = await db
		.select()
		.from(teamTable)
		.where(eq(teamTable.slug, slug))
		.limit(1);
	return team ?
			{
				description: `Gauntlet Championship Series team "${team.name}."`,
				openGraph: { images: team.logoUrl, url: getTeamUrl(team) },
				title: team.name
			}
		:	{
				description: "An unknown team in the Gauntlet Championship Series.",
				openGraph: { url: getTeamUrl({ slug }) },
				title: "Unknown Team"
			};
};
