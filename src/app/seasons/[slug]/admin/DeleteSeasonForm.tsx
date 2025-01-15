import Form, { type FormProps } from "components/Form";
import type { Season } from "types/db/Season";
import Submit from "components/Submit";
import deleteSeasons from "db/deleteSeasons";
import getFormField from "util/getFormField";
import getSeasonUrl from "util/getSeasonUrl";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a delete season form.
 * @public
 */
export interface DeleteSeasonFormProps
	extends Omit<FormProps, "action" | "children"> {
	/** The current season. */
	season: Season;
}

/**
 * A form for deleting a season.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function DeleteSeasonForm({
	season,
	...props
}: DeleteSeasonFormProps) {
	return (
		<Form
			action={async (form) => {
				"use server";
				if (getFormField(form, "safeguard") !== "CONFIRM") {
					return "Invalid safeguard.";
				}

				await deleteSeasons(season.id);
				revalidatePath(getSeasonUrl(encodeURIComponent(season.vanityUrlSlug)));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Delete Season"}</h3>
			</header>
			<p>
				<label>
					{"Safeguard"}
					<input type="text" name="safeguard" placeholder="CONFIRM" required />
				</label>
			</p>
			<p>
				<Submit value="Delete" />
			</p>
		</Form>
	);
}
