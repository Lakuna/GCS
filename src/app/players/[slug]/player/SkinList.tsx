import type { JSX } from "react";
import getChampion from "riot/getChampion";

/**
 * Properties that can be passed to a list of skins.
 * @public
 */
export interface SkinListProps extends Omit<
	JSX.IntrinsicElements["select"],
	"children"
> {
	/** The ID of the champion to list skins for. */
	championId: string;
}

/**
 * A list of skin names mapped to their numbers.
 * @returns The list.
 * @public
 */
export default async function SkinList({
	championId,
	required,
	...props
}: SkinListProps): Promise<JSX.Element> {
	return (
		<select required={required} {...props}>
			{!required && <option />}
			{(await getChampion(championId))?.skins.map(({ name, num }) => (
				<option value={num} key={num}>
					{name}
				</option>
			))}
		</select>
	);
}
