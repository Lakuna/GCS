import Form, { type FormProps } from "components/Form";
import { accountTable, type playerTable } from "db/schema";
import type { JSX } from "react";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getPlayerUrl from "util/getPlayerUrl";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a force verify accounts form.
 * @public
 */
export interface ForceVerifyAccountsFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The player to verify the accounts of. */
	player: typeof playerTable.$inferSelect;
}

/**
 * A form for forcibly verifying a player's accounts.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function ForceVerifyAccountsForm({
	player,
	...props
}: ForceVerifyAccountsFormProps): JSX.Element {
	return (
		<Form
			action={async () => {
				"use server";
				await db
					.update(accountTable)
					.set({ isVerified: true })
					.where(eq(accountTable.playerId, player.id));
				revalidatePath(getPlayerUrl(player));
			}}
			{...props}
		>
			<header>
				<h3>{"Force Verify Accounts"}</h3>
			</header>
			<p>
				<Submit value="Verify" />
			</p>
		</Form>
	);
}
