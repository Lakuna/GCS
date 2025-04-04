import Form, { type FormProps } from "components/Form";
import type { accountTable, playerTable } from "db/schema";
import type { JSX } from "react";
import Submit from "components/Submit";
import getPlayerUrl from "util/getPlayerUrl";
import hasRiotApiKey from "util/hasRiotApiKey";
import { revalidatePath } from "next/cache";
import updateAccount from "util/updateAccount";

/**
 * Properties that can be passed to an update accounts form.
 * @public
 */
export interface UpdateAccountsFormProps
	extends Omit<FormProps, "action" | "children"> {
	/** The player to update the accounts of. */
	player: typeof playerTable.$inferSelect;

	/** The accounts to update. */
	accounts: (typeof accountTable.$inferSelect)[];
}

/**
 * A form for updating a player's accounts.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function UpdateAccountsForm({
	player,
	accounts,
	...props
}: UpdateAccountsFormProps): JSX.Element {
	return (
		<Form
			action={async () => {
				"use server";
				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				for (const account of accounts) {
					// eslint-disable-next-line no-await-in-loop
					await updateAccount(account);
				}

				revalidatePath(getPlayerUrl(player));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Update Accounts"}</h3>
			</header>
			<p>
				<Submit value="Update" />
			</p>
		</Form>
	);
}
