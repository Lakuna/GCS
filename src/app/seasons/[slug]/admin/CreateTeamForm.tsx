import Form, { type FormProps } from "components/Form";
import { type seasonTable, teamTable } from "db/schema";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import domain from "util/domain";
import getFormField from "util/getFormField";
import getSeasonUrl from "util/getSeasonUrl";
import { revalidatePath } from "next/cache";
import slugify from "util/slugify";

/**
 * Properties that can be passed to a create team form.
 * @public
 */
export interface CreateTeamFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current season. */
	season: typeof seasonTable.$inferSelect;
}

/**
 * A form for creating a team.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function CreateTeamForm({
	season,
	...props
}: CreateTeamFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				await db.insert(teamTable).values({
					code: getFormField(form, "code", true),
					color: getFormField(form, "color", true).substring(1), // Cut off pound.
					logoUrl: getFormField(form, "logoUrl", true),
					name: getFormField(form, "name", true),
					pool: parseInt(getFormField(form, "pool", true), 10),
					seasonId: season.id,
					slug: slugify(getFormField(form, "slug", true))
				});
				revalidatePath(getSeasonUrl(season));
			}}
			{...props}
		>
			<header>
				<h3>{"Create Team"}</h3>
			</header>
			<p>
				<label>
					{"Code"}
					<input type="text" name="code" maxLength={4} required />
				</label>
			</p>
			<p>
				<label>
					{"Color"}
					<input type="color" name="color" required />
				</label>
			</p>
			<p>
				<label>
					{"Draft order"}
					<input
						type="number"
						name="draftOrder"
						min={1}
						defaultValue={1}
						required
					/>
				</label>
			</p>
			<p>
				<label>
					{"Logo URL"}
					<input
						type="url"
						name="logoUrl"
						maxLength={0x800}
						defaultValue={new URL("/default.png", domain).href}
						required
					/>
				</label>
			</p>
			<p>
				<label>
					{"Name"}
					<input type="text" name="name" maxLength={0x40} required />
				</label>
			</p>
			<p>
				<label>
					{"Pool"}
					<input type="number" name="pool" min={1} defaultValue={1} required />
				</label>
			</p>
			<p>
				<label>
					{"Vanity URL slug"}
					<input type="text" name="slug" maxLength={0x20} required />
				</label>
			</p>
			<p>
				<Submit value="Create" />
			</p>
		</Form>
	);
}
