import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import getTeamUrl from "util/getTeamUrl";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import slugify from "util/slugify";
import { teamTable } from "db/schema";

/**
 * Properties that can be passed to a create team form.
 * @public
 */
export interface UpdateTeamFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The team to modify. */
	team: typeof teamTable.$inferSelect;
}

/**
 * A form for updating a team.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function UpdateTeamForm({
	team,
	...props
}: UpdateTeamFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				const rawSlug = getFormField(form, "slug");
				const slug = rawSlug && slugify(rawSlug);
				const poolString = getFormField(form, "pool");
				const draftOrderString = getFormField(form, "draftOrder");
				await db
					.update(teamTable)
					.set({
						code: getFormField(form, "code"),
						color: getFormField(form, "color")?.substring(1), // Cut off pound.
						draftOrder:
							draftOrderString ? parseInt(draftOrderString, 10) : void 0,
						isWinner: Boolean(getFormField(form, "isWinner")) || null,
						logoUrl: getFormField(form, "logoUrl"),
						name: getFormField(form, "name"),
						pool: poolString ? parseInt(poolString, 10) : void 0,
						slug
					})
					.where(eq(teamTable.id, team.id));
				if (slug && slug !== team.slug) {
					redirect(getTeamUrl({ slug }));
				}

				// If the vanity URL didn't change, just reload the page instead.
				revalidatePath(getTeamUrl(team));
			}}
			{...props}
		>
			<header>
				<h3>{"Update Team"}</h3>
			</header>
			<p>
				<label>
					{"Code"}
					<input
						type="text"
						name="code"
						maxLength={4}
						defaultValue={team.code}
					/>
				</label>
			</p>
			<p>
				<label>
					{"Color"}
					<input type="color" name="color" defaultValue={`#${team.color}`} />
				</label>
			</p>
			<p>
				<label>
					{"Draft order"}
					<input
						type="number"
						name="draftOrder"
						defaultValue={team.draftOrder}
					/>
				</label>
			</p>
			<p>
				<label>
					{"Is winner?"}
					<input
						type="checkbox"
						name="isWinner"
						defaultChecked={team.isWinner ?? void 0}
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
						defaultValue={team.logoUrl}
					/>
				</label>
			</p>
			<p>
				<label>
					{"Name"}
					<input
						type="text"
						name="name"
						maxLength={0x40}
						defaultValue={team.name}
					/>
				</label>
			</p>
			<p>
				<label>
					{"Pool"}
					<input type="number" name="pool" min={1} defaultValue={team.pool} />
				</label>
			</p>
			<p>
				<label>
					{"Vanity URL slug"}
					<input
						type="text"
						name="slug"
						maxLength={0x20}
						defaultValue={team.slug}
					/>
				</label>
			</p>
			<p>
				<Submit value="Update" />
			</p>
		</Form>
	);
}
