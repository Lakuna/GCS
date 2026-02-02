import {
	accountTable,
	gameResultTable,
	gameTable,
	matchTable,
	playerGameResultTable,
	playerTable,
	seasonTable
} from "db/schema";
import { desc, eq } from "drizzle-orm";
import { type JSX } from "react";
import Link from "components/Link";
import type { Metadata } from "next";
import db from "db/db";
import getGameUrl from "util/getGameUrl";
import getPlayerUrl from "util/getPlayerUrl";
import leftHierarchy from "util/leftHierarchy";
import multiclass from "util/multiclass";
import { redirect } from "next/navigation";
import style from "./page.module.scss";

/**
 * The leaderboards page.
 * @returns The leaderboards page.
 * @public
 */
export default async function Page(): Promise<JSX.Element> {
	const [season] = await db
		.select()
		.from(seasonTable)
		.orderBy(desc(seasonTable.startDate))
		.limit(1);
	if (!season) {
		redirect("/schedule");
	}

	const rowsWithBans = await db
		.select()
		.from(matchTable)
		.innerJoin(gameTable, eq(matchTable.id, gameTable.matchId))
		.innerJoin(
			gameResultTable,
			eq(gameTable.tournamentCode, gameResultTable.tournamentCode)
		)
		.innerJoin(
			playerGameResultTable,
			eq(gameResultTable.id, playerGameResultTable.gameResultId)
		)
		.innerJoin(
			accountTable,
			eq(playerGameResultTable.puuid, accountTable.puuid)
		)
		.innerJoin(playerTable, eq(accountTable.playerId, playerTable.id))
		.where(eq(matchTable.seasonId, season.id));
	const rows = rowsWithBans.filter(
		(row) =>
			row.player.bannedUntil === null ||
			// TODO
			// eslint-disable-next-line react-hooks/purity
			new Date(row.player.bannedUntil).valueOf() < Date.now()
	);
	const resultsByPlayer = leftHierarchy(rows, "player", "playerGameResult");
	const killsPerTeam = rows.reduce((map, { playerGameResult }) => {
		const key = `${playerGameResult.gameResultId.toString()}-${playerGameResult.team.toString()}`;
		return map.set(key, (map.get(key) ?? 0) + playerGameResult.kills);
	}, new Map<string, number>());

	return (
		<>
			<header>
				<h1>{"Leaderboards"}</h1>
				<hr />
			</header>
			<div className={multiclass(style["leaderboards"], style["big"])}>
				<div>
					<header>
						<h2>{"KDA"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								assists: results.reduce(
									(total, { assists }) => total + assists,
									0
								),
								deaths: results.reduce(
									(total, { deaths }) => total + deaths,
									0
								),
								kills: results.reduce((total, { kills }) => total + kills, 0),
								player
							}))
							.sort(
								(a, b) =>
									(b.kills + b.assists) / b.deaths -
									(a.kills + a.assists) / a.deaths
							)
							.slice(0, 10)
							.map(({ assists, deaths, kills, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${((kills + assists) / deaths).toFixed(2)}`}
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"DPM"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								damage: results.reduce(
									(total, { champDmg }) => total + champDmg,
									0
								),
								ms: results.reduce(
									(total, result) =>
										total +
										(rows.find((row) => row.playerGameResult.id === result.id)
											?.gameResult.duration ?? 0),
									0
								),
								player
							}))
							.sort((a, b) => b.damage / b.ms - a.damage / a.ms)
							.slice(0, 10)
							.map(({ damage, ms, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${Math.floor(damage / (ms / 1000 / 60)).toLocaleString()}`}
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"Deaths/Game"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								deaths: results.reduce(
									(total, { deaths }) => total + deaths,
									0
								),
								games: results.length,
								player
							}))
							.sort((a, b) => b.deaths / b.games - a.deaths / a.games)
							.slice(0, 10)
							.map(({ deaths, games, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${(deaths / games).toFixed(2)}`}
								</li>
							))}
					</ol>
				</div>
			</div>
			<hr />
			<div className={style["leaderboards"]}>
				<div>
					<header>
						<h2>{"Tower Damage/Game"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								games: results.length,
								player,
								towerDmg: results.reduce(
									(total, { towerDmg }) => total + towerDmg,
									0
								)
							}))
							.sort((a, b) => b.towerDmg / b.games - a.towerDmg / a.games)
							.slice(0, 10)
							.map(({ towerDmg, games, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${Math.floor(towerDmg / games).toLocaleString()}`}
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"Objective Steals"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								objectivesStolen: results.reduce(
									(total, { objectivesStolen }) => total + objectivesStolen,
									0
								),
								player
							}))
							.filter(({ objectivesStolen }) => objectivesStolen > 0)
							.sort((a, b) => b.objectivesStolen - a.objectivesStolen)
							.slice(0, 10)
							.map(({ objectivesStolen, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${objectivesStolen.toLocaleString()}`}
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"CSM"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								cs: results.reduce(
									(total, { laneCs, neutralCs }) => total + laneCs + neutralCs,
									0
								),
								ms: results.reduce(
									(total, result) =>
										total +
										(rows.find((row) => row.playerGameResult.id === result.id)
											?.gameResult.duration ?? 0),
									0
								),
								player
							}))
							.sort((a, b) => b.cs / b.ms - a.cs / a.ms)
							.slice(0, 10)
							.map(({ cs, ms, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${(cs / (ms / 1000 / 60)).toFixed(2)}`}
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"Damage (Single Game)"}</h2>
					</header>
					<ol>
						{rows
							.sort(
								(
									{ playerGameResult: { champDmg: a } },
									{ playerGameResult: { champDmg: b } }
								) => b - a
							)
							.slice(0, 10)
							.map(({ game, player, playerGameResult }) => (
								<li key={playerGameResult.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{" - "}
									<Link href={getGameUrl(game)}>
										{playerGameResult.champDmg.toLocaleString()}
									</Link>
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"KP"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								gameKills: results.reduce(
									(total, result) =>
										total +
										(killsPerTeam.get(
											`${result.gameResultId.toString()}-${result.team.toString()}`
										) ?? 0),
									0
								),
								kp: results.reduce(
									(total, { assists, kills }) => total + assists + kills,
									0
								),
								player
							}))
							.sort((a, b) => b.kp / b.gameKills - a.kp / a.gameKills)
							.slice(0, 10)
							.map(({ kp, gameKills, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${((kp / gameKills) * 100).toFixed(2)}%`}
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"Pentakills"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								pentakills: results.reduce(
									(total, { pentakills }) => total + pentakills,
									0
								),
								player
							}))
							.filter(({ pentakills }) => pentakills > 0)
							.sort((a, b) => b.pentakills - a.pentakills)
							.slice(0, 10)
							.map(({ pentakills, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${pentakills.toLocaleString()}`}
								</li>
							))}
					</ol>
				</div>
				<div>
					<header>
						<h2>{"Average Game Time"}</h2>
					</header>
					<ol>
						{resultsByPlayer
							.map(({ value: player, children: results }) => ({
								games: results.length,
								ms: results.reduce(
									(total, result) =>
										total +
										(rows.find((row) => row.playerGameResult.id === result.id)
											?.gameResult.duration ?? 0),
									0
								),
								player
							}))
							.sort((a, b) => a.ms / a.games - b.ms / b.games)
							.slice(0, 10)
							.map(({ ms, games, player }) => (
								<li key={player.id}>
									<Link href={getPlayerUrl(player)}>
										{player.displayName ?? player.name}
									</Link>
									{` - ${Math.floor(ms / games / 1000 / 60).toString()}:${Math.floor(
										(ms / games / 1000) % 60
									)
										.toString()
										.padStart(2, "0")}`}
								</li>
							))}
					</ol>
				</div>
			</div>
		</>
	);
}

/**
 * The metadata of the leaderboards page.
 * @public
 */
export const metadata = {
	description:
		"All-time statistic leaderboards for the Gauntlet Championship Series.",
	openGraph: { url: "/leaderboards" },
	title: "Leaderboards"
} satisfies Metadata;
