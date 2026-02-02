import type {
	accountTable,
	gameTable,
	matchTable,
	seasonTable,
	teamTable
} from "db/schema";
import ForfeitForm from "./captain/ForfeitForm";
import { type JSX } from "react";
import SubmitResultsForm from "./captain/SubmitResultsForm";

/**
 * Properties that can be passed to a captain panel.
 * @public
 */
export interface CaptainPanelProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	/** The game to import results for. */
	game: typeof gameTable.$inferSelect;

	/** The match that the game is part of. */
	match?: typeof matchTable.$inferSelect | undefined;

	/** The season that the match is part of. */
	season?: typeof seasonTable.$inferSelect | undefined;

	/** Whether or not the viewing player is the captain of the blue team in the game's match. */
	isBlueCaptain?: boolean | undefined;

	/** The blue team in the game's match. */
	blueTeam?: typeof teamTable.$inferSelect | undefined;

	/** The accounts of the players on the blue team in the game's match. */
	blueAccounts?: (typeof accountTable.$inferSelect)[] | undefined;

	/** Whether or not the viewing player is the captain of the red team in the game's match. */
	isRedCaptain?: boolean | undefined;

	/** The red team in the game's match. */
	redTeam?: typeof teamTable.$inferSelect | undefined;

	/** The accounts of the players on the red team in the game's match. */
	redAccounts?: (typeof accountTable.$inferSelect)[] | undefined;

	/** Whether or not the user is allowed to overwrite existing game results. */
	overwriteEnabled?: boolean | undefined;
}

/**
 * A game page captain panel.
 * @param props - Properties to pass to the panel.
 * @returns The panel.
 * @public
 */
export default function CaptainPanel({
	game,
	match,
	season,
	isBlueCaptain,
	blueTeam,
	blueAccounts,
	isRedCaptain,
	redTeam,
	redAccounts,
	overwriteEnabled,
	...props
}: CaptainPanelProps): JSX.Element {
	return (
		<div {...props}>
			<header>
				<h2>{"Captain Panel"}</h2>
			</header>
			{match && blueTeam && blueAccounts && redTeam && redAccounts && (
				<SubmitResultsForm
					game={game}
					match={match}
					blueTeam={blueTeam}
					blueAccounts={blueAccounts}
					redTeam={redTeam}
					redAccounts={redAccounts}
					overwriteEnabled={overwriteEnabled}
				/>
			)}
			{match && season && blueTeam && redTeam && isBlueCaptain && (
				<ForfeitForm
					game={game}
					match={match}
					season={season}
					redTeam={redTeam}
					team={blueTeam}
				/>
			)}
			{match && season && blueTeam && redTeam && isRedCaptain && (
				<ForfeitForm
					game={game}
					match={match}
					season={season}
					redTeam={redTeam}
					team={redTeam}
				/>
			)}
		</div>
	);
}
