import type {
	matchTable,
	seasonTable,
	teamGameResultTable,
	teamTable
} from "db/schema";
import Image from "./Image";
import type { JSX } from "react";
import type { LinkProps } from "./Link";
import LocalDate from "./LocalDate";
import getMatchDateTime from "util/getMatchDateTime";
import getMatchUrl from "util/getMatchUrl";
import multiclass from "util/multiclass";
import placeholder from "./assets/placeholder.png";
import style from "./styles/match-card.module.scss";

/**
 * Properties that can be passed to a match card.
 * @public
 */
export interface MatchCardProps extends Omit<LinkProps, "children" | "href"> {
	/** The match that is represented by the card. */
	match: typeof matchTable.$inferSelect;

	/** The season that the match is part of. */
	season?: typeof seasonTable.$inferSelect | undefined;

	/** The teams in the match. */
	teams?: (typeof teamTable.$inferSelect)[] | undefined;

	/** The game results in the match. */
	teamGameResults?: (typeof teamGameResultTable.$inferSelect)[] | undefined;

	/** The locales to use for formatting the date time string. */
	dateTimeLocales?: Intl.LocalesArgument | undefined;

	/** The date time format options to use for formatting the date string. */
	dateTimeFormatOptions?: Intl.DateTimeFormatOptions | undefined;
}

/**
 * A card that displays information about a match.
 * @param props - The properties to pass to the team card.
 * @returns The team card.
 * @public
 */
export default function MatchCard({
	match,
	season,
	teams,
	teamGameResults,
	dateTimeLocales,
	dateTimeFormatOptions,
	className,
	...props
}: MatchCardProps): JSX.Element {
	const blueTeam = teams?.find((team) => team.id === match.blueTeamId);
	const redTeam = teams?.find((team) => team.id === match.redTeamId);
	const dateTime = season && getMatchDateTime(match, season);

	return (
		<a
			className={multiclass(className, style["match-card"])}
			href={getMatchUrl(match)}
			{...props}
		>
			<p>{match.format}</p>
			{blueTeam ?
				<>
					<h3>{blueTeam.code}</h3>
					<Image
						alt="Logo"
						src={blueTeam.logoUrl}
						untrusted
						width={512}
						height={512}
						style={{ border: `1px solid #${blueTeam.color}` }}
					/>
				</>
			:	<>
					<h3>{"CODE"}</h3>
					<Image alt="Logo" src={placeholder} />
				</>
			}
			<h3 className={style["score"]}>
				{teamGameResults?.length ?
					`${teamGameResults.filter(({ isWinner, teamId }) => isWinner && teamId === blueTeam?.id).length.toString()}-${teamGameResults.filter(({ isWinner, teamId }) => isWinner && teamId === redTeam?.id).length.toString()}`
				:	"VS"}
			</h3>
			{redTeam ?
				<>
					<Image
						alt="Logo"
						src={redTeam.logoUrl}
						untrusted
						width={512}
						height={512}
						style={{ border: `1px solid #${redTeam.color}` }}
					/>
					<h3>{redTeam.code}</h3>
				</>
			:	<>
					<Image alt="Logo" src={placeholder} />
					<h3>{"CODE"}</h3>
				</>
			}
			{dateTime && (
				<p>
					<LocalDate
						date={dateTime}
						locales={dateTimeLocales}
						options={dateTimeFormatOptions}
					/>
				</p>
			)}
		</a>
	);
}
