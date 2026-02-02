import type { playerTable, teamPlayerTable, teamTable } from "db/schema";
import AddPlayerForm from "./admin/AddPlayerForm";
import DeleteTeamForm from "./admin/DeleteTeamForm";
import { type JSX } from "react";
import RemovePlayerForm from "./admin/RemovePlayerForm";
import SetCaptainForm from "./admin/SetCaptainForm";
import UpdateTeamForm from "./admin/UpdateTeamForm";

/**
 * Properties that can be passed to an admin panel.
 * @public
 */
export interface AdminPanelProps extends Omit<
	JSX.IntrinsicElements["div"],
	"children"
> {
	/** The team to modify. */
	team: typeof teamTable.$inferSelect;

	/** The players on the team. */
	teamPlayers: (typeof teamPlayerTable.$inferSelect)[];

	/** The players on the team. */
	players: (typeof playerTable.$inferSelect)[];

	/** The players that may be added to the team. */
	potentialPlayers: (typeof playerTable.$inferSelect)[];

	/** The other teams in the team's season. */
	otherTeams: (typeof teamTable.$inferSelect)[];
}

/**
 * A team page admin panel.
 * @param props - Properties to pass to the panel.
 * @returns The panel.
 * @public
 */
export default function AdminPanel({
	team,
	teamPlayers,
	players,
	potentialPlayers,
	otherTeams,
	...props
}: AdminPanelProps): JSX.Element {
	return (
		<div {...props}>
			<header>
				<h2>{"Admin Panel"}</h2>
			</header>
			<UpdateTeamForm team={team} />
			<AddPlayerForm
				team={team}
				teamPlayers={teamPlayers}
				players={potentialPlayers}
				otherTeams={otherTeams}
			/>
			<RemovePlayerForm
				team={team}
				teamPlayers={teamPlayers}
				players={players}
			/>
			<SetCaptainForm team={team} teamPlayers={teamPlayers} players={players} />
			<DeleteTeamForm team={team} />
		</div>
	);
}
