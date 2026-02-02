import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import { gameTable } from "db/schema";
import getFormField from "util/getFormField";
import getGameUrl from "util/getGameUrl";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a forfeit form.
 * @public
 */
export interface DeleteGameFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The game to delete. */
	game: typeof gameTable.$inferSelect;
}

/**
 * A form for deleting a game.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function DeleteGameForm({
	game,
	...props
}: DeleteGameFormProps): JSX.Element {
	const safeguardText = "CONFIRM";

	return (
		<Form
			action={async (form) => {
				"use server";
				if (getFormField(form, "safeguard") !== safeguardText) {
					return "Invalid safeguard.";
				}

				await db.delete(gameTable).where(eq(gameTable.id, game.id));
				revalidatePath(getGameUrl(game));
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
