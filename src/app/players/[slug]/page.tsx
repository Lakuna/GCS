import {
	accountTable,
	gameResultTable,
	gameTable,
	playerGameResultTable,
	playerTable,
	teamGameResultTable
} from "db/schema";
import { and, eq, or } from "drizzle-orm";
import AccountCard from "components/AccountCard";
import AdminPanel from "./AdminPanel";
import { BsDiscord } from "react-icons/bs";
import { CiLink } from "react-icons/ci";
import GameCard from "components/GameCard";
import Image from "components/Image";
import type { JSX } from "react";
import Link from "components/Link";
import Markdown from "react-markdown";
import type { Metadata } from "next";
import type PageProps from "types/PageProps";
import PlayerPanel from "./PlayerPanel";
import UpdateAccountsForm from "./UpdateAccountsForm";
import { auth } from "db/auth";
import db from "db/db";
import getBackgroundImageUrl from "util/getBackgroundImageUrl";
import getPlayerUrl from "util/getPlayerUrl";
import leftHierarchy from "util/leftHierarchy";
import opgg from "util/opgg";
import { redirect } from "next/navigation";
import sortAccountsByRank from "util/sortAccountsByRank";
import style from "./page.module.scss";
import ugg from "util/ugg";

/**
 * Parameters that are passed to a player page.
 * @public
 */
export interface PlayersPageParams {
	/** The player's encoded display name or Discord name. */
	slug: string;
}

/**
 * A page that displays information about a player.
 * @param props - The properties that are passed to the page.
 * @returns The player page.
 * @public
 */
export default async function Page(
	props: PageProps<PlayersPageParams>
): Promise<JSX.Element> {
	const { slug: encoded } = await props.params;
	const decoded = decodeURIComponent(encoded);
	const unfilteredRows = await db
		.select()
		.from(playerTable)
		.leftJoin(accountTable, eq(playerTable.id, accountTable.playerId))
		.leftJoin(
			playerGameResultTable,
			eq(accountTable.puuid, playerGameResultTable.puuid)
		)
		.leftJoin(
			teamGameResultTable,
			and(
				eq(
					playerGameResultTable.gameResultId,
					teamGameResultTable.gameResultId
				),
				eq(playerGameResultTable.team, teamGameResultTable.team)
			)
		)
		.leftJoin(
			gameResultTable,
			eq(teamGameResultTable.gameResultId, gameResultTable.id)
		)
		.leftJoin(
			gameTable,
			eq(gameResultTable.tournamentCode, gameTable.tournamentCode)
		)
		.where(or(eq(playerTable.id, decoded), eq(playerTable.slug, decoded)));
	const playerId = (
		unfilteredRows.find(({ player: { id } }) => id === decoded) ??
		unfilteredRows.find(({ player: { slug } }) => slug === decoded)
	)?.player.id;
	const rows = unfilteredRows.filter(({ player: { id } }) => id === playerId);
	const [first] = rows;
	if (!first) {
		redirect("/players");
	}

	// Organize player and account data.
	const { player } = first;
	const accounts = leftHierarchy(rows, "account");
	const backgroundImageUrl = getBackgroundImageUrl(player);
	const games = rows
		.filter(
			({ game, gameResult, teamGameResult, playerGameResult }) =>
				game && gameResult && teamGameResult && playerGameResult
		)
		.map(({ game, gameResult, teamGameResult, playerGameResult }) => {
			if (!game || !gameResult || !teamGameResult || !playerGameResult) {
				throw new Error("Something impossible happened.");
			}

			return { game, gameResult, playerGameResult, teamGameResult };
		});

	// Get session user data.
	const session = await auth();
	const isAdmin = session?.user?.isAdmin ?? false;
	const isPlayer = isAdmin || session?.user?.id === player.id;

	return (
		<div className={style["content"]}>
			{backgroundImageUrl && (
				<Image alt="" src={backgroundImageUrl} width={1215} height={717} />
			)}
			<header>
				<h1>
					{`${player.displayName ?? player.name} `}
					<Link
						href={getPlayerUrl({ id: player.id, slug: null })}
						title="Permalink"
					>
						<CiLink />
					</Link>
					{player.slug && (
						<Link href={getPlayerUrl(player)} title="Vanity URL">
							<CiLink />
						</Link>
					)}
				</h1>
				<ul>
					<span>
						<BsDiscord />
						{player.name}
					</span>
				</ul>
				{player.bio && <Markdown>{player.bio}</Markdown>}
			</header>
			<div>
				<div>
					<div>
						<header>
							<h2>
								{"Accounts"}
								{accounts.length > 0 && (
									<>
										{" | "}
										<Link href={ugg(...accounts)}>{"U.GG"}</Link>
										{" | "}
										<Link href={opgg(...accounts)}>{"OP.GG"}</Link>
									</>
								)}
							</h2>
						</header>
						<ol>
							{accounts
								.sort(sortAccountsByRank)
								.reverse()
								.map((account) => (
									<li key={account.accountId}>
										<AccountCard account={account} />
									</li>
								))}
						</ol>
						{accounts.length > 0 && (
							<UpdateAccountsForm player={player} accounts={accounts} />
						)}
					</div>
					{isPlayer && (
						<PlayerPanel
							player={player}
							accounts={accounts}
							className={style["panel"]}
						/>
					)}
					{isAdmin && (
						<AdminPanel
							player={player}
							accounts={accounts}
							className={style["panel"]}
						/>
					)}
				</div>
				<div>
					<div>
						<header>
							<h2>{"Game History"}</h2>
						</header>
						<ol>
							{games
								.sort(
									(
										{ gameResult: { startTimestamp: a } },
										{ gameResult: { startTimestamp: b } }
									) => b - a // Newest first.
								)
								.map(
									({ game, gameResult, teamGameResult, playerGameResult }) => (
										<li key={game.id}>
											<GameCard
												game={game}
												gameResult={gameResult}
												teamGameResults={[teamGameResult]}
												playerGameResults={[playerGameResult]}
												players={[player]}
												accounts={accounts}
												pov={playerGameResult.team}
											/>
										</li>
									)
								)}
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * The player page's metadata.
 * @param props - The properties that are passed to the page.
 * @returns The metadata.
 * @public
 */
export const generateMetadata = async (
	props: PageProps<PlayersPageParams>
): Promise<Metadata> => {
	const { slug: encoded } = await props.params;
	const decoded = decodeURIComponent(encoded);
	const rows = await db
		.select()
		.from(playerTable)
		.where(or(eq(playerTable.id, decoded), eq(playerTable.slug, decoded)));
	const player =
		rows.find(({ id }) => id === decoded) ??
		rows.find(({ slug }) => slug === decoded);

	return player ?
			{
				description: `Gauntlet Championship Series player "${player.displayName ?? player.name}."`,
				openGraph: {
					images: getBackgroundImageUrl(player),
					url: getPlayerUrl(player)
				},
				title: player.displayName ?? player.name
			}
		:	{
				description: "An unknown player in the Gauntlet Championship Series.",
				openGraph: { url: getPlayerUrl({ id: decoded, slug: decoded }) },
				title: "Unknown Player"
			};
};
