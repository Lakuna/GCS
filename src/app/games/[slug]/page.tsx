import {
	accountTable,
	gameResultTable,
	gameTable,
	matchTable,
	playerGameResultTable,
	playerTable,
	seasonTable,
	teamGameResultTable,
	teamPlayerTable,
	teamTable
} from "db/schema";
import { and, eq, or } from "drizzle-orm";
import AdminPanel from "./AdminPanel";
import CaptainPanel from "./CaptainPanel";
import GameCard from "components/GameCard";
import type { JSX } from "react";
import Link from "components/Link";
import type { Metadata } from "next";
import type PageProps from "types/PageProps";
import TournamentCode from "components/TournamentCode";
import { auth } from "db/auth";
import db from "db/db";
import getGameUrl from "util/getGameUrl";
import getMaps from "riot/getMaps";
import getMatchUrl from "util/getMatchUrl";
import getQueues from "riot/getQueues";
import leftHierarchy from "util/leftHierarchy";
import style from "./page.module.scss";

/**
 * Parameters that are passed to a game page.
 * @public
 */
export interface GamesPageParams {
	/** The match's ID (stringified). */
	slug: `${number}`;
}

/**
 * A page that displays information about a game.
 * @param props - The properties that are passed to the page.
 * @returns The game page.
 * @public
 */
export default async function Page(
	props: PageProps<GamesPageParams>
): Promise<JSX.Element> {
	const { slug } = await props.params;
	const [gameRow] = await db
		.select()
		.from(gameTable)
		.leftJoin(matchTable, eq(gameTable.matchId, matchTable.id))
		.leftJoin(seasonTable, eq(matchTable.seasonId, seasonTable.id))
		.where(eq(gameTable.id, parseInt(slug, 10)));
	if (!gameRow) {
		return <p>{"Unknown game."}</p>;
	}

	const { game, match, season } = gameRow;

	const teams =
		match ?
			await db
				.select()
				.from(teamTable)
				.where(
					or(
						eq(teamTable.id, match.blueTeamId),
						or(eq(teamTable.id, match.redTeamId))
					)
				)
		:	[];
	const matchBlueTeam = teams.find(({ id }) => id === match?.blueTeamId);
	const matchRedTeam = teams.find(({ id }) => id === match?.redTeamId);

	// The tournament code is visible if the viewer is logged in and either the user is an administrator, the game isn't associated with a match, or the viewer is on a team in the associated match.
	const session = await auth();
	const canViewTournamentCode =
		session?.user &&
		(session.user.isAdmin ||
			!match ||
			(
				await db
					.select()
					.from(teamPlayerTable)
					.where(
						and(
							eq(teamPlayerTable.playerId, session.user.id),
							or(
								eq(teamPlayerTable.teamId, match.blueTeamId),
								eq(teamPlayerTable.teamId, match.redTeamId)
							)
						)
					)
			).length > 0);

	const accountRows =
		matchBlueTeam && matchRedTeam ?
			await db
				.select()
				.from(teamTable)
				.innerJoin(teamPlayerTable, eq(teamTable.id, teamPlayerTable.teamId))
				.innerJoin(playerTable, eq(teamPlayerTable.playerId, playerTable.id))
				.innerJoin(accountTable, eq(playerTable.id, accountTable.playerId))
				.where(
					or(
						eq(teamTable.id, matchBlueTeam.id),
						eq(teamTable.id, matchRedTeam.id)
					)
				)
		:	[];
	const allPlayers = accountRows.map(({ player }) => player);
	const allAccounts = accountRows.map(({ account }) => account);

	let captainPanel: JSX.Element | undefined = void 0;
	if (session?.user) {
		const isBlueCaptain = accountRows.some(
			({ teamPlayer: { playerId, isCaptain, teamId } }) =>
				isCaptain &&
				teamId === match?.blueTeamId &&
				playerId === session.user?.id
		);
		const isRedCaptain = accountRows.some(
			({ teamPlayer: { playerId, isCaptain, teamId } }) =>
				isCaptain &&
				teamId === match?.redTeamId &&
				playerId === session.user?.id
		);
		const blueAccounts = accountRows
			.filter(({ teamPlayer: { teamId } }) => teamId === match?.blueTeamId)
			.map(({ account }) => account);
		const redAccounts = accountRows
			.filter(({ teamPlayer: { teamId } }) => teamId === match?.redTeamId)
			.map(({ account }) => account);

		captainPanel =
			session.user.isAdmin || isBlueCaptain || isRedCaptain ?
				<CaptainPanel
					className={style["panel"]}
					game={game}
					match={match ?? void 0}
					season={season ?? void 0}
					isBlueCaptain={session.user.isAdmin || isBlueCaptain}
					blueTeam={matchBlueTeam}
					blueAccounts={blueAccounts}
					isRedCaptain={session.user.isAdmin || isRedCaptain}
					redTeam={matchRedTeam}
					redAccounts={redAccounts}
					overwriteEnabled={session.user.isAdmin}
				/>
			:	void 0;
	}

	const [gameResult] = leftHierarchy(
		await db
			.select()
			.from(gameResultTable)
			.leftJoin(
				teamGameResultTable,
				eq(gameResultTable.id, teamGameResultTable.gameResultId)
			)
			.leftJoin(
				playerGameResultTable,
				and(
					eq(
						teamGameResultTable.gameResultId,
						playerGameResultTable.gameResultId
					),
					eq(teamGameResultTable.team, playerGameResultTable.team)
				)
			)
			.where(eq(gameResultTable.tournamentCode, game.tournamentCode)),
		"gameResult",
		"teamGameResult",
		"playerGameResult"
	);

	if (!gameResult) {
		return (
			<div className={style["content"]}>
				<div />
				<div>
					<header>
						<h1>
							{match && (
								<>
									<Link
										href={getMatchUrl(match)}
									>{`Match #${match.id.toString()}`}</Link>
									{", "}
								</>
							)}
							{`Game #${game.id.toString()}${matchBlueTeam && matchRedTeam ? ` - ${matchBlueTeam.name} vs ${matchRedTeam.name}` : ""}`}
						</h1>
					</header>
					{canViewTournamentCode && (
						<TournamentCode tournamentCode={game.tournamentCode} />
					)}
					{match && <p>{"This game has not yet concluded."}</p>}
					{captainPanel}
					{session?.user?.isAdmin && (
						<AdminPanel className={style["panel"]} game={game} />
					)}
				</div>
				<div />
			</div>
		);
	}

	const [blueTeamResult, redTeamResult] = gameResult.children.sort(
		({ value: { team: a } }, { value: { team: b } }) => a - b
	);
	const gameBlueTeam = [matchBlueTeam, matchRedTeam].find(
		(team) => team?.id === blueTeamResult?.value.teamId
	);
	const gameRedTeam = [matchBlueTeam, matchRedTeam].find(
		(team) => team?.id === redTeamResult?.value.teamId
	);
	const queue = (await getQueues()).find(
		(value) => value.queueId === gameResult.value.queue
	);

	return (
		<div className={style["content"]}>
			<div className={style["team"]}>
				{gameBlueTeam && blueTeamResult && (
					<>
						<h2>{gameBlueTeam.name}</h2>
						{blueTeamResult.children.map((playerGameResult) => (
							<GameCard
								key={playerGameResult.id}
								game={game}
								gameResult={gameResult.value}
								teamGameResults={gameResult.children.map(({ value }) => value)}
								playerGameResults={[playerGameResult]}
								players={allPlayers}
								accounts={allAccounts}
								pov={playerGameResult.team}
								extended
							/>
						))}
					</>
				)}
			</div>
			<div>
				<header>
					<h1>
						{match && (
							<>
								<Link
									href={getMatchUrl(match)}
								>{`Match #${match.id.toString()}`}</Link>
								{", "}
							</>
						)}
						{`Game #${game.id.toString()}${matchBlueTeam && matchRedTeam ? ` - ${matchBlueTeam.name} vs ${matchRedTeam.name}` : ""}`}
					</h1>
				</header>
				<div>
					<p>
						{`Duration: ${Math.floor(gameResult.value.duration / 1000 / 60).toString()}:${Math.floor(
							(gameResult.value.duration / 1000) % 60
						)
							.toString()
							.padStart(2, "0")}`}
					</p>
					<p>{`Game ID: ${gameResult.value.id.toString()}`}</p>
					<p>{`Map: ${(await getMaps()).find((map) => map.mapId === gameResult.value.map)?.mapName ?? "Unknown"}`}</p>
					<p>{`Mode: ${gameResult.value.mode}`}</p>
					<p>{`Queue: ${queue ? `${queue.map}${queue.description ? ` - ${queue.description}` : ""}` : "Unknown"}`}</p>
					<p>{`Region: ${gameResult.value.region}`}</p>
					<p>{`Start time: ${new Date(gameResult.value.startTimestamp).toLocaleString()}`}</p>
					<p>{`Type: ${gameResult.value.type}`}</p>
					<p>{`Version: ${gameResult.value.version}`}</p>
				</div>
				{session?.user?.isAdmin && captainPanel}
				{session?.user?.isAdmin && (
					<AdminPanel className={style["panel"]} game={game} />
				)}
			</div>
			<div className={style["team"]}>
				{gameRedTeam && redTeamResult && (
					<>
						<h2>{gameRedTeam.name}</h2>
						{redTeamResult.children.map((playerGameResult) => (
							<GameCard
								key={playerGameResult.id}
								game={game}
								gameResult={gameResult.value}
								teamGameResults={gameResult.children.map(({ value }) => value)}
								playerGameResults={[playerGameResult]}
								players={allPlayers}
								accounts={allAccounts}
								pov={playerGameResult.team}
								extended
							/>
						))}
					</>
				)}
			</div>
		</div>
	);
}

/**
 * The game page's metadata.
 * @param props - The properties that are passed to the page.
 * @returns The metadata.
 * @public
 */
export const generateMetadata = async (
	props: PageProps<GamesPageParams>
): Promise<Metadata> => {
	const { slug } = await props.params;
	return {
		description: `Gauntlet Championship Series game #${slug}`,
		openGraph: { url: getGameUrl({ id: parseInt(slug, 10) }) },
		title: `Game #${slug}`
	};
};
