"use client";

import CopyToClipboardButton from "./CopyToClipboardButton";
import { type JSX } from "react";
import multiclass from "util/multiclass";
import style from "./styles/tournament-code.module.scss";

/**
 * Properties that can be passed to a tournament code display.
 * @public
 */
export interface TournamentCodeProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	// The tournament code represented by the display.
	tournamentCode: string;
}

/**
 * Display a tournament code.
 * @param props - The properties to pass to the tournament code display.
 * @returns The date display.
 * @public
 */
export default function TournamentCode({
	tournamentCode,
	className,
	...props
}: TournamentCodeProps): JSX.Element {
	return (
		<div className={multiclass(className, style["tournament-code"])} {...props}>
			<samp>{tournamentCode}</samp>
			<CopyToClipboardButton text={tournamentCode}>
				{"Copy"}
			</CopyToClipboardButton>
		</div>
	);
}
