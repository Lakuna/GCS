import Form, { type FormProps } from "components/Form";
import { and, eq } from "drizzle-orm";
import {
	gameResultTable,
	gameTable,
	matchTable,
	seasonTable,
	teamGameResultTable,
	type teamTable
} from "db/schema";
import type { JSX } from "react";
import Submit from "components/Submit";
import createForfeit from "util/createForfeit";
import db from "db/db";
import getFormatGameCount from "util/getFormatGameCount";
import getGameUrl from "util/getGameUrl";
import hasRiotApiKey from "util/hasRiotApiKey";
import leftHierarchy from "util/leftHierarchy";
import makeTournamentCodes from "riot/makeTournamentCodes";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a forfeit form.
 * @public
 */
export interface ForfeitFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The game to set a forfeit for. */
	game: typeof gameTable.$inferSelect;

	/** The match that the game is part of. */
	match: typeof matchTable.$inferSelect;

	/** The season that the match is part of. */
	season: typeof seasonTable.$inferSelect;

	/** The red team in the game's match. */
	redTeam: typeof teamTable.$inferSelect;

	/** The team to forfeit on behalf of. */
	team: typeof teamTable.$inferSelect;
}

/**
 * A form for forfeiting a game.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function ForfeitForm({
	game,
	match,
	season,
	redTeam,
	team,
	...props
}: ForfeitFormProps): JSX.Element {
	return (
		<Form
			action={async () => {
				"use server";
				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				// Create and store dummy game data.
				const [gameResult, teams] = createForfeit(
					match,
					season,
					team.id === redTeam.id
				);
				await db
					.update(gameTable)
					.set({ tournamentCode: gameResult.tournamentCode ?? void 0 })
					.where(eq(gameTable.id, game.id));
				await db.insert(gameResultTable).values(gameResult);
				await db.insert(teamGameResultTable).values(teams);
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
				<h2>{"Forfeit"}</h2>
				<p>{`Forfeit this game on behalf of your team, ${team.name}.`}</p>
			</header>
			<p>
				<Submit value="Forfeit" />
			</p>
		</Form>
	);
}
