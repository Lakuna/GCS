import Form, { type FormProps } from "components/Form";
import { playerTable, positionEnum } from "db/schema";
import ChampionList from "./ChampionList";
import type { JSX } from "react";
import Link from "components/Link";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import getPlayerUrl from "util/getPlayerUrl";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to an update player form.
 * @public
 */
export interface UpdatePlayerFormProps
	extends Omit<FormProps, "action" | "children"> {
	/** The current player. */
	player: typeof playerTable.$inferSelect;
}

/**
 * A form for updating a player.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function UpdatePlayerForm({
	player,
	...props
}: UpdatePlayerFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				const displayName = getFormField(form, "displayName");
				const bgChamp = getFormField(form, "bgChamp");
				await db
					.update(playerTable)
					.set({
						bgChamp,
						bgSkin: bgChamp ? 0 : void 0,
						bio: getFormField(form, "bio"),
						displayName,
						primaryRole: getFormField(form, "primaryRole") as
							| (typeof positionEnum.enumValues)[number]
							| undefined,
						secondaryRole: getFormField(form, "secondaryRole") as
							| (typeof positionEnum.enumValues)[number]
							| undefined
					})
					.where(eq(playerTable.id, player.id));
				if (displayName && displayName !== player.displayName) {
					redirect(getPlayerUrl({ displayName, name: "" }));
				}

				// If the vanity URL didn't change, just reload the page instead.
				revalidatePath(getPlayerUrl(player));
			}}
			{...props}
		>
			<header>
				<h3>{"Update Player"}</h3>
				<p>
					{"Player biographies support "}
					<Link href="https://commonmark.org/">{"CommonMark"}</Link>
					{"."}
				</p>
			</header>
			<p>
				<label>
					{"Display name"}
					<input
						type="text"
						name="displayName"
						maxLength={0x20}
						defaultValue={player.displayName ?? void 0}
					/>
				</label>
			</p>
			<p>
				<label>
					{"Biography"}
					<textarea
						name="bio"
						maxLength={0x100}
						defaultValue={player.bio ?? void 0}
					/>
				</label>
			</p>
			<p>
				<label>
					{"Primary role"}
					<select
						name="primaryRole"
						defaultValue={player.primaryRole ?? void 0}
					>
						<option />
						{positionEnum.enumValues.map((role) => (
							<option value={role} key={role}>
								{role}
							</option>
						))}
					</select>
				</label>
			</p>
			<p>
				<label>
					{"Secondary role"}
					<select
						name="secondaryRole"
						defaultValue={player.secondaryRole ?? void 0}
					>
						<option />
						{positionEnum.enumValues.map((role) => (
							<option value={role} key={role}>
								{role}
							</option>
						))}
					</select>
				</label>
			</p>
			<p>
				<label>
					{"Background champion"}
					<ChampionList
						name="bgChamp"
						defaultValue={player.bgChamp ?? void 0}
					/>
				</label>
			</p>
			<p>
				<Submit value="Update" />
			</p>
		</Form>
	);
}
