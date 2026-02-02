"use client";

import { type JSX, Suspense, useEffect, useState } from "react";

/**
 * Properties that can be passed to a date display.
 * @public
 */
export interface LocalDateProps extends Omit<
	JSX.IntrinsicElements["time"],
	"children" | "dateTime"
> {
	// The date represented by the display.
	date: Date;

	// An `Intl.DateTimeFormat` cannot be passed from the server to a client component, so we need to pass the arguments instead.

	/** The date time locales to use for formatting the date string. */
	locales?: Intl.LocalesArgument | undefined;

	/** The date time format to use for formatting the date string. */
	options?: Intl.DateTimeFormatOptions | undefined;
}

/**
 * Display a date in local time.
 * @param props - The properties to pass to the date display.
 * @returns The date display.
 * @public
 */
export default function LocalDate({
	date,
	locales,
	options,
	...props
}: LocalDateProps): JSX.Element {
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => {
		// TODO
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setHydrated(true);
	}, []);

	// Rebuild the date time format from its arguments.
	const format = new Intl.DateTimeFormat(locales, options);

	// Credit: François Best (https://francoisbest.com/posts/2023/displaying-local-times-in-nextjs).
	return (
		<Suspense key={hydrated ? "local" : "server"}>
			<time dateTime={date.toISOString()} {...props}>
				{format.format(date)}
			</time>
		</Suspense>
	);
}
