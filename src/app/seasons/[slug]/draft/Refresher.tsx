"use client";

import { type JSX, useEffect, useState } from "react";
import {
	accountTable,
	draftPlayerTable,
	playerTable,
	teamPlayerTable,
	teamTable
} from "db/schema";
import DraftPlayerForm from "./DraftPlayerForm";
import Link from "components/Link";
import LocalDate from "components/LocalDate";
import PlayerCard from "components/PlayerCard";
import { type PlayerSession } from "db/auth";
import Position from "types/riot/Position";
import { TEAM_SIZE } from "util/const";
import type { Tree } from "types/Tree";
import getDraftablePlayersRows from "./getDraftablePlayersRows";
import getDraftedPlayersRows from "./getDraftedPlayersRows";
import getSeasonRows from "./getSeasonRows";
import getTeamUrl from "util/getTeamUrl";
import leftHierarchy from "util/leftHierarchy";
import { redirect } from "next/navigation";
import style from "./page.module.scss";

/**
 * The properties of the refreshing content.
 * @public
 */
export interface RefresherProps {
	/** The slug of the season. */
	slug: string;

	/** The active session. */
	session: PlayerSession | null;
}

/**
 * The main content of the season draft page, which refreshes periodically.
 * @param props - The properties of the refreshing content.
 * @returns The refreshing content.
 * @public
 */
export default function Refresher({
	slug,
	session
}: RefresherProps): JSX.Element {
	// State variables.
	const [team, setTeam] = useState<
		| Tree<
				{
					team: typeof teamTable.$inferSelect;
					teamPlayer: typeof teamPlayerTable.$inferSelect;
					player: typeof playerTable.$inferSelect;
					draftPlayer: typeof draftPlayerTable.$inferSelect;
					account: typeof accountTable.$inferSelect;
				},
				["team", "teamPlayer", "player", "draftPlayer", "account"]
		  >
		| undefined
	>(void 0);
	const [draftedPlayers, setDraftedPlayers] = useState<
		{
			draftPlayer: typeof draftPlayerTable.$inferSelect;
			player: typeof playerTable.$inferSelect;
			teamPlayer: typeof teamPlayerTable.$inferSelect;
			team: typeof teamTable.$inferSelect;
		}[]
	>([]);
	const [draftablePlayers, setDraftablePlayers] = useState<
		Tree<
			{
				draftPlayer: typeof draftPlayerTable.$inferSelect;
				player: typeof playerTable.$inferSelect;
				account: typeof accountTable.$inferSelect;
			},
			["draftPlayer", "player", "account"]
		>[]
	>([]);
	const [canDraft, setCanDraft] = useState(false);
	const [lastUpdate, setLastUpdate] = useState(new Date());

	// Update state periodically.
	useEffect(() => {
		const updateState = () => {
			getSeasonRows(slug)
				.then(async (seasonRows) => {
					// Get drafted players.
					const [first] = seasonRows;
					if (!first) {
						redirect("/seasons");
					}

					// Organize season, team, and drafted player data.
					const { season } = first;
					const teams = leftHierarchy(
						seasonRows,
						"team",
						"teamPlayer",
						"player",
						"draftPlayer",
						"account"
					);
					const innerTeam = teams.find(({ children: players }) =>
						players.some(
							({ value: teamPlayer }) =>
								teamPlayer.playerId === session?.user?.id
						)
					);
					setTeam(innerTeam);

					// Only show players that have signed up, been assigned point values, and not already been drafted to a team.
					const draftablePlayersRows = await getDraftablePlayersRows(season.id);
					setDraftablePlayers(
						leftHierarchy(
							draftablePlayersRows,
							"draftPlayer",
							"player",
							"account"
						).filter(
							({ value: { pointValue }, children: players }) =>
								pointValue !== null &&
								!teams.some(({ children: teamPlayers }) =>
									teamPlayers.some(({ value: teamPlayer }) =>
										players.some(
											({ value: player }) => player.id === teamPlayer.playerId
										)
									)
								)
						)
					);

					// Get recently-drafted players.
					const innerDraftedPlayers = await getDraftedPlayersRows(season.id);
					setDraftedPlayers(innerDraftedPlayers);

					// Determine whether the viewer is the next captain in line to draft a player.
					if (
						!session?.user ||
						!innerTeam ||
						innerTeam.children.length >= TEAM_SIZE ||
						!innerTeam.children.find(
							({ value: teamPlayer }) =>
								teamPlayer.playerId === session.user?.id
						)?.value.isCaptain
					) {
						setCanDraft(false);
					} else {
						const [mostRecentDraft] = innerDraftedPlayers.sort(
							(
								{ draftPlayer: { draftedAt: a } },
								{ draftPlayer: { draftedAt: b } }
							) => (b?.valueOf() ?? 0) - (a?.valueOf() ?? 0)
						);
						const teamsByDraftOrder = teams.sort(
							({ value: { draftOrder: a } }, { value: { draftOrder: b } }) =>
								a - b
						);
						const nextIndex =
							(teamsByDraftOrder.findIndex(
								({ value: { id } }) => id === mostRecentDraft?.team.id
							) +
								1) %
							(teamsByDraftOrder.length * 2);
						const nextTeam =
							teamsByDraftOrder[
								nextIndex < teamsByDraftOrder.length ?
									nextIndex
								:	teamsByDraftOrder.length -
									1 -
									(nextIndex - teamsByDraftOrder.length)
							];

						setCanDraft(nextTeam?.value.id === innerTeam.value.id);
					}

					setLastUpdate(new Date());
				})
				.catch((error: unknown) => {
					throw error instanceof Error ? error : (
							new Error("Error refreshing draft page.")
						);
				});
		};

		// Update once at the beginning then on an interval.
		updateState();
		const interval = setInterval(updateState, 5000);

		return () => {
			clearInterval(interval);
		};
	}, [session?.user, slug]);

	return (
		<div className={style["content"]}>
			<div className={style["team"]}>
				<header>
					<h2>
						{team ?
							<>
								<Link href={getTeamUrl(team.value)}>{team.value.name}</Link>
								{` - ${team.children
									.reduce(
										(previousValue, currentValue) =>
											previousValue +
											(currentValue.children[0]?.children[0]?.value
												.pointValue ?? 0),
										0
									)
									.toString()} PV`}
							</>
						:	"Not Drafted Yet"}
					</h2>
				</header>
				<ul>
					{team?.children
						.flatMap(({ children }) => children)
						.map(({ value: player, children: remainder }) => (
							<PlayerCard
								key={player.id}
								player={player}
								accounts={remainder.flatMap(({ children }) => children)}
								draftPlayer={remainder[0]?.value}
							/>
						))}
				</ul>
			</div>
			<div className={style["draft"]}>
				<header>
					<h1>{"Draft"}</h1>
				</header>
				<div>
					{[
						Position.TOP,
						Position.JUNGLE,
						Position.MIDDLE,
						Position.BOTTOM,
						Position.UTILITY
					].map((position) => (
						<div key={position}>
							<header>
								<h3>{position}</h3>
							</header>
							<ol>
								{draftablePlayers
									.filter(
										({ children: players }) =>
											players[0]?.value.primaryRole === position
									)
									.sort(
										(
											{ value: { pointValue: a } },
											{ value: { pointValue: b } }
										) => (a ?? 0) - (b ?? 0)
									)
									.map(({ value: draftPlayer, children: players }) => {
										const [playerRaw] = players;
										if (!playerRaw) {
											return void 0;
										}

										const { value: player, children: accounts } = playerRaw;

										return (
											<DraftPlayerForm
												key={draftPlayer.playerId}
												draftPlayer={draftPlayer}
												player={player}
												accounts={accounts}
												team={team?.value}
												enabled={canDraft}
											/>
										);
									})}
							</ol>
						</div>
					))}
				</div>
			</div>
			<div className={style["log"]}>
				<header>
					<h2>{"Log"}</h2>
					<p>
						{"Last update: "}{" "}
						<LocalDate date={lastUpdate} options={{ timeStyle: "medium" }} />
					</p>
				</header>
				<ol>
					{draftedPlayers
						.sort(
							(
								{ draftPlayer: { draftedAt: a } },
								{ draftPlayer: { draftedAt: b } }
							) => (b?.valueOf() ?? 0) - (a?.valueOf() ?? 0)
						)
						.map((draftedPlayer) => (
							<div key={draftedPlayer.player.id}>
								<h3>{`${draftedPlayer.player.displayName ?? draftedPlayer.player.name} -> ${draftedPlayer.team.code}`}</h3>
								<p>
									{`${draftedPlayer.draftPlayer.pointValue?.toString() ?? "?"} PV - ${draftedPlayer.player.primaryRole ?? "?"}/${draftedPlayer.player.secondaryRole ?? "?"}`}
								</p>
							</div>
						))}
				</ol>
			</div>
		</div>
	);
}
