import Form, { type FormProps } from "components/Form";
import { matchFormatEnum, seasonTable, teamTable } from "db/schema";
import type { JSX } from "react";
import type MatchFormat from "types/MatchFormat";
import Submit from "components/Submit";
import createMatchesWithGames from "util/createMatchesWithGames";
import getFormField from "util/getFormField";
import getSeasonUrl from "util/getSeasonUrl";
import hasRiotApiKey from "util/hasRiotApiKey";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a create match form.
 * @public
 */
export interface CreateMatchFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current season. */
	season: typeof seasonTable.$inferSelect;

	/** The teams in the current season. */
	teams: (typeof teamTable.$inferSelect)[];
}

/**
 * A form for creating a match.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function CreateMatchForm({
	season,
	teams,
	...props
}: CreateMatchFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				const blueTeamId = parseInt(getFormField(form, "blueTeamId", true), 10);
				const redTeamId = parseInt(getFormField(form, "redTeamId", true), 10);
				if (blueTeamId === redTeamId) {
					return "A team cannot play a match against itself!";
				}

				await createMatchesWithGames([
					{
						blueTeamId,
						format: getFormField(form, "format", true) as MatchFormat,
						isPlayoffs: Boolean(getFormField(form, "isPlayoffs")),
						redTeamId,
						round: parseInt(getFormField(form, "round", true), 10),
						seasonId: season.id,
						timeSlot: parseInt(getFormField(form, "timeSlot", true), 10)
					}
				]);
				revalidatePath(getSeasonUrl(season));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Create Match"}</h3>
			</header>
			<p>
				<label>
					{"Blue team"}
					<select name="blueTeamId" required>
						{teams.map((team) => (
							<option value={team.id} key={team.id}>
								{team.name}
							</option>
						))}
					</select>
				</label>
			</p>
			<p>
				<label>
					{"Format"}
					<select name="format" defaultValue="Best of 3" required>
						{matchFormatEnum.enumValues.map((format) => (
							<option value={format} key={format}>
								{format}
							</option>
						))}
					</select>
				</label>
			</p>
			<p>
				<label>
					{"Red team"}
					<select name="redTeamId" required>
						{teams.map((team) => (
							<option value={team.id} key={team.id}>
								{team.name}
							</option>
						))}
					</select>
				</label>
			</p>
			<p>
				<label>
					{"Round"}
					<input type="number" name="round" min={1} defaultValue={1} required />
				</label>
			</p>
			<p>
				<label>
					{"Time slot"}
					<input
						type="number"
						name="timeSlot"
						min={1}
						defaultValue={1}
						required
					/>
				</label>
			</p>
			<p>
				<label>
					{"Playoffs match?"}
					<input type="checkbox" name="isPlayoffs" />
				</label>
			</p>
			<p>
				<Submit value="Create" />
			</p>
		</Form>
	);
}
