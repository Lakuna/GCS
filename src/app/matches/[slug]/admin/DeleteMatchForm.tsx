import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import getMatchUrl from "util/getMatchUrl";
import { matchTable } from "db/schema";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a forfeit form.
 * @public
 */
export interface DeleteMatchFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The match to delete. */
	match: typeof matchTable.$inferSelect;
}

/**
 * A form for deleting a match.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function DeleteMatchForm({
	match,
	...props
}: DeleteMatchFormProps): JSX.Element {
	const safeguardText = "CONFIRM";

	return (
		<Form
			action={async (form) => {
				"use server";
				if (getFormField(form, "safeguard") !== safeguardText) {
					return "Invalid safeguard.";
				}

				await db.delete(matchTable).where(eq(matchTable.id, match.id));
				revalidatePath(getMatchUrl(match));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h2>{"Delete"}</h2>
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
