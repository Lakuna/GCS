import type { accountTable } from "db/schema";

/**
 * Make a OP.GG link for the given set of accounts.
 * @param accounts - The accounts to include in the U.GG link.
 * @returns A OP.GG link.
 * @public
 */
export default function opgg(
	...accounts: Pick<
		typeof accountTable.$inferSelect,
		"name" | "tagLine" | "region"
	>[]
): string {
	const [account] = accounts;
	if (!account) {
		return "https://op.gg/";
	}

	if (accounts.length <= 1) {
		return `https://op.gg/lol/summoners/${account.region}/${encodeURIComponent(account.name)}-${encodeURIComponent(account.tagLine)}`;
	}
  return `https://op.gg/lol/multisearch/na?summoners=${accounts.map(({ name, tagLine }) => `${encodeURIComponent(name)}%23${encodeURIComponent(tagLine)}`).join(",")}&region=${account.region.toLowerCase()}`;
}
