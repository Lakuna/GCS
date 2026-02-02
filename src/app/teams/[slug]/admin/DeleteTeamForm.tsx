import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import getTeamUrl from "util/getTeamUrl";
import { revalidatePath } from "next/cache";
import { teamTable } from "db/schema";

/**
 * Properties that can be passed to a delete team form.
 * @public
 */
export interface DeleteTeamFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current team. */
	team: typeof teamTable.$inferSelect;
}

/**
 * A form for deleting a team.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function DeleteTeamForm({
	team,
	...props
}: DeleteTeamFormProps): JSX.Element {
	const safeguardText = "CONFIRM";

	return (
		<Form
			action={async (form) => {
				"use server";
				if (getFormField(form, "safeguard") !== safeguardText) {
					return "Invalid safeguard.";
				}

				await db.delete(teamTable).where(eq(teamTable.id, team.id));
				revalidatePath(getTeamUrl(team));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Delete Team"}</h3>
			</header>
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
				<Submit value="Delete" />
			</p>
		</Form>
	);
}
