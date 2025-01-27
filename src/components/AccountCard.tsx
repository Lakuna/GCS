import Link, { type LinkProps } from "./Link";
import Image from "./Image";
import type { JSX } from "react";
import RankedEmblem from "./RankedEmblem";
import type { accountTable } from "db/schema";
import getProfileIconUrl from "riot/getProfileIconUrl";
import multiclass from "util/multiclass";
import style from "./styles/account-card.module.scss";

/**
 * Properties that can be passed to an account card.
 * @public
 */
export interface AccountCardProps extends Omit<LinkProps, "children" | "href"> {
	/** The account that is represented by the card. */
	account: typeof accountTable.$inferSelect;
}

/**
 * A card that displays information about an account.
 * @param props - The properties to pass to the account card.
 * @return The account card.
 * @public
 */
export default async function AccountCard({
	account,
	className,
	...props
}: AccountCardProps): Promise<JSX.Element> {
	const ugg = `https://u.gg/lol/profile/${account.region}/${account.gameNameCache}-${account.tagLineCache}/overview`;

	if (!account.isVerified) {
		const profileIconUrl = await getProfileIconUrl(
			account.profileIconIdToVerify
		);
		if (!profileIconUrl) {
			throw new Error("Failed to get profile icon URL.");
		}

		return (
			<Link
				href={ugg}
				className={multiclass(className, style["account-card"])}
				{...props}
			>
				<Image
					alt="Profile icon."
					src={profileIconUrl}
					width={128}
					height={128}
				/>
				<div>
					<h3>{`${account.gameNameCache}#${account.tagLineCache}`}</h3>
					<p>{"Change to the shown profile icon and update to verify."}</p>
				</div>
			</Link>
		);
	}

	return (
		<Link
			href={ugg}
			className={multiclass(className, style["account-card"])}
			{...props}
		>
			<RankedEmblem tier={account.tierCache} />
			<div>
				<h3>{`${account.gameNameCache}#${account.tagLineCache}`}</h3>
				<p>{`${account.tierCache} ${account.rankCache}`}</p>
				{account.isPrimary && <p>{"Primary Account"}</p>}
			</div>
		</Link>
	);
}
