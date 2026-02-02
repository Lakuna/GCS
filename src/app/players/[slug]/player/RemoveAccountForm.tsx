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
 * Properties that can be passed to a remove account form.
 * @public
 */
export interface RemoveAccountFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The player to remove the account from. */
	player: typeof playerTable.$inferSelect;

	/** The player's existing accounts. */
	accounts: (typeof accountTable.$inferSelect)[];
}

/**
 * A form for removing an account.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function RemoveAccountForm({
	player,
	accounts,
	...props
}: RemoveAccountFormProps): JSX.Element {
	const primaryPuuid = accounts.find(({ isPrimary }) => isPrimary)?.puuid;
	const backupPuuid = accounts.find(
		({ puuid }) => puuid !== primaryPuuid
	)?.puuid;

	return (
		<Form
			action={async (form) => {
				"use server";

				const puuid = getFormField(form, "puuid", true);
				await db.delete(accountTable).where(eq(accountTable.puuid, puuid));
				if (puuid === primaryPuuid && backupPuuid) {
					await db
						.update(accountTable)
						.set({ isPrimary: true })
						.where(eq(accountTable.puuid, backupPuuid));
				}

				revalidatePath(getPlayerUrl(player));
			}}
			{...props}
		>
			<header>
				<h3>{"Remove Account"}</h3>
			</header>
			<p>
				<label>
					{"Account"}
					<select name="puuid" required>
						{accounts.map((account) => (
							<option
								value={account.puuid}
								key={account.puuid}
							>{`${account.name}#${account.tagLine}`}</option>
						))}
					</select>
				</label>
			</p>
			<p>
				<Submit value="Remove" />
			</p>
		</Form>
	);
}
