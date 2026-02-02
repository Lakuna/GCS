import Form, { type FormProps } from "components/Form";
import { accountTable, type playerTable } from "db/schema";
import AccountRank from "types/riot/AccountRank";
import AccountTier from "types/riot/AccountTier";
import type { JSX } from "react";
import Platform from "types/riot/Platform";
import QueueType from "types/riot/QueueType";
import Submit from "components/Submit";
import db from "db/db";
import { eq } from "drizzle-orm";
import getAccountByGameName from "riot/getAccountByGameName";
import getFormField from "util/getFormField";
import getLeagueEntriesByPuuid from "riot/getLeagueEntriesByPuuid";
import getPlayerUrl from "util/getPlayerUrl";
import getSummonerByPuuid from "riot/getSummonerByPuuid";
import hasRiotApiKey from "util/hasRiotApiKey";
import { revalidatePath } from "next/cache";

/**
 * Properties that can be passed to an add account form.
 * @public
 */
export interface AddAccountFormProps extends Omit<
	FormProps,
	"action" | "children"
> {
	/** The player to add the account to. */
	player: typeof playerTable.$inferSelect;

	/** The player's existing accounts. */
	accounts: (typeof accountTable.$inferSelect)[];
}

/**
 * A form for adding an account.
 * @param props - Properties to pass to the form.
 * @returns The form.
 * @public
 */
export default function AddAccountForm({
	player,
	accounts,
	...props
}: AddAccountFormProps): JSX.Element {
	return (
		<Form
			action={async (form) => {
				"use server";
				if (!hasRiotApiKey()) {
					return "Missing Riot API key.";
				}

				const [gameName, tagLine] = getFormField(
					form,
					"gameNameAndTagLine",
					true
				).split("#");
				if (!gameName || !tagLine) {
					return "Malformed game name and/or tag line.";
				}

				// Get account details from Riot.
				const accountDto = await getAccountByGameName(gameName, tagLine);

				// Check if the account is already in the database.
				const [existingAccount] = await db
					.select()
					.from(accountTable)
					.where(eq(accountTable.puuid, accountDto.puuid));
				if (existingAccount) {
					// Check if this player already has this account.
					if (existingAccount.playerId === player.id) {
						return void 0;
					}

					// Check if this account is already somebody else's.
					if (existingAccount.isVerified) {
						return "That's somebody else's account!";
					}

					// Otherwise, move the account over to this player.
					await db
						.update(accountTable)
						.set({ playerId: player.id })
						.where(eq(accountTable.puuid, accountDto.puuid));
					revalidatePath("/signup");
					return void 0;
				}

				// Get summoner details from Riot.
				const platform = Platform.NA1;
				const summonerDto = await getSummonerByPuuid(
					accountDto.puuid,
					platform
				);
				const soloLeagueEntry = (
					await getLeagueEntriesByPuuid(summonerDto.puuid, platform)
				).find((leagueEntry) => leagueEntry.queueType === QueueType.SOLO);

				// Ensure that the profile icon ID to verify the account is not the summoner's current profile icon ID.
				const starterPackMaxId = 28;
				let verifyIcon = Math.floor(Math.random() * (starterPackMaxId + 1));
				if (verifyIcon === summonerDto.profileIconId) {
					verifyIcon = (verifyIcon + 1) % starterPackMaxId;
				}

				await db
					.insert(accountTable)
					.values({
						isPrimary: accounts.length ? void 0 : true,
						name: accountDto.gameName,
						playerId: player.id,
						puuid: summonerDto.puuid,
						rank: soloLeagueEntry?.rank ?? AccountRank.IV,
						region: platform,
						tagLine: accountDto.tagLine,
						tier: soloLeagueEntry?.tier ?? AccountTier.IRON,
						verifyIcon
					});
				revalidatePath(getPlayerUrl(player));
				return void 0;
			}}
			{...props}
		>
			<header>
				<h3>{"Add Account"}</h3>
			</header>
			<p>
				<label>
					{"Game name and tag line"}
					<input
						type="text"
						name="gameNameAndTagLine"
						placeholder="Lakuna#TAU3"
						maxLength={16 + 1 + 5}
						required
					/>
				</label>
			</p>
			<p>
				<Submit value="Add" />
			</p>
		</Form>
	);
}
