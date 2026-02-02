import { BsDiscord, BsTwitch, BsYoutube } from "react-icons/bs";
import Document from "types/Document";
import type { JSX } from "react";
import Link from "components/Link";
import Markdown from "react-markdown";
import type { Metadata } from "next";
import TwitchStream from "components/TwitchStream";
import UpdateBlurbForm from "./UpdateBlurbForm";
import YoutubeVideo from "components/YoutubeVideo";
import { auth } from "db/auth";
import db from "db/db";
import { documentTable } from "db/schema";
import { eq } from "drizzle-orm";
import getStreams from "ttv/getStreams";
import { raw } from "util/domain";
import style from "./page.module.scss";

/**
 * The landing page.
 * @returns The landing page.
 * @public
 */
export default async function Page(): Promise<JSX.Element> {
	const [streamData] = (await getStreams("1056770764")).data;
	const [blurb] = await db
		.select()
		.from(documentTable)
		.where(eq(documentTable.id, Document.LANDING_BLURB));

	return (
		<article className={style["content"]}>
			<header>
				<h1>{"Gauntlet Championship Series"}</h1>
			</header>
			{streamData ?
				<TwitchStream parent={raw} channel={streamData.user_login} muted />
			:	<YoutubeVideo
					id="qYLGDygZXnk"
					autoPlay
					fs={false}
					ivLoadPolicy={false}
					relYt={false}
					mute
					sandbox="allow-popups allow-same-origin allow-scripts"
					loading="lazy"
				/>
			}
			<ul className={style["socials"]}>
				<Link href="https://discord.gg/gcsleague">
					<BsDiscord />
					{"Discord"}
				</Link>
				<Link href="https://www.twitch.tv/gcsleague">
					<BsTwitch />
					{"Twitch"}
				</Link>
				<Link href="https://www.youtube.com/@GauntletChampionshipSeries">
					<BsYoutube />
					{"YouTube"}
				</Link>
			</ul>
			{blurb?.text && <Markdown>{blurb.text}</Markdown>}
			<hr />
			<p>
				{
					// This legal boilerplate must be posted in a location that's readily visible to players. See https://developer.riotgames.com/policies/general.
					"The Gauntlet Championship Series isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc."
				}
			</p>
			<p>
				{
					// This notice must be included in a clear and conspicuous manner on the competition website. See https://developer.riotgames.com/policies/na-tournaments.
					"This competition is not affiliated with or sponsored by Riot Games, Inc. or League of Legends Esports."
				}
			</p>
			<p>
				<Link href="/api">{"API"}</Link>
				{" | "}
				<Link href="https://github.com/Lakuna/GCS/issues">
					{"Report a Bug or Request a Feature"}
				</Link>
			</p>
			{(await auth())?.user?.isAdmin && (
				<UpdateBlurbForm text={blurb?.text ?? void 0} />
			)}
		</article>
	);
}

/**
 * The metadata of the landing page.
 * @public
 */
export const metadata = {
	description: "The home page of the Gauntlet Championship Series.",
	openGraph: { url: "/" },
	title: "Gauntlet Championship Series"
} satisfies Metadata;
