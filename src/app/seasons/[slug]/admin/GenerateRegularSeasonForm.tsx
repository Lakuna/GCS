import { type JSX, useId } from "react";
import Form from "components/Form";
import type { InsertMatch } from "types/db/Match";
import type { MatchFormat } from "types/db/MatchFormat";
import type { Season } from "types/db/Season";
import Submit from "components/Submit";
import type { Team } from "types/db/Team";
import createMatches from "db/createMatches";
import getFormField from "util/getFormField";
import getSeasonUrl from "util/getSeasonUrl";
import { matchFormatEnum } from "db/schema";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a seed season form.
 * @public
 */
export interface SeedSeasonFormProps
	extends Omit<JSX.IntrinsicElements["form"], "action"> {
	/** The current season. */
	season: Season;

	/** The teams in the current season. */
	teams: Team[];
}

/**
 * A form for generating a regular season.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function GenerateRegularSeasonForm({
	season,
	teams,
	...props
}: SeedSeasonFormProps) {
	const formatId = useId();

	return (
		<Form
			action={async (form) => {
				"use server";

				// Read form data.
				const format = getFormField(form, "format", true) as MatchFormat;

				// Split season teams into pools.
				const pools = new Map<number, Team[]>();
				for (const team of teams) {
					const pool = pools.get(team.pool);
					if (pool) {
						pool.push(team);
						continue;
					}

					pools.set(team.pool, [team]);
				}

				// Use the circle method to generate a single round robin regular season.
				const matches: InsertMatch[] = [];
				for (const pool of pools.values()) {
					// One round per team, adding a fake "bye" team if there are an odd number of teams.
					const l = pool.length + (pool.length % 2) - 1;
					for (let i = 0; i < l; i++) {
						for (let j = 0; j < (l + 1) / 2; j++) {
							// Skip the bye team.
							const blueTeam = pool[j && ((i + j - 1) % l) + 1];
							if (!blueTeam) {
								continue;
							}

							const redTeam = pool[l - j && ((i + (l - j) - 1) % l) + 1];
							if (!redTeam) {
								continue;
							}

							matches.push({
								blueTeamId: blueTeam.id,
								format,
								redTeamId: redTeam.id,
								round: i + 1, // Round is one-based in the database.
								seasonId: season.id
							});
						}
					}
				}

				await createMatches(matches);
				revalidatePath(getSeasonUrl(season));
			}}
			{...props}
		>
			<header>
				<h3>{"Generate Regular Season"}</h3>
			</header>
			<label htmlFor={formatId}>{"Format"}</label>
			<select id={formatId} name={"format"} defaultValue={"Best of 3"} required>
				{matchFormatEnum.enumValues.map((format) => (
					<option value={format} key={format}>
						{format}
					</option>
				))}
			</select>
			<Submit value="Generate" />
		</Form>
	);
}
