import {
	accountTable,
	documentTable,
	draftPlayerTable,
	seasonTable
} from "db/schema";
import { and, desc, eq } from "drizzle-orm";
import AccountCard from "components/AccountCard";
import AddAccountForm from "./AddAccountForm";
import Document from "types/Document";
import type { JSX } from "react";
import Link from "components/Link";
import type { Metadata } from "next";
import SignUpForm from "./SignUpForm";
import UpdateAccountsForm from "./UpdateAccountsForm";
import UpdatePlayerForm from "./UpdatePlayerForm";
import { auth } from "db/auth";
import db from "db/db";
import getGuildMember from "discord/getGuildMember";
import hasRiotApiKey from "util/hasRiotApiKey";
import sortAccountsByRank from "util/sortAccountsByRank";
import style from "./page.module.scss";
import ugg from "util/ugg";

/**
 * The sign-up page.
 * @returns The sign-up page.
 * @public
 */
export default async function Page(): Promise<JSX.Element> {
	const session = await auth();

	// Must be signed in.
	if (!session?.user) {
		return (
			<article className={style["content"]}>
				<header>
					<h1>{"Sign Up"}</h1>
					<p>
						{
							"You must sign in to register for the next season of the Gauntlet Championship Series."
						}
					</p>
				</header>
			</article>
		);
	}

	// Must not be banned.
	const player = session.user;
	if (
		player.bannedUntil &&
		// TODO
		// eslint-disable-next-line react-hooks/purity
		new Date(player.bannedUntil).valueOf() > Date.now()
	) {
		return (
			<article className={style["content"]}>
				<header>
					<h1>{"Sign Up"}</h1>
					<p>
						{
							"You may not register for the next season of the Gauntlet Championship Series because you are currently banned."
						}
					</p>
				</header>
			</article>
		);
	}

	// There must be a season to sign up for.
	const [season] = await db
		.select()
		.from(seasonTable)
		.orderBy(desc(seasonTable.startDate))
		.limit(1);
	if (!season) {
		return (
			<article className={style["content"]}>
				<header>
					<h1>{"Sign Up"}</h1>
					<p>
						{"There is currently no season to register for. Check back later!"}
					</p>
				</header>
			</article>
		);
	}

	// Must not already be registered for the next season.
	const [draftPlayer] = await db
		.select()
		.from(draftPlayerTable)
		.where(
			and(
				eq(draftPlayerTable.seasonId, season.id),
				eq(draftPlayerTable.playerId, player.id)
			)
		)
		.limit(1);
	if (draftPlayer) {
		return (
			<article className={style["content"]}>
				<header>
					<h1>{"Sign Up"}</h1>
					<p>
						{`You are registered for ${season.name} of the Gauntlet Championship Series.`}
					</p>
				</header>
			</article>
		);
	}

	// Must be a member of the GCS Discord server.
	if (!(await getGuildMember(player.discordId))) {
		return (
			<article className={style["content"]}>
				<header>
					<h1>{"Sign Up"}</h1>
					<p>
						{`You must be a member of the `}
						<Link href="https://discord.gg/gcsleague">
							{"Gauntlet Championship Series Discord server"}
						</Link>
						{" to register."}
					</p>
				</header>
			</article>
		);
	}

	// Must select two distinct roles.
	if (
		!player.primaryRole ||
		!player.secondaryRole ||
		player.primaryRole === player.secondaryRole
	) {
		return (
			<article className={style["content"]}>
				<header>
					<h1>{"Sign Up"}</h1>
					<p>
						{
							"You must select two distinct roles as your primary and secondary role to register."
						}
					</p>
				</header>
				<UpdatePlayerForm player={player} />
			</article>
		);
	}

	// Must have at least one verified account.
	const accounts = await db
		.select()
		.from(accountTable)
		.where(eq(accountTable.playerId, player.id));
	if (hasRiotApiKey() && !accounts.some(({ isVerified }) => isVerified)) {
		return (
			<article className={style["content"]}>
				<header>
					<h1>{"Sign Up"}</h1>
					<p>{"You must have at least one verified account to sign up."}</p>
				</header>
				<UpdatePlayerForm player={player} />
				<div className={style["accounts"]}>
					<header>
						<h2>
							{"Accounts"}
							{accounts.length > 0 && (
								<>
									{" | "}
									<Link href={ugg(...accounts)}>{"U.GG"}</Link>
								</>
							)}
						</h2>
					</header>
					<ol>
						{accounts
							.sort(sortAccountsByRank)
							.reverse()
							.map((account) => (
								<li key={account.accountId}>
									<AccountCard account={account} />
								</li>
							))}
					</ol>
					<UpdateAccountsForm accounts={accounts} />
					<AddAccountForm player={player} accounts={accounts} />
				</div>
			</article>
		);
	}

	const [signUpQuestions] = await db
		.select()
		.from(documentTable)
		.where(eq(documentTable.id, Document.SIGN_UP_QUESTIONS));

	return (
		<article className={style["content"]}>
			<header>
				<h1>{"Sign Up"}</h1>
			</header>
			<UpdatePlayerForm player={player} />
			<div className={style["accounts"]}>
				<header>
					<h2>
						{"Accounts"}
						{accounts.length > 0 && (
							<>
								{" | "}
								<Link href={ugg(...accounts)}>{"U.GG"}</Link>
							</>
						)}
					</h2>
				</header>
				<ol>
					{accounts
						.sort(sortAccountsByRank)
						.reverse()
						.map((account) => (
							<li key={account.accountId}>
								<AccountCard account={account} />
							</li>
						))}
				</ol>
				{accounts.length > 0 && <UpdateAccountsForm accounts={accounts} />}
				<AddAccountForm player={player} accounts={accounts} />
			</div>
			<SignUpForm
				player={player}
				season={season}
				accounts={accounts}
				questions={signUpQuestions?.text ?? void 0}
			/>
		</article>
	);
}

/**
 * The sign-up page's metadata.
 * @returns The metadata.
 * @public
 */
export const generateMetadata = async (): Promise<Metadata> => {
	const [season] = await db
		.select()
		.from(seasonTable)
		.orderBy(desc(seasonTable.startDate))
		.limit(1);

	return season ?
			{
				description: `Sign up for ${season.name} of the Gauntlet Championship Series.`,
				openGraph: { url: "/signup" },
				title: `Sign Up for ${season.name}`
			}
		:	{
				description:
					"Sign up for the next season of the Gauntlet Championship Series.",
				openGraph: { url: "/signup" },
				title: "Sign Up"
			};
};
