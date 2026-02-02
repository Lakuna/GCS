import Form, { type FormProps } from "components/Form";
import { playerTable, positionEnum } from "db/schema";
import type { JSX } from "react";
import type Position from "types/riot/Position";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to an update player form.
 * @public
 */
export interface UpdatePlayerFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
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
				await db
					.update(playerTable)
					.set({
						displayName,
						primaryRole: getFormField(form, "primaryRole") as
							| Position
							| undefined,
						secondaryRole: getFormField(form, "secondaryRole") as
							| Position
							| undefined
					})
					.where(eq(playerTable.id, player.id));
				revalidatePath("/signup");
			}}
			{...props}
		>
			<header>
				<h3>{"Update Player"}</h3>
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
				<Submit value="Update" />
			</p>
		</Form>
	);
}
