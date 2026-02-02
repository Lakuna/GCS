import type {
	gameResultTable,
	playerGameResultTable,
	teamGameResultBanTable,
	teamGameResultTable
} from "db/schema";
import type MatchDto from "types/riot/MatchDto";
import closestMatch from "./closestMatch";

/**
 * Converts the Riot API representation of a game result to the database representations of game, team, ban, and player results.
 * @param riot - The Riot API game result.
 * @param puuids - A map of the IDs of the teams in the match to the lists of the PUUIDS of the accounts of the players on those teams.
 * @returns The game result, the team game results, the team game result bans, and the player game results.
 * @public
 */
export default function convertResult(
	riot: MatchDto,
	puuids?: Map<number, string[]>
): [
	typeof gameResultTable.$inferInsert,
	(typeof teamGameResultTable.$inferInsert)[],
	(typeof teamGameResultBanTable.$inferInsert)[],
	(typeof playerGameResultTable.$inferInsert)[]
] {
	const game = {
		duration:
			riot.info.gameDuration * ("gameEndTimestamp" in riot.info ? 1000 : 1),
		id: riot.info.gameId,
		map: riot.info.mapId,
		mode: riot.info.gameMode,
		queue: riot.info.queueId,
		region: riot.info.platformId,
		startTimestamp: riot.info.gameStartTimestamp,
		tournamentCode:
			riot.info.tournamentCode === "" ?
				`FAKE-${Date.now().toString(16)}`
			:	riot.info.tournamentCode,
		type: riot.info.gameType,
		version: riot.info.gameVersion
	} satisfies typeof gameResultTable.$inferInsert;

	const players = [];
	for (const player of riot.info.participants) {
		players.push({
			allyJgCs: player.totalAllyJungleMinionsKilled,
			assists: player.assists,
			champ: player.championId,
			champDmg: player.totalDamageDealtToChampions,
			deaths: player.deaths,
			enemyJgCs: player.totalEnemyJungleMinionsKilled,
			gameResultId: riot.info.gameId,
			item0: player.item0,
			item1: player.item1,
			item2: player.item2,
			item3: player.item3,
			item4: player.item4,
			item5: player.item5,
			item6: player.item6,
			kills: player.kills,
			laneCs: player.totalMinionsKilled,
			level: player.champLevel,
			name: player.riotIdGameName,
			neutralCs: player.neutralMinionsKilled,
			objectivesStolen: player.objectivesStolen,
			pentakills: player.pentaKills,
			position: player.teamPosition,
			puuid: player.puuid,
			summoner1: player.summoner1Id,
			summoner2: player.summoner2Id,
			team: player.teamId,
			towerDmg: player.damageDealtToTurrets,
			wardCs: player.wardsKilled
		} satisfies typeof playerGameResultTable.$inferInsert);
	}

	const teams = [];
	const bans = [];
	for (const team of riot.info.teams) {
		teams.push({
			gameResultId: riot.info.gameId,
			isWinner: team.win,
			team: team.teamId,
			teamId:
				puuids &&
				closestMatch(
					players
						.filter((player) => player.team === team.teamId)
						.map(({ puuid }) => puuid),
					puuids
				)
		} satisfies typeof teamGameResultTable.$inferInsert);

		for (const ban of team.bans) {
			bans.push({
				champ: ban.championId,
				gameResultId: riot.info.gameId,
				order: ban.pickTurn,
				team: team.teamId
			} satisfies typeof teamGameResultBanTable.$inferInsert);
		}
	}

	return [game, teams, bans, players];
}
