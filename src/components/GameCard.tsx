import type {
	accountTable,
	gameResultTable,
	gameTable,
	playerGameResultTable,
	playerTable,
	teamGameResultTable
} from "db/schema";
import type ChampionData from "types/riot/ChampionData";
import Image from "./Image";
import type { JSX } from "react";
import type { LinkProps } from "./Link";
import getChampionIcon from "riot/getChampionIcon";
import getChampionsList from "riot/getChampionsList";
import getGameUrl from "util/getGameUrl";
import getItemIcon from "riot/getItemIcon";
import multiclass from "util/multiclass";
import sortPlayersStandard from "util/sortPlayersStandard";
import style from "./styles/game-card.module.scss";

/**
 * Properties that can be passed to a game card.
 * @public
 */
export interface GameCardProps extends Omit<LinkProps, "children" | "href"> {
	/** The game that is represented by the card. */
	game: typeof gameTable.$inferSelect;

	/** The result of the game that is represented by the card. */
	gameResult?: typeof gameResultTable.$inferSelect | undefined;

	/** The team game results. */
	teamGameResults?: (typeof teamGameResultTable.$inferSelect)[] | undefined;

	/** The player game results. */
	playerGameResults?: (typeof playerGameResultTable.$inferSelect)[] | undefined;

	/** The players in the game. */
	players?: (typeof playerTable.$inferSelect)[] | undefined;

	/** The accounts of the players in the game. */
	accounts?: (typeof accountTable.$inferSelect)[] | undefined;

	/** The team (Riot ID) from whose point of view to display the game. If this is set, the background will be blue when this team wins or red when it doesn't. If this is set, players on this team will be listed first. */
	pov?: number | undefined;

	/** Whether or not to show all details on the card. Applicable only to individual player game result cards. */
	extended?: boolean | undefined;
}

/**
 * A card that displays information about a game.
 * @param props - The properties to pass to the game card.
 * @returns The game card.
 * @public
 */
export default async function GameCard({
	game,
	gameResult,
	teamGameResults,
	playerGameResults,
	players,
	accounts,
	pov,
	extended,
	className,
	...props
}: GameCardProps): Promise<JSX.Element> {
	// Incomplete game.
	if (!gameResult || !teamGameResults || !playerGameResults) {
		return (
			<a
				className={multiclass(className, style["simple"])}
				href={getGameUrl(game)}
				{...props}
			>
				<h3>{`Game #${game.id.toString()}`}</h3>
			</a>
		);
	}

	const backgroundColor =
		teamGameResults.length > 0
			? teamGameResults.some(
					({ isWinner, team }) => isWinner && team === (pov ?? 100)
				)
				? "#00008d"
				: "#550000"
			: void 0;

	// Forfeited game.
	if (playerGameResults.length === 0) {
		return (
			<a
				className={multiclass(className, style["simple"])}
				href={getGameUrl(game)}
				style={{ backgroundColor }}
				{...props}
			>
				<h3>{`Game #${game.id.toString()} (Forfeit)`}</h3>
			</a>
		);
	}

	const championsByKey = Object.entries(
		(await getChampionsList()) ?? {}
	).reduce((previousValue, currentValue) => {
		return previousValue.set(
			parseInt(currentValue[1].key, 10),
			currentValue[1]
		);
	}, new Map<number, ChampionData>());

	// Player-specific game result.
	if (playerGameResults.length === 1) {
		const [result] = playerGameResults;
		if (!result) {
			throw new Error("Something impossible happened.");
		}

		const champion = championsByKey.get(result.champ);
		const championIcon = champion && (await getChampionIcon(champion.id));

		const player = players?.find(
			({ id }) =>
				id === accounts?.find(({ puuid }) => puuid === result.puuid)?.playerId
		);

		return extended ? (
			<a
				className={multiclass(className, style["extended-single"])}
				href={getGameUrl(game)}
				style={{ backgroundColor }}
				{...props}
			>
				<header>
					{champion && championIcon && (
						<Image
							alt={`${champion.name} icon.`}
							src={championIcon}
							width={128}
							height={128}
							className={style["champion"]}
						/>
					)}
					<div>
						{player ? (
							<h3>{player.displayName ?? player.name}</h3>
						) : (
							<h3>{result.name}</h3>
						)}
						<p>{`${result.kills.toString()}/${result.deaths.toString()}/${result.assists.toString()}`}</p>
						<p>{`Damage: ${result.champDmg.toLocaleString()}`}</p>
						<p>{`Level: ${result.level.toString()}`}</p>
						<p>{`Position: ${result.position}`}</p>
					</div>
				</header>
				<div className={style["items"]}>
					{[
						result.item0,
						result.item1,
						result.item2,
						result.item6,
						result.item3,
						result.item4,
						result.item5
					].map(async (item, i) => {
						const src = item && (await getItemIcon(item));
						return src ? (
							<Image
								key={i}
								alt="Item icon."
								src={src}
								width={64}
								height={64}
							/>
						) : (
							<span /> // Grid placeholder.
						);
					})}
				</div>
				<div className={style["details"]}>
					<p>{`CS: ${(result.laneCs + result.neutralCs).toLocaleString()}`}</p>
					<ul>
						<li>{`Lane: ${result.laneCs.toLocaleString()}`}</li>
						<li>{`Ally jungle: ${result.allyJgCs.toLocaleString()}`}</li>
						<li>{`Enemy jungle: ${result.enemyJgCs.toLocaleString()}`}</li>
						<li>{`Other neutral: ${(result.neutralCs - result.allyJgCs - result.enemyJgCs).toLocaleString()}`}</li>
					</ul>
					<p>{`Ward kills: ${result.wardCs.toLocaleString()}`}</p>
					<p>{`Tower damage: ${result.towerDmg.toLocaleString()}`}</p>
					<p>{`Objective steals: ${result.objectivesStolen.toLocaleString()}`}</p>
					<p>{`Pentakills: ${result.pentakills.toLocaleString()}`}</p>
				</div>
			</a>
		) : (
			<a
				className={multiclass(className, style["single"])}
				href={getGameUrl(game)}
				style={{ backgroundColor }}
				{...props}
			>
				{champion && championIcon && (
					<Image
						alt={`${champion.name} icon.`}
						src={championIcon}
						width={128}
						height={128}
						className={style["champion"]}
					/>
				)}
				<div>
					{player ? (
						<h3>{player.displayName ?? player.name}</h3>
					) : (
						<h3>{result.name}</h3>
					)}
					<p>{`${result.kills.toString()}/${result.deaths.toString()}/${result.assists.toString()}`}</p>
					<p>{`Damage: ${result.champDmg.toLocaleString()}`}</p>
					<p>{`Level: ${result.level.toString()}`}</p>
					<p>{`Position: ${result.position}`}</p>
				</div>
				{[
					result.item0,
					result.item1,
					result.item2,
					result.item6,
					result.item3,
					result.item4,
					result.item5
				].map(async (item, i) => {
					const src = item && (await getItemIcon(item));
					return src ? (
						<Image key={i} alt="Item icon." src={src} width={64} height={64} />
					) : (
						<span /> // Grid placeholder.
					);
				})}
			</a>
		);
	}

	// Normal game result.
	return (
		<a
			className={multiclass(className, style["complex"])}
			href={getGameUrl(game)}
			style={{ backgroundColor }}
			{...props}
		>
			{playerGameResults
				.sort(
					(a, b) =>
						(typeof pov === "number"
							? (a.team === pov ? 100 : 200) - (b.team === pov ? 100 : 200)
							: a.team - b.team) || sortPlayersStandard(a, b)
				)
				.map(async (result) => {
					const champion = championsByKey.get(result.champ);
					const championIcon = champion && (await getChampionIcon(champion.id));
					const player = players?.find(
						({ id }) =>
							id ===
							accounts?.find(({ puuid }) => puuid === result.puuid)?.playerId
					);

					return (
						<div key={result.id}>
							{champion && championIcon && (
								<Image
									alt={`${champion.name} icon.`}
									src={championIcon}
									width={128}
									height={128}
								/>
							)}
							<h3>{`${result.kills.toString()}/${result.deaths.toString()}/${result.assists.toString()}`}</h3>
							{player ? (
								<p>{player.displayName ?? player.name}</p>
							) : (
								<p>{result.name}</p>
							)}
						</div>
					);
				})}
		</a>
	);
}
