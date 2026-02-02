import Form, { type FormProps } from "components/Form";
import {
	type accountTable,
	gameResultTable,
	gameTable,
	matchTable,
	teamGameResultTable,
	type teamTable
} from "db/schema";
import { and, eq } from "drizzle-orm";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import getFormField from "util/getFormField";
import getFormatGameCount from "util/getFormatGameCount";
import getGameUrl from "util/getGameUrl";
import hasRiotApiKey from "util/hasRiotApiKey";
import leftHierarchy from "util/leftHierarchy";
import makeTournamentCodes from "riot/makeTournamentCodes";
import { revalidatePath } from "next/cache";
import saveGame from "util/saveGame";

/**
 * Properties that can be passed to a submit results form.
 * @public
 */
export interface SubmitResultsFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The game to submit results for. */
	game: typeof gameTable.$inferSelect;

	/** The match that the game is a part of. */
	match: typeof matchTable.$inferSelect;

	/** The blue team in the game's match. */
	blueTeam: typeof teamTable.$inferSelect;

	/** The accounts of the players on the blue team in the game's match. */
	blueAccounts: (typeof accountTable.$inferSelect)[];

	/** The red team in the game's match. */
	redTeam: typeof teamTable.$inferSelect;

	/** The accounts of the players on the red team in the game's match. */
	redAccounts: (typeof accountTable.$inferSelect)[];

	/** Whether or not the user is allowed to overwrite existing game results. */
	overwriteEnabled?: boolean | undefined;
}

/**
 * A form for submitting game results to the database.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function SubmitResultsForm({
	game,
	match,
	blueTeam,
	blueAccounts,
	redTeam,
	redAccounts,
	overwriteEnabled,
	...props
}: SubmitResultsFormProps): JSX.Element {
	const puuids = new Map([
		[blueTeam.id, blueAccounts.map(({ puuid }) => puuid)],
		[redTeam.id, redAccounts.map(({ puuid }) => puuid)]
	]);

	return (
		<Form
			action={async (form) => {
				"use server";
				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				// If the game has already been submitted, don't overwrite it.
				if (!overwriteEnabled) {
					const [existingResult] = await db
						.select()
						.from(gameResultTable)
						.where(eq(gameResultTable.tournamentCode, game.tournamentCode));
					if (existingResult) {
						return "Results for this game have already been submitted.";
					}
				}

				// Convert and store game results.
				await saveGame(
					getFormField(form, "gameId", true) as `${number}`,
					puuids,
					game
				);
				revalidatePath(getGameUrl(game));

				// Count the number of wins that each team has.
				const winningTeamGameResults = leftHierarchy(
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
							and(
								eq(matchTable.id, match.id),
								eq(teamGameResultTable.isWinner, true)
							)
						),
					"teamGameResult"
				);
				const wins = new Map<number, number>();
				for (const result of winningTeamGameResults) {
					if (!result.teamId) {
						continue;
					}

					wins.set(result.teamId, (wins.get(result.teamId) ?? 0) + 1);
				}

				// Make another game if necessary.
				const [, , toWin] = getFormatGameCount(match.format);
				for (const a of wins.values()) {
					if (a >= toWin) {
						return void 0;
					}
				}

				// Make a new tournament code for the next game.
				const [tournamentCode] = await makeTournamentCodes(
					void 0,
					1,
					match.seasonId
				);
				if (!tournamentCode) {
					return void 0;
				}

				// Create the next game.
				await db
					.insert(gameTable)
					.values({ matchId: match.id, tournamentCode });

				return void 0;
			}}
			{...props}
		>
			<header>
				<h2>{"Submit Results"}</h2>
				<p>{"Submit a game ID to mark this game as finished."}</p>
			</header>
			<p>
				<label>
					{"Game ID"}
					<input type="number" name="gameId" required />
				</label>
			</p>
			<p>
				<Submit value="Submit" />
			</p>
		</Form>
	);
}
