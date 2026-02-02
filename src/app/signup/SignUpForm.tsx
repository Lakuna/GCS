import Form, { type FormProps } from "components/Form";
import {
	type accountTable,
	draftPlayerTable,
	type playerTable,
	type seasonTable
} from "db/schema";
import type { JSX } from "react";
import Markdown from "react-markdown";
import Submit from "components/Submit";
import db from "db/db";
import getFormField from "util/getFormField";
import hasRiotApiKey from "util/hasRiotApiKey";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to a sign-up form.
 * @public
 */
export interface SignUpFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The player to sign up for the next season. */
	player: typeof playerTable.$inferSelect;

	/** The season to sign up for. */
	season: typeof seasonTable.$inferSelect;

	/** The player's accounts. */
	accounts: (typeof accountTable.$inferSelect)[];

	/** Questions to ask the player as they sign up. */
	questions?: string | undefined;
}

/**
 * A form for signing a player up for the next season.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function SignUpForm({
	player,
	season,
	accounts,
	questions,
	...props
}: SignUpFormProps): JSX.Element {
	// Can't call methods on properties passed from the client to the server, so do it here instead.
	const anyAccountIsVerified = accounts.some(({ isVerified }) => isVerified);

	return (
		<Form
			action={async (form) => {
				"use server";
				if (
					player.bannedUntil &&
					new Date(player.bannedUntil).valueOf() > Date.now()
				) {
					return "You may not sign up while you are banned.";
				}

				if (
					!player.primaryRole ||
					!player.secondaryRole ||
					player.primaryRole === player.secondaryRole
				) {
					return "You must select two distinct roles as your primary and secondary role to sign up.";
				}

				if (hasRiotApiKey() && !anyAccountIsVerified) {
					return "You must have at least one verified account to sign up.";
				}

				await db
					.insert(draftPlayerTable)
					.values({
						notes: getFormField(form, "notes", true),
						playerId: player.id,
						seasonId: season.id
					});
				revalidatePath("/signup");
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{`Register for ${season.name}`}</h3>
				{questions && <Markdown>{questions}</Markdown>}
			</header>
			<p>
				<textarea name="notes" required />
			</p>
			<p>
				<Submit value="Register" />
			</p>
		</Form>
	);
}
