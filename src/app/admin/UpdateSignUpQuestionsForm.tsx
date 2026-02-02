import Form, { type FormProps } from "components/Form";
import Document from "types/Document";
import type { JSX } from "react";
import Link from "components/Link";
import Submit from "components/Submit";
import db from "db/db";
import { documentTable } from "db/schema";
import { eq } from "drizzle-orm";
import getFormField from "util/getFormField";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to an update sign-up questions form.
 * @public
 */
export interface UpdateSignUpQuestionsFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The existing sign-up questions text. */
	text?: string | undefined;
}

/**
 * A form for updating the sign-up questions.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function UpdateSignUpQuestionsForm({
	text,
	...props
}: UpdateSignUpQuestionsFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				await db
					.update(documentTable)
					.set({ text: getFormField(form, "text", true) })
					.where(eq(documentTable.id, Document.SIGN_UP_QUESTIONS));
				revalidatePath("/admin");
			}}
			{...props}
		>
			<header>
				<h3>{"Update Sign-Up Questions"}</h3>
				<p>
					{"Supports "}
					<Link href="https://commonmark.org/">{"CommonMark"}</Link>
					{"."}
				</p>
			</header>
			<p>
				<textarea name="text" defaultValue={text} required />
			</p>
			<p>
				<Submit value="Update" />
			</p>
		</Form>
	);
}
