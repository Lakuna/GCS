import { type teamTable } from "db/schema";

/**
 * A team participating in the draft.
 */
type DraftTeam = Pick<typeof teamTable.$inferSelect, "draftOrder">;

/**
 * Get the team that should make the next snake-draft pick.
 * @param teams - The teams participating in the draft.
 * @param draftedPlayerCount - The number of players already drafted.
 * @returns The team whose turn is next, if any.
 * @public
 */
export default function getNextDraftTeam<Team extends DraftTeam>(
	teams: Team[],
	draftedPlayerCount: number
): Team | undefined {
	const teamsByDraftOrder = [...teams].sort(
		({ draftOrder: a }, { draftOrder: b }) => a - b
	);

	if (!teamsByDraftOrder.length) {
		return void 0;
	}

	const pickIndex = draftedPlayerCount % (teamsByDraftOrder.length * 2);
	const teamIndex =
		pickIndex < teamsByDraftOrder.length ?
			pickIndex
		:	teamsByDraftOrder.length - 1 - (pickIndex - teamsByDraftOrder.length);

	return teamsByDraftOrder[teamIndex];
}
