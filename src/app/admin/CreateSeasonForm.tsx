import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import getFormField from "util/getFormField";
import hasRiotApiKey from "util/hasRiotApiKey";
import makeTournament from "riot/makeTournament";
import { seasonTable } from "db/schema";
import slugify from "util/slugify";

/**
 * Properties that can be passed to a create season form.
 * @public
 */
export type CreateSeasonFormProps = Omit<FormProps, "action" | "children">;

/**
 * A form for creating a season.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function CreateSeasonForm(
	props: CreateSeasonFormProps
): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				const name = getFormField(form, "name", true);
				await db
					.insert(seasonTable)
					.values({
						id: await makeTournament(name),
						name,
						slug: slugify(getFormField(form, "vanityUrlSlug", true)),
						startDate: getFormField(form, "startDate")
					});
				return void 0;
			}}
			{...props}
		>
			<header>
				<h2>{"Create Season"}</h2>
			</header>
			<p>
				<label>
					{"Start date"}
					<input type="date" name="startDate" />
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
					{"Vanity URL slug"}
					<input type="text" name="vanityUrlSlug" maxLength={0x20} required />
				</label>
			</p>
			<p>
				<Submit value="Create" />
			</p>
		</Form>
	);
}
