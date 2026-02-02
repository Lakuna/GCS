import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import { playerTable } from "db/schema";

/**
 * Properties that can be passed to a make administrator form.
 * @public
 */
export interface MakeAdminFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The player to make an administrator. */
	player: typeof playerTable.$inferSelect;
}

/**
 * A form for making a player an administrator.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function MakeAdminForm({
	player,
	...props
}: MakeAdminFormProps): JSX.Element {
	return (
		<Form
			action={async () => {
				"use server";
				await db
					.update(playerTable)
					.set({ isAdmin: true })
					.where(eq(playerTable.id, player.id));
			}}
			{...props}
		>
			<header>
				<h3>{"Make Player an Admin"}</h3>
			</header>
			<p>
				<Submit value="Authorize" />
			</p>
		</Form>
	);
}
