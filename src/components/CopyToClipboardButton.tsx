"use client";

import type { JSX } from "react";

/**
 * Properties that can be passed to a "copy to clipboard" button.
 * @public
 */
export interface CopyToClipboardButtonProps extends Omit<
	JSX.IntrinsicElements["button"],
	"onClick"
> {
	/** The text to copy to the user's clipboard when they click on the button. */
	text: string;
}

/**
 * A "copy to clipboard" button.
 * @param props - The properties to pass to the button.
 * @returns The button.
 * @public
 */
export default function CopyToClipboardButton({
	text,
	...props
}: CopyToClipboardButtonProps): JSX.Element {
	return (
		<button
			onClick={() => {
				void navigator.clipboard.writeText(text);
			}}
			{...props}
		/>
	);
}
