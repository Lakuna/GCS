import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import { playerTable } from "db/schema";

/**
 * Properties that can be passed to a ban player form.
 * @public
 */
export interface BanPlayerFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The player to ban. */
	player: typeof playerTable.$inferSelect;
}

/**
 * A form for banning a player.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function BanPlayerForm({
	player,
	...props
}: BanPlayerFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				await db
					.update(playerTable)
					.set({
						bannedUntil: getFormField(form, "bannedUntil", true).substring(
							0,
							10
						)
					})
					.where(eq(playerTable.id, player.id));
			}}
			{...props}
		>
			<header>
				<h3>{"Ban Player"}</h3>
				<p>{"Set this to a date in the past to unban this player."}</p>
			</header>
			<p>
				<label>
					{"Banned until"}
					<input type="date" name="bannedUntil" required />
				</label>
			</p>
			<p>
				<Submit value="Ban" />
			</p>
		</Form>
	);
}
