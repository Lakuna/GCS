import {
	bigint,
	boolean,
	char,
	date,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	varchar
} from "drizzle-orm/pg-core";
import AccountRank from "types/riot/AccountRank";
import AccountTier from "types/riot/AccountTier";
import type { AdapterAccountType } from "next-auth/adapters";
import MatchFormat from "types/MatchFormat";
import Platform from "types/riot/Platform";
import Position from "types/riot/Position";

// Columns are occasionally ordered strangely due to drizzle-team/drizzle-orm#2157.

/**
 * League of Legends positions.
 * @public
 */
export const positionEnum = pgEnum("position", Position);

/**
 * Tiers that an account can be.
 * @public
 */
export const accountTierEnum = pgEnum("accountTier", AccountTier);

/**
 * Ranks that an account can be within a tier.
 * @public
 */
export const accountRankEnum = pgEnum("accountRank", AccountRank);

/**
 * League of Legends platform routing values.
 * @see {@link https://developer.riotgames.com/docs/lol#routing-values_platform-routing-values | Platform Routing Values}
 * @public
 */
export const platformEnum = pgEnum("platform", Platform);

/**
 * Formats that a match can take.
 * @public
 */
export const matchFormatEnum = pgEnum("matchFormat", MatchFormat);

/**
 * The table of players. Players are linked to one Discord account and any number of Riot accounts, and may participate in any number of seasons on any number of teams.
 * @public
 */
export const playerTable = pgTable("player", {
	// A UUID that represents the player. Supplied by Auth.js. Must be a `varchar` to make Auth.js happy, despite always being a 36-character UUIDv4.
	id: varchar({ length: 36 })
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	// The date that the user is banned until.
	// eslint-disable-next-line sort-keys
	bannedUntil: date(),

	// A player-selected champion to use as a background on player cards, stored as a champion ID.
	bgChamp: varchar({ length: 0x20 }),

	// A player-selected champion skin to use as a background on player cards, stored as a skin number.
	bgSkin: integer(),

	// A player-defined biography.
	bio: varchar({ length: 0x100 }),

	// A Discord snowflake (64-bit integer) stored as a string.
	discordId: varchar({ length: 0x40 }).notNull().unique(),

	// The player's display name. Passed through `encodeURIComponent` and then used as a slug to make the player's URL. If not set, the player's Discord name is used instead. If neither the display name nor the Discord name is set, the player's ID is used instead.
	displayName: varchar({ length: 0x20 }).unique(),

	// The user's email address. Used by Auth.js to link OAuth accounts to users.
	email: varchar({ length: 0x40 }).notNull().unique(),

	// Required by Auth.js, but always null.
	emailVerified: timestamp(),

	// Required by Auth.js, but always null. Background image is instead determined with `backgroundChampionId` and `backgroundSkinId`.
	image: varchar({ length: 0x200 }),

	// Whether or not this user is an administrator.
	isAdmin: boolean().notNull().default(false),

	// The player's Discord name at the time when the account was created.
	name: varchar({ length: 0x20 }).notNull().unique(),

	// The player's primary role. Must be set for the player to be able to sign up for a season.
	primaryRole: positionEnum(),

	// The player's secondary role. Must be set and not equal to the player's primary role for the player to be able to sign up for a season.
	secondaryRole: positionEnum(),

	// The player's vanity URL slug.
	slug: varchar({ length: 0x20 }).unique(),

	// The player's Twitch ID.
	twitchId: varchar({ length: 0x40 }).unique(),

	// The player's YouTube ID.
	youtubeId: varchar({ length: 0x40 }).unique()
});

/**
 * The table of OAuth accounts. Used by Auth.js.
 * @public
 */
export const oauthTable = pgTable(
	"oauth",
	{
		// The access token.
		// eslint-disable-next-line camelcase
		access_token: varchar({ length: 0x100 }).unique().notNull(),

		// The epoch timestamp that the access token expires at.
		// eslint-disable-next-line camelcase
		expires_at: integer().notNull(),

		// The ID token. Required by Auth.js, but always null.
		// eslint-disable-next-line camelcase
		id_token: varchar({ length: 0x100 }).unique(),

		// The account's provider. Always `"discord"`.
		provider: varchar({ length: 0x20 }).notNull(),

		// The provider account ID. Equivalent to the user's Discord snowflake.
		providerAccountId: varchar({ length: 0x100 }).notNull(),

		// The refresh token.
		// eslint-disable-next-line camelcase
		refresh_token: varchar({ length: 0x100 }).notNull().unique(),

		// The token's scope.
		scope: varchar({ length: 0x100 }).notNull(),

		// The session's state. Required by Auth.js, but always null.
		// eslint-disable-next-line camelcase
		session_state: varchar({ length: 0x100 }),

		// The type of the token.
		// eslint-disable-next-line camelcase
		token_type: varchar({ length: 0x20 }).notNull(),

		// The account's type.
		type: varchar({ length: 0x20 }).$type<AdapterAccountType>().notNull(),

		// The ID of the associated player.
		userId: varchar({ length: 36 })
			.notNull()
			.references(() => playerTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
	},
	(self) => [primaryKey({ columns: [self.provider, self.providerAccountId] })]
);

/**
 * An OAuth session for a player.
 * @public
 */
export const sessionTable = pgTable("session", {
	// The timestamp that the session expires at.
	expires: timestamp().notNull(),

	// The session token.
	sessionToken: varchar({ length: 0x100 }).primaryKey(),

	// The player that the session belongs to.
	userId: varchar({ length: 36 })
		.notNull()
		.references(() => playerTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade"
		})
});

/**
 * The table of Riot accounts. Each Riot account is linked to one player. Riot account game names and tag lines are cached to reduce calls to the Riot API.
 * @public
 */
export const accountTable = pgTable(
	"account",
	{
		// The date and time that the account was last cached.
		cacheDate: timestamp().notNull().defaultNow(),

		// The encrypted Riot account ID of the account. 56 character maximum length. Removed from the Riot API.
		// eslint-disable-next-line sort-keys
		accountId: varchar({ length: 56 }),

		// Whether or not this account is the primary account of the associated player. Must be null for non-primary accounts.
		isPrimary: boolean(),

		// Whether or not the associated player has verified ownership of this account.
		isVerified: boolean().notNull().default(false),

		// The game name of the account at the last time that the account was cached. The longest allowed game name is 16 characters.
		name: varchar({ length: 16 }).notNull(),

		// The ID of the player that the account is linked to.
		playerId: varchar({ length: 36 })
			.references(() => playerTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		// The encrypted Player Universally Unique ID (PUUID) of the account. PUUIDs are always 78 characters long.
		puuid: char({ length: 78 }).primaryKey(),

		// The solo/duo rank (within a tier) of the account at the last time that the account was cached.
		rank: accountRankEnum().notNull(),

		// The account's platform (region) ID (i.e. `"NA1"` for North America).
		region: platformEnum().notNull(),

		// The encrypted account's summoner ID. 63 character maximum length. Removed from the Riot API.
		summonerId: varchar({ length: 63 }),

		// The tag line of the account at the last time that the account was cached. The longest allowed tag line is 5 characters.
		tagLine: varchar({ length: 5 }).notNull(),

		// The solo/duo tier of the account at the last time that the account was cached.
		tier: accountTierEnum().notNull(),

		// The ID of the profile icon that the account must select in order to verify that the associated player owns it. Randomly selected from icons in the starter pack (IDs 0 through 28), which every player owns.
		verifyIcon: integer().notNull()
	},
	(self) => [
		unique().on(self.accountId, self.region),
		unique().on(self.name, self.tagLine),
		unique().on(self.isPrimary, self.playerId),
		unique().on(self.region, self.summonerId)
	]
);

/**
 * The table of Riot Games API tournament providers.
 * @public
 */
export const tournamentProviderTable = pgTable("tournamentProvider", {
	// The Riot Games tournament provider ID. Returned by the Riot Games tournament API.
	id: integer().primaryKey()
});

/**
 * The table of seasons. Seasons may consist of any number of matches between any number of teams split up into any number of pools.
 * @public
 */
export const seasonTable = pgTable("season", {
	// The Riot Games tournament ID. Returned by the Riot Games tournament API.
	id: integer().primaryKey(),

	// The season's name.
	name: varchar({ length: 0x40 }).notNull().unique(),

	// The stage ID of the playoffs bracket on Toornament.
	playoffsStageId: varchar({ length: 0x20 }),

	// The tournament ID of the playoffs bracket on Toornament.
	playoffsTourneyId: varchar({ length: 0x20 }),

	// The season's vanity URL slug. Passed through `encodeURIComponent` and then used as a slug to make the season's URL.
	slug: varchar({ length: 0x20 }).notNull().unique(),

	// The season's start date.
	startDate: date().notNull().defaultNow()
});

/**
 * The table of teams. Each team participates in one pool of one season, and has one captain out of any number of players.
 * @public
 */
export const teamTable = pgTable(
	"team",
	{
		// The team's code.
		code: varchar({ length: 4 }).notNull(),

		// The red-green-blue hexadecimal triplet of the team's theme color.
		color: char({ length: 6 }).notNull(),

		// The team's pick order in the player draft.
		draftOrder: integer().notNull().default(0),

		// Unique identifier.
		id: integer().primaryKey().generatedAlwaysAsIdentity(),

		// Whether or not the team won its season. Must be null for non-winners.
		isWinner: boolean(),

		// The URL of the team's logo image.
		logoUrl: varchar({ length: 0x800 }).notNull(),

		// The team's name.
		name: varchar({ length: 0x40 }).notNull(),

		// The pool that the team belongs to.
		pool: integer().notNull().default(1),

		// The ID of the team's season.
		seasonId: integer()
			.references(() => seasonTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		// The team's vanity URL slug. Passed through `encodeURIComponent` and then used as a slug to make the team's URL.
		slug: varchar({ length: 0x20 }).notNull().unique()
	},
	(self) => [
		unique().on(self.code, self.seasonId),
		unique().on(self.isWinner, self.seasonId),
		unique().on(self.name, self.seasonId)
	]
);

/**
 * The relation between teams and players, indicating which teams a player belongs to and which players compose a team. One player per team may be the team's captain.
 * @public
 */
export const teamPlayerTable = pgTable(
	"teamPlayer",
	{
		// The ID of the player.
		playerId: varchar({ length: 36 })
			.references(() => playerTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		// Whether or not the player is the captain of the team. Must be null for non-captains.
		// eslint-disable-next-line sort-keys
		isCaptain: boolean(),

		// The ID of the team.
		teamId: integer()
			.references(() => teamTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull()
	},
	(self) => [
		unique().on(self.isCaptain, self.teamId),
		unique().on(self.playerId, self.teamId)
	]
);

/**
 * The relation between seasons and players, indicating that a player may be drafted in a season. Not all players in this relation are actually participants in the corresponding season.
 * @public
 */
export const draftPlayerTable = pgTable(
	"draftPlayer",
	{
		// The ID of the player.
		playerId: varchar({ length: 36 })
			.references(() => playerTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		// The date and time at which the player was drafted to their team.
		// eslint-disable-next-line sort-keys
		draftedAt: timestamp(),

		// Additional notes about this player's registration, potentially including details about availability, playstyle, experience, et cetera.
		notes: text(),

		// The point value of the player in the season. Null for players that have signed up but have not been accepted into the season by a tournament administrator.
		pointValue: integer(),

		// The date and time at which the player registered for the season.
		registeredAt: timestamp().notNull().defaultNow(),

		// The ID of the season.
		seasonId: integer()
			.references(() => seasonTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull()
	},
	(self) => [unique().on(self.playerId, self.seasonId)]
);

/**
 * The table of matches. Each match belongs to a week of a season, is played between two teams, and may be composed of any number of games (depending on the match's format).
 * @public
 */
export const matchTable = pgTable("match", {
	// The ID of the blue team.
	blueTeamId: integer()
		.references(() => teamTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade"
		})
		.notNull(),

	// The format of the match.
	format: matchFormatEnum().notNull(),

	// Unique identifier.
	id: integer().primaryKey().generatedAlwaysAsIdentity(),

	// Whether or not the match is part of playoffs.
	isPlayoffs: boolean().default(false).notNull(),

	// The ID of the red team.
	redTeamId: integer()
		.references(() => teamTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade"
		})
		.notNull(),

	// The one-based round of its season that the match will take place. There are two rounds per week.
	round: integer().notNull(),

	// The ID of the match's season.
	seasonId: integer()
		.references(() => seasonTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade"
		})
		.notNull(),

	// The one-based time slot at which the match will take place.
	timeSlot: integer().notNull()
});

/**
 * The table of games, regardless of whether they are upcoming, in progress, or completed. Games may (in the case of stage games) or may not (in the case of inhouses) be part of a match.
 * @public
 */
export const gameTable = pgTable("game", {
	// Unique identifier.
	id: integer().primaryKey().generatedAlwaysAsIdentity(),

	// The ID of the match that the game is part of.
	matchId: integer().references(() => matchTable.id, {
		onDelete: "set null",
		onUpdate: "cascade"
	}),

	// The tournament code that players in the game use to join the game.
	tournamentCode: varchar({ length: 0x40 }).notNull().unique()
});

/**
 * The table of game results, which represent the players and statistics in a completed game. A game result may not correspond to a game if the game result isn't part of a tournament or inhouse (such as games that are just pulled from the Riot API to collect statistics).
 * @public
 */
export const gameResultTable = pgTable("gameResult", {
	// The duration of the game in milliseconds.
	duration: integer().notNull(),

	// The game ID of the game in the Riot API.
	id: bigint({ mode: "number" }).primaryKey(),

	// The ID of the map that the game was played on.
	map: integer().notNull(),

	// The game's mode.
	mode: varchar({ length: 0x20 }).notNull(),

	// The ID of the queue that the game was in.
	queue: integer().notNull(),

	// The ID of the platform that the game was played on. Can be joined with the game ID by an underscore to make the match ID.
	region: platformEnum().notNull(),

	// The Unix timestamp of the date that the game was started on the game server.
	startTimestamp: bigint({ mode: "number" }).notNull(),

	// The tournament code of the match. Can be used to pair game results with games.
	tournamentCode: varchar({ length: 0x40 }).unique(),

	// The game type.
	type: varchar({ length: 0x40 }).notNull(),

	// The version (patch) that the game was played on.
	version: varchar({ length: 0x20 }).notNull()
});

/**
 * A team in a game result. This is just cached data from the Riot API. Always corresponds to a game result, but may not always correspond to a team (such as for game results that are just pulled from the Riot API to collect statistics).
 * @public
 */
export const teamGameResultTable = pgTable(
	"teamGameResult",
	{
		// The ID of the game result that these results correspond to.
		gameResultId: bigint({ mode: "number" })
			.references(() => gameResultTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		// Unique identifier.
		id: integer().primaryKey().generatedAlwaysAsIdentity(),

		// Whether or not this team won the game.
		isWinner: boolean().notNull(),

		// The ID of the team within the Riot API.
		team: integer().notNull(),

		// The ID of the team, if any. May be null if the game result isn't part of a tournament or inhouse (such as games that are just pulled from the Riot API to collect statistics).
		teamId: integer().references(() => teamTable.id, {
			onDelete: "set null",
			onUpdate: "cascade"
		})
	},
	(self) => [
		unique().on(self.gameResultId, self.isWinner),
		unique().on(self.gameResultId, self.team),
		unique().on(self.gameResultId, self.teamId)
	]
);

/**
 * A ban in a team game result. This is just cached data from the Riot API. Always corresponds to a team game result.
 * @public
 */
export const teamGameResultBanTable = pgTable(
	"teamGameResultBan",
	{
		// The key of the champion that was banned. Referred to as the champion's ID in the Riot API.
		champ: integer().notNull(),

		// The ID of the game result that these results correspond to.
		gameResultId: bigint({ mode: "number" })
			.references(() => gameResultTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		// Unique identifier.
		id: integer().primaryKey().generatedAlwaysAsIdentity(),

		// The order in which this ban occurred.
		order: integer().notNull(),

		// The Riot API ID of the team that these results correspond to.
		team: integer().notNull()
	},
	(self) => [unique().on(self.gameResultId, self.order, self.team)]
);

/**
 * A player in a team game result. This is just cached data from the Riot API. Always corresponds to a team game result, but may not always correspond to a player (such as for game results that are just pulled from the Riot API to collect statistics).
 * @public
 */
export const playerGameResultTable = pgTable(
	"playerGameResult",
	{
		// The participant's total number of monsters killed in their own side of the jungle.
		allyJgCs: integer().notNull(),

		// The number of assists that the player got.
		assists: integer().notNull(),

		// The key of the champion that the player played. Referred to as the champion's ID in the Riot API.
		champ: integer().notNull(),

		// The amount of damage that the player dealt to champions.
		champDmg: integer().notNull(),

		// The number of deaths that the player has.
		deaths: integer().notNull(),

		// The participant's total number of monsters killed in their enemy's side of the jungle.
		enemyJgCs: integer().notNull(),

		// The ID of the game result that these results correspond to.
		gameResultId: bigint({ mode: "number" })
			.references(() => gameResultTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade"
			})
			.notNull(),

		// Unique identifier.
		id: integer().primaryKey().generatedAlwaysAsIdentity(),

		// The ID of the item in the player's first item slot at the end of the game.
		item0: integer().notNull(),

		// The ID of the item in the player's second item slot at the end of the game.
		item1: integer().notNull(),

		// The ID of the item in the player's third item slot at the end of the game.
		item2: integer().notNull(),

		// The ID of the item in the player's fourth item slot at the end of the game.
		item3: integer().notNull(),

		// The ID of the item in the player's fifth item slot at the end of the game.
		item4: integer().notNull(),

		// The ID of the item in the player's sixth item slot at the end of the game.
		item5: integer().notNull(),

		// The ID of the item in the player's seventh item slot at the end of the game.
		item6: integer().notNull(),

		// The number of kills that the player got.
		kills: integer().notNull(),

		// The participant's total number of minions killed, including team minions, melee lane minions, super lane minions, ranged lane minions, and siege lane minions.
		laneCs: integer().notNull(),

		// The player's champion level at the end of the game.
		level: integer().notNull(),

		// The game name of the player at the point when this player game result was cached.
		name: varchar({ length: 16 }).notNull(),

		// The participant's number of neutral minions killed, including pets and jungle monsters.
		neutralCs: integer().notNull(),

		// The number of objectives that the player stole.
		objectivesStolen: integer().notNull(),

		// The number of pentakills that the player got.
		pentakills: integer().notNull(),

		// The position that the player most likely played, as determined by the Riot API.
		position: positionEnum().notNull(),

		// The PUUID of the player. Can be used to link player game results to accounts (and, by extension, players).
		puuid: char({ length: 78 }).notNull(),

		// The ID of the player's first summoner spell.
		summoner1: integer().notNull(),

		// The ID of the player's second summoner spell.
		summoner2: integer().notNull(),

		// The Riot API ID of the team that these results correspond to.
		team: integer().notNull(),

		// The amount of damage that the player dealt to turrets.
		towerDmg: integer().notNull(),

		// The participant's number of wards killed.
		wardCs: integer().notNull()
	},
	(self) => [
		unique().on(self.gameResultId, self.position, self.team),
		unique().on(self.gameResultId, self.puuid)
	]
);

/**
 * A long document, such as the rulebook.
 * @public
 */
export const documentTable = pgTable("document", {
	/** The unique identifier of the document. User-defined to allow specific documents to be displayed in specific places. */
	id: integer().primaryKey(),

	/** The content of the document. */
	text: text()
});
