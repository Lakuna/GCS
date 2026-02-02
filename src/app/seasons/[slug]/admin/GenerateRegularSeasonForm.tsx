import Form, { type FormProps } from "components/Form";
import { matchFormatEnum, matchTable, seasonTable, teamTable } from "db/schema";
import type { JSX } from "react";
import type MatchFormat from "types/MatchFormat";
import Submit from "components/Submit";
import createMatchesWithGames from "util/createMatchesWithGames";
import getFormField from "util/getFormField";
import getSeasonUrl from "util/getSeasonUrl";
import hasRiotApiKey from "util/hasRiotApiKey";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a seed season form.
 * @public
 */
export interface SeedSeasonFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current season. */
	season: typeof seasonTable.$inferSelect;

	/** The teams in the current season. */
	teams: (typeof teamTable.$inferSelect)[];
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
}: SeedSeasonFormProps): JSX.Element {
	const safeguardText = "CONFIRM";

	return (
		<Form
			action={async (form) => {
				"use server";
				if (getFormField(form, "safeguard") !== safeguardText) {
					return "Invalid safeguard.";
				}

				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				const format = getFormField(form, "format", true) as MatchFormat;
				const rounds = parseInt(getFormField(form, "rounds", true), 10);

				// Split season teams into pools.
				const pools = new Map<number, (typeof teamTable.$inferSelect)[]>();
				for (const team of teams) {
					const pool = pools.get(team.pool);
					if (pool) {
						pool.push(team);
						continue;
					}

					pools.set(team.pool, [team]);
				}

				// Use the circle method to generate a single round robin regular season.
				const matches: (typeof matchTable.$inferInsert)[] = [];
				for (let i = 0; i < rounds; i++) {
					for (const pool of pools.values()) {
						// One round per team, adding a fake "bye" team if there are an odd number of teams.
						const l = pool.length + (pool.length % 2) - 1; // Minus one to make zero-based for ease of use.
						const matchesInRound = (l + 1) / 2;
						for (let j = 0; j < l; j++) {
							for (let k = 0; k < matchesInRound; k++) {
								const blueTeam = pool[k && ((j + k - 1) % l) + 1];
								const redTeam = pool[l - k && ((j + (l - k) - 1) % l) + 1];

								// Skip the bye team.
								if (!blueTeam || !redTeam) {
									continue;
								}

								matches.push({
									blueTeamId: i % 2 === 0 ? blueTeam.id : redTeam.id,
									format,
									redTeamId: i % 2 === 0 ? redTeam.id : blueTeam.id,
									round: i * l + j + 1, // One-based in database.
									seasonId: season.id,
									timeSlot: Math.floor((2 * k) / matchesInRound) + 1 // One-based in database.
								});
							}
						}
					}
				}

				await createMatchesWithGames(matches);
				revalidatePath(getSeasonUrl(season));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Generate Regular Season"}</h3>
			</header>
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
					{"Rounds"}
					<input
						type="number"
						name="rounds"
						min={1}
						defaultValue={2}
						required
					/>
				</label>
			</p>
			<p>
				<label>
					{"Safeguard"}
					<input
						type="text"
						name="safeguard"
						placeholder={safeguardText}
						required
					/>
				</label>
			</p>
			<p>
				<Submit value="Generate" />
			</p>
		</Form>
	);
}
