import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import Submit from "components/Submit";
import { auth } from "db/auth";
import db from "db/db";
import { eq } from "drizzle-orm";
import getSeasonUrl from "util/getSeasonUrl";
import { revalidatePath } from "next/cache";
import { seasonTable } from "db/schema";

/**
 * Properties that can be passed to a start draft form.
 * @public
 */
export interface StartDraftFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current season. */
	season: typeof seasonTable.$inferSelect;
}

/**
 * A form for allowing admins to start a season draft.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function StartDraftForm({
	season,
	...props
}: StartDraftFormProps): JSX.Element {
	return (
		<Form
			action={async () => {
				"use server";
				const session = await auth();
				if (!session?.user?.isAdmin) {
					return "You must be an admin to start the draft.";
				}

				await db
					.update(seasonTable)
					.set({ draftStartedAt: new Date() })
					.where(eq(seasonTable.id, season.id));
				revalidatePath(getSeasonUrl(season));
				revalidatePath(`${getSeasonUrl(season)}/draft`);
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Draft"}</h3>
			</header>
			<p>
				{season.draftStartedAt ?
					"Drafting is open."
				:	"Captains cannot draft players until an admin starts the draft."}
			</p>
			<p>
				<Submit value="Start Draft" disabled={season.draftStartedAt !== null} />
			</p>
		</Form>
	);
}
