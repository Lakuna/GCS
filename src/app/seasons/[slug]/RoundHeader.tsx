"use client";

import { type JSX, type Ref, useEffect, useRef } from "react";
import type { matchTable, seasonTable } from "db/schema";
import LocalDate from "components/LocalDate";
import getMatchDateTime from "util/getMatchDateTime";

/**
 * Properties that can be passed to a round header.
 * @public
 */
export interface RoundHeaderProps
	extends Omit<JSX.IntrinsicElements["header"], "children" | "ref"> {
	/** The round number. */
	round: number;

	/** The first match in the round. */
	match?: typeof matchTable.$inferSelect | undefined;

	/** The season of the round. */
	season: typeof seasonTable.$inferSelect;

	/** Whether or not to scroll to this round. */
	doScrollTo: boolean;
}

/**
 * A round header.
 * @param props - Properties that can be passed to a round header.
 * @public
 */
export default function RoundHeader({
	round,
	match,
	season,
	doScrollTo,
	...props
}: RoundHeaderProps): JSX.Element {
	const ref: Ref<HTMLElement | null> = useRef(null);

	useEffect(() => {
		if (!doScrollTo) {
			return;
		}

		ref.current?.scrollIntoView({ behavior: "smooth" });
	}, [doScrollTo]);

	return (
		<header ref={ref} {...props}>
			{match ? (
				<h3>
					<LocalDate
						date={getMatchDateTime(match, season)}
						options={{
							day: "numeric",
							month: "long",
							weekday: "long"
						}}
					/>
				</h3>
			) : (
				<h3>{`Round ${round.toString()}`}</h3>
			)}
		</header>
	);
}
