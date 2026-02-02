import type {
	accountTable,
	draftPlayerTable,
	playerGameResultTable,
	playerTable,
	teamPlayerTable
} from "db/schema";
import type { JSX } from "react";
import type { LinkProps } from "./Link";
import RankedEmblem from "./RankedEmblem";
import getAverageKda from "util/getAverageKda";
import getBackgroundImageUrl from "util/getBackgroundImageUrl";
import getHighestRankedAccount from "util/getHighestRankedAccount";
import getPlayerUrl from "util/getPlayerUrl";
import multiclass from "util/multiclass";
import styles from "./styles/player-card.module.scss";

/**
 * Properties that can be passed to a player card.
 * @public
 */
export interface PlayerCardProps extends Omit<LinkProps, "children" | "href"> {
	/** The player that is represented by the card. */
	player: typeof playerTable.$inferSelect;

	/** The player's accounts. */
	accounts?: (typeof accountTable.$inferSelect)[] | undefined;

	/** The player's game results. */
	games?: (typeof playerGameResultTable.$inferSelect)[] | undefined;

	/** The player's teams. */
	teams?: (typeof teamPlayerTable.$inferSelect)[] | undefined;

	/** The player's registration for the relevant season. */
	draftPlayer?: typeof draftPlayerTable.$inferSelect | undefined;
}

/**
 * A card that displays information about a player.
 * @param props - The properties to pass to the player card.
 * @returns The player card.
 * @public
 */
export default function PlayerCard({
	player,
	accounts,
	games,
	teams,
	draftPlayer,
	className,
	style,
	...props
}: PlayerCardProps): JSX.Element {
	const highestRankedAccount =
		accounts ? getHighestRankedAccount(accounts) : void 0;
	const backgroundImageUrl = getBackgroundImageUrl(player);
	let finalStyle = style;
	if (backgroundImageUrl) {
		finalStyle ??= {};
		finalStyle.aspectRatio = 3; // Reduce aspect ratio if there is a background image so that more is displayed.
		finalStyle.backgroundImage = `url(${backgroundImageUrl})`;
	}

	return (
		<a
			className={multiclass(className, styles["player-card"])}
			style={finalStyle}
			href={getPlayerUrl(player)}
			{...props}
		>
			<div>
				<h3>
					{player.displayName ?? player.name}
					{highestRankedAccount && (
						<RankedEmblem tier={highestRankedAccount.tier} />
					)}
				</h3>
				<p>
					{`${player.primaryRole ?? "?"}/${player.secondaryRole ?? "?"}`}
					{draftPlayer && ` - ${(draftPlayer.pointValue ?? 0).toString()} PV`}
				</p>
				{games && <p>{`KDA: ${getAverageKda(...games).toFixed(2)}`}</p>}
				{teams && <p>{`Seasons: ${teams.length.toString()}`}</p>}
			</div>
		</a>
	);
}
