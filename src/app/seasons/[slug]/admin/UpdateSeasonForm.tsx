import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import getSeasonUrl from "util/getSeasonUrl";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { seasonTable } from "db/schema";
import slugify from "util/slugify";

/**
 * Properties that can be passed to an update season form.
 * @public
 */
export interface UpdateSeasonFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current season. */
	season: typeof seasonTable.$inferSelect;
}

/**
 * A form for updating a season.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function UpdateSeasonForm({
	season,
	...props
}: UpdateSeasonFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				const rawSlug = getFormField(form, "slug");
				const slug = rawSlug && slugify(rawSlug);
				await db
					.update(seasonTable)
					.set({
						name: getFormField(form, "name"),
						playoffsStageId: getFormField(form, "playoffsStageId"),
						playoffsTourneyId: getFormField(form, "playoffsTourneyId"),
						slug,
						startDate: getFormField(form, "startDate")
					})
					.where(eq(seasonTable.id, season.id));
				if (slug && slug !== season.slug) {
					redirect(getSeasonUrl({ slug }));
				}

				// If the vanity URL didn't change, just reload the page instead.
				revalidatePath(getSeasonUrl(season));
			}}
			{...props}
		>
			<header>
				<h3>{"Update Season"}</h3>
			</header>
			<p>
				<label>
					{"Start date"}
					<input type="date" name="startDate" defaultValue={season.startDate} />
				</label>
			</p>
			<p>
				<label>
					{"Name"}
					<input type="text" name="name" defaultValue={season.name} />
				</label>
			</p>
			<p>
				<label>
					{"Vanity URL slug"}
					<input type="text" name="slug" defaultValue={season.slug} />
				</label>
			</p>
			<p>
				<label>
					{"Toornament Tournament ID"}
					<input
						type="text"
						name="playoffsTourneyId"
						defaultValue={season.playoffsTourneyId ?? void 0}
					/>
				</label>
			</p>
			<p>
				<label>
					{"Toornament Stage ID"}
					<input
						type="text"
						name="playoffsStageId"
						defaultValue={season.playoffsStageId ?? void 0}
					/>
				</label>
			</p>
			<p>
				<Submit value="Update" />
			</p>
		</Form>
	);
}
