import { and, eq } from "drizzle-orm";
import {
	draftPlayerTable,
	gameResultTable,
	gameTable,
	matchTable,
	seasonTable,
	teamGameResultTable,
	teamTable
} from "db/schema";
import AdminPanel from "./AdminPanel";
import type { JSX } from "react";
import Link from "components/Link";
import MatchCard from "components/MatchCard";
import type { Metadata } from "next";
import type PageProps from "types/PageProps";
import RoundHeader from "./RoundHeader";
import { auth } from "db/auth";
import db from "db/db";
import getFormatGameCount from "util/getFormatGameCount";
import getMatchDateTime from "util/getMatchDateTime";
import getSeasonUrl from "util/getSeasonUrl";
import getTeamUrl from "util/getTeamUrl";
import isMatchOver from "util/isMatchOver";
import leftHierarchy from "util/leftHierarchy";
import { redirect } from "next/navigation";
import style from "./page.module.scss";

/**
 * Parameters that are passed to a season page.
 * @public
 */
export interface SeasonsPageParams {
	/** The season's encoded vanity URL slug. */
	slug: string;
}

/**
 * A page that displays information about a season.
 * @param props - The properties that are passed to the page.
 * @returns The season page.
 * @public
 */
export default async function Page(
	props: PageProps<SeasonsPageParams>
): Promise<JSX.Element> {
	const { slug } = await props.params;
	const seasonRows = await db
		.select()
		.from(seasonTable)
		.leftJoin(matchTable, eq(seasonTable.id, matchTable.seasonId))
		.leftJoin(gameTable, eq(matchTable.id, gameTable.matchId))
		.leftJoin(
			gameResultTable,
			eq(gameTable.tournamentCode, gameResultTable.tournamentCode)
		)
		.leftJoin(
			teamGameResultTable,
			eq(gameResultTable.id, teamGameResultTable.gameResultId)
		)
		.where(eq(seasonTable.slug, decodeURIComponent(slug)));
	const [first] = seasonRows;
	if (!first) {
		redirect("/seasons");
	}

	// Organize season, match, game, game result, and team game result data.
	const { season } = first;
	const matches = leftHierarchy(
		seasonRows,
		"match",
		"game",
		"gameResult",
		"teamGameResult"
	);
	const rounds = matches.reduce((previousValue, currentValue) => {
		void (
			previousValue.get(currentValue.value.round)?.push(currentValue) ??
			previousValue.set(currentValue.value.round, [currentValue])
		);
		return previousValue;
	}, new Map<number, (typeof matches)[number][]>());
	const isPlayoffsInProgress = matches.some(
		({ value: match }) => match.isPlayoffs && !isMatchOver(match, season)
	);

	// Determine the next upcoming round.
	let upcomingRound = 0;
	for (const [round, [firstMatchRow]] of Array.from(rounds).sort(
		([a], [b]) => a - b
	)) {
		if (!firstMatchRow) {
			continue;
		}

		if (
			getMatchDateTime(firstMatchRow.value, season).valueOf() >
			// TODO
			// eslint-disable-next-line react-hooks/purity
			Date.now() - 1000 * 60 * 60 * 12
		) {
			upcomingRound = round;
			break;
		}
	}

	// Sort teams by pool and score for the leaderboard.
	const teams = await db
		.select()
		.from(teamTable)
		.where(eq(teamTable.seasonId, season.id));
	const teamScores = teams.map((team) => ({ team, victoryPoints: 0 }));
	for (const matchTeamGameResults of leftHierarchy(
		seasonRows,
		"match",
		"teamGameResult"
	)) {
		// Don't count playoffs games in regular season standings.
		if (matchTeamGameResults.value.isPlayoffs) {
			continue;
		}

		const matchTeamScores = new Map<number, [number, number]>();
		for (const teamGameResult of matchTeamGameResults.children) {
			if (!teamGameResult.teamId) {
				continue;
			}

			let matchTeamScore = matchTeamScores.get(teamGameResult.teamId);
			if (!matchTeamScore) {
				matchTeamScore = [0, 0];
				matchTeamScores.set(teamGameResult.teamId, matchTeamScore);
			}

			if (teamGameResult.isWinner) {
				matchTeamScore[0]++;
				continue;
			}

			matchTeamScore[1]++;
		}

		const [, , scoreToWin] = getFormatGameCount(
			matchTeamGameResults.value.format
		);

		for (const [teamId, matchScore] of matchTeamScores) {
			const teamScore = teamScores.find(({ team: { id } }) => id === teamId);
			if (!teamScore) {
				continue;
			}

			teamScore.victoryPoints +=
				matchScore[0] < scoreToWin ?
					matchScore[0]
				:	matchScore[0] + (scoreToWin - 1 - matchScore[1]);
		}
	}

	const poolScores = new Map<number, typeof teamScores>();
	for (const teamScore of teamScores) {
		const pool = poolScores.get(teamScore.team.pool);
		if (!pool) {
			poolScores.set(teamScore.team.pool, [teamScore]);
			continue;
		}

		pool.push(teamScore);
	}

	const session = await auth();
	const isAdmin = session?.user?.isAdmin ?? false;
	const isSignedUp =
		session?.user ?
			(
				await db
					.select()
					.from(draftPlayerTable)
					.where(
						and(
							eq(draftPlayerTable.playerId, session.user.id),
							eq(draftPlayerTable.seasonId, season.id)
						)
					)
			).length > 0
		:	false;

	return (
		<div className={style["content"]}>
			<div className={style["info"]}>
				<header>
					<h1>{season.name}</h1>
					<hr />
				</header>
				{!isSignedUp && (
					<p>
						<Link href="/signup">{`Register for ${season.name}.`}</Link>
					</p>
				)}
				{!matches.length && (
					<p>
						<Link href={`${getSeasonUrl(season)}/draft`}>
							{"View live draft."}
						</Link>
					</p>
				)}
				{isAdmin && <AdminPanel season={season} teams={teams} />}
			</div>
			<div className={style["schedule"]}>
				<header>
					<h2>{"Schedule"}</h2>
				</header>
				<ol>
					{Array.from(rounds)
						.filter(
							([, [match]]) => !isPlayoffsInProgress || match?.value.isPlayoffs
						)
						.sort(([a], [b]) => a - b)
						.map(([round, roundMatches]) => (
							<li key={round}>
								<RoundHeader
									round={round}
									match={roundMatches[0]?.value}
									season={season}
									doScrollTo={round === upcomingRound}
									doShowRound={isAdmin}
								/>
								<ol>
									{roundMatches
										.sort(
											(
												{ value: { timeSlot: a, id: c } },
												{ value: { timeSlot: b, id: d } }
											) => a - b || c - d
										)
										.map((match) => (
											<li key={match.value.id}>
												<MatchCard
													match={match.value}
													season={season}
													teamGameResults={match.children
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
													teams={teams}
												/>
											</li>
										))}
								</ol>
							</li>
						))}
				</ol>
			</div>
			<div className={style["leaderboards"]}>
				{season.playoffsTourneyId && season.playoffsStageId && (
					<iframe
						src={`https://widget.toornament.com/tournaments/${season.playoffsTourneyId}/stages/${season.playoffsStageId}/`}
					/>
				)}
				<h2>{"Regular Season Standings"}</h2>
				<ol>
					{Array.from(poolScores)
						.sort(([a], [b]) => a - b)
						.map(([pool, scores]) => (
							<li key={pool}>
								<header>
									<h3>{`Pool ${pool.toString()}`}</h3>
								</header>
								<ol>
									{scores
										.sort(({ victoryPoints: a }, { victoryPoints: b }) => b - a)
										.map(({ team, victoryPoints }) => (
											<li key={team.id}>
												<Link href={getTeamUrl(team)}>{team.name}</Link>
												{` ${victoryPoints.toString()}`}
											</li>
										))}
								</ol>
							</li>
						))}
				</ol>
			</div>
		</div>
	);
}

/**
 * The season page's metadata.
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
				description: `The schedule for Gauntlet Championship Series ${season.name}.`,
				openGraph: { url: getSeasonUrl(season) },
				title: season.name
			}
		:	{
				description: "An unknown season of the Gauntlet Championship Series.",
				openGraph: { url: getSeasonUrl({ slug }) },
				title: "Unknown Season"
			};
};
