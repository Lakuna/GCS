import Form, { type FormProps } from "components/Form";
import { accountTable, type playerTable } from "db/schema";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import getPlayerUrl from "util/getPlayerUrl";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a set primary account form.
 * @public
 */
export interface SetPrimaryAccountFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The player to set the primary account of. */
	player: typeof playerTable.$inferSelect;

	/** The player's existing accounts. */
	accounts: (typeof accountTable.$inferSelect)[];
}

/**
 * A form for setting a primary account.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function SetPrimaryAccountForm({
	player,
	accounts,
	...props
}: SetPrimaryAccountFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";

				await db
					.update(accountTable)
					.set({ isPrimary: null })
					.where(eq(accountTable.playerId, player.id));
				await db
					.update(accountTable)
					.set({ isPrimary: true })
					.where(eq(accountTable.puuid, getFormField(form, "puuid", true)));

				revalidatePath(getPlayerUrl(player));
			}}
			{...props}
		>
			<header>
				<h3>{"Set Primary Account"}</h3>
			</header>
			<p>
				<label>
					{"Account"}
					<select name="puuid" required>
						{accounts
							.filter(({ isPrimary }) => !isPrimary)
							.map((account) => (
								<option
									value={account.puuid}
									key={account.puuid}
								>{`${account.name}#${account.tagLine}`}</option>
							))}
					</select>
				</label>
			</p>
			<p>
				<Submit value="Set" />
			</p>
		</Form>
	);
}
