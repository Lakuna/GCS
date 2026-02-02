import Form, { type FormProps } from "components/Form";
import { gameTable, type matchTable } from "db/schema";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import getMatchUrl from "util/getMatchUrl";
import hasRiotApiKey from "util/hasRiotApiKey";
import makeTournamentCodes from "riot/makeTournamentCodes";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a create game form.
 * @public
 */
export interface CreateGameFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current match. */
	match: typeof matchTable.$inferSelect;
}

/**
 * A form for creating a game.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function CreateGameForm({
	match,
	...props
}: CreateGameFormProps): JSX.Element {
	return (
		<Form
			action={async () => {
				"use server";
				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				const [tournamentCode] = await makeTournamentCodes(
					void 0,
					void 0,
					match.seasonId
				);
				if (!tournamentCode) {
					return "Failed to create a tournament code.";
				}

				await db
					.insert(gameTable)
					.values({ matchId: match.id, tournamentCode });
				revalidatePath(getMatchUrl(match));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Create Game"}</h3>
			</header>
			<p>
				<Submit value="Create" />
			</p>
		</Form>
	);
}
