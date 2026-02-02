import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import {
	gameResultTable,
	gameTable,
	playerGameResultTable,
	teamGameResultBanTable,
	teamGameResultTable
} from "db/schema";
import type PageProps from "types/PageProps";
import db from "db/db";
import leftHierarchy from "util/leftHierarchy";

/**
 * Get game parameters.
 * @public
 */
export interface GetGameParams {
	/** The ID of the game. */
	id: string; // `${number}`;
}

/**
 * Get a game that is cached by the Gauntlet Championship Series.
 * @param _ - The request.
 * @param props - The page properties.
 * @returns A game that is cached by the Gauntlet Championship Series.
 * @public
 */
export const GET = async (
	_: NextRequest,
	props: PageProps<GetGameParams>
): Promise<NextResponse> => {
	const id = parseInt((await props.params).id, 10);
	const rows = await db
		.select()
		.from(gameTable)
		.leftJoin(
			gameResultTable,
			eq(gameTable.tournamentCode, gameResultTable.tournamentCode)
		)
		.leftJoin(
			teamGameResultTable,
			eq(gameResultTable.id, teamGameResultTable.gameResultId)
		)
		.leftJoin(
			playerGameResultTable,
			and(
				eq(
					teamGameResultTable.gameResultId,
					playerGameResultTable.gameResultId
				),
				eq(teamGameResultTable.team, playerGameResultTable.team)
			)
		)
		.where(eq(gameTable.id, id));
	const [row] = rows;
	if (!row) {
		return NextResponse.json(null);
	}

	const { game, gameResult } = row;
	const { matchId, tournamentCode } = game;
	const teams = leftHierarchy(rows, "teamGameResult", "playerGameResult");
	const bans =
		gameResult ?
			await db
				.select()
				.from(teamGameResultBanTable)
				.where(eq(teamGameResultBanTable.gameResultId, gameResult.id))
		:	[];

	return NextResponse.json({
		duration: gameResult?.duration ?? null,
		id,
		map: gameResult?.map ?? null,
		matchId,
		mode: gameResult?.mode ?? null,
		queue: gameResult?.queue ?? null,
		region: gameResult?.region ?? null,
		riotId: gameResult?.id ?? null,
		startTimestamp: gameResult?.startTimestamp ?? null,
		teams: teams.map(({ value: team, children: players }) => ({
			bans: bans
				.filter((ban) => ban.team === team.team)
				.map(({ champ, order }) => ({ champ, order })),
			id: team.id,
			isWinner: team.isWinner,
			players: players.map(
				({
					allyJgCs,
					assists,
					champ,
					champDmg,
					deaths,
					enemyJgCs,
					item0,
					item1,
					item2,
					item3,
					item4,
					item5,
					item6,
					kills,
					laneCs,
					level,
					name,
					neutralCs,
					objectivesStolen,
					pentakills,
					position,
					puuid,
					summoner1,
					summoner2,
					towerDmg,
					wardCs
				}) => ({
					allyJgCs,
					assists,
					champ,
					champDmg,
					deaths,
					enemyJgCs,
					item0,
					item1,
					item2,
					item3,
					item4,
					item5,
					item6,
					kills,
					laneCs,
					level,
					name,
					neutralCs,
					objectivesStolen,
					pentakills,
					position,
					puuid,
					summoner1,
					summoner2,
					towerDmg,
					wardCs
				})
			),
			riotId: team.team
		})),
		tournamentCode,
		type: gameResult?.type ?? null,
		version: gameResult?.version ?? null
	});
};
