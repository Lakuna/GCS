"use client";

import { type JSX, useActionState } from "react";
import NextForm, { type FormProps as NextFormProps } from "next/form";
import isDev from "util/isDev";
import multiclass from "util/multiclass";
import style from "./styles/form.module.scss";

/**
 * Properties that can be passed to a form.
 * @public
 */
export interface FormProps extends Omit<NextFormProps, "action"> {
	/** If this is a string, it will be interpreted as a path or URL to navigate to when the form is submitted. The path will be prefetched when the form becomes visible. If this is a function, it will be called when the form is submitted. Equivalent to `FormProps["action"]` from Next.js, but returned strings will be displayed as error messages. */
	action: NonNullable<
		| string
		| ((formData: FormData) => void | Promise<void>)
		| ((
				formData: FormData
		  ) => (string | undefined) | Promise<string | undefined>)
		| undefined
	>;
}

/**
 * Create a form. Automatically displays the message of any error that is thrown during the form action.
 * @param props - The properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function Form({
	action,
	children,
	className,
	...props
}: FormProps): JSX.Element {
	// If the action is a server function, wrap it to catch and display error messages.
	const [state, dispatch] = useActionState(
		async (_: string | undefined, payload: FormData) => {
			if (typeof action !== "function") {
				return void 0;
			}

			try {
				return (await action(payload)) ?? void 0;
			} catch (error) {
				// Error messages are obfuscated in production. Return a string to show an error message to users.
				return (
					isDev ?
						error instanceof Error ?
							error.message
						:	"Error."
					:	"There was an error submitting the form. Did you fill out any fields?"
				);
			}
		},
		void 0
	);

	return (
		<NextForm
			action={typeof action === "function" ? dispatch : action}
			className={multiclass(className, style["grid-form"])}
			{...props}
		>
			{children}
			{state && (
				<footer>
					<output>{state}</output>
				</footer>
			)}
		</NextForm>
	);
}
