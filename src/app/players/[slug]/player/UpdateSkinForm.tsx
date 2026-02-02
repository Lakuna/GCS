import Form, { type FormProps } from "components/Form";
import type { JSX } from "react";
import SkinList from "./SkinList";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import getPlayerUrl from "util/getPlayerUrl";
import { playerTable } from "db/schema";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to an update skin form.
 * @public
 */
export interface UpdateSkinFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The current player. */
	player: typeof playerTable.$inferSelect;

	/** The current player's current background champion ID. */
	backgroundChampionId: string;
}

/**
 * A form for updating a skin.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function UpdateSkinForm({
	player,
	backgroundChampionId,
	...props
}: UpdateSkinFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				const bgSkin = parseInt(getFormField(form, "bgSkin", true), 10);
				if (bgSkin === player.bgSkin) {
					return;
				}

				await db
					.update(playerTable)
					.set({ bgSkin })
					.where(eq(playerTable.id, player.id));
				revalidatePath(getPlayerUrl(player));
			}}
			{...props}
		>
			<header>
				<h3>{"Update Background Skin"}</h3>
			</header>
			<p>
				<label>
					{"Background skin"}
					<SkinList
						championId={backgroundChampionId}
						name="bgSkin"
						defaultValue={player.bgSkin ?? void 0}
						required
					/>
				</label>
			</p>
			<p>
				<Submit value="Update" />
			</p>
		</Form>
	);
}
