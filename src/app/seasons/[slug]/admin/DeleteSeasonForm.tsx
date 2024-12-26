import { type JSX, useId } from "react";
import Submit from "components/Submit";
import deleteSeason from "db/deleteSeason";
import getFormField from "utility/getFormField";
import getSeasonUrl from "utility/getSeasonUrl";
import { revalidatePath } from "next/cache";
import type { seasonsTable } from "db/schema";

/**
 * Properties that can be passed to a delete season form.
 * @public
 */
export interface DeleteSeasonFormProps
	extends Omit<JSX.IntrinsicElements["form"], "action"> {
	/** The current season. */
	season: typeof seasonsTable.$inferSelect;
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
	const safeguardId = useId();

	return (
		<form
			action={async (form) => {
				"use server";

				// Prevent the user from accidentally doing something dangerous.
				if (getFormField(form, "safeguard") !== "CONFIRM") {
					return;
				}

				await deleteSeason(season.id);
				revalidatePath(getSeasonUrl(season));
			}}
			{...props}
		>
			<header>
				<h3>{"Delete Season"}</h3>
			</header>
			<label htmlFor={safeguardId}>{"Safeguard"}</label>
			<input
				type="text"
				id={safeguardId}
				name="safeguard"
				placeholder="CONFIRM"
			/>
			<Submit value="Delete" />
		</form>
	);
}
