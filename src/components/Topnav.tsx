import { auth, signIn, signOut } from "db/auth";
import Form from "components/Form";
import Image from "components/Image";
import type { JSX } from "react";
import Link from "components/Link";
import Submit from "components/Submit";
import getPlayerUrl from "util/getPlayerUrl";
import multiclass from "util/multiclass";
import style from "./styles/topnav.module.scss";
import submark from "./assets/submark.png";

/**
 * The site-wide top navigation bar.
 * @param props - The properties to pass to the navigation bar.
 * @returns The navigation bar.
 * @public
 */
export default async function Topnav({
	className,
	...props
}: JSX.IntrinsicElements["nav"]) {
	const session = await auth();
	return (
		<nav className={multiclass(className, style["topnav"])} {...props}>
			<ul>
				<li>
					<Link href="/">
						<Image alt="Index" src={submark} />
					</Link>
				</li>
				<li>
					<Link href="/schedule">
						<span>{"Schedule"}</span>
					</Link>
				</li>
				<li className={style["hide-on-mobile"]}>
					<Link href="/rulebook">
						<span>{"Rulebook"}</span>
					</Link>
				</li>
				{session?.user ? (
					<>
						<li className={style["right"]}>
							<Link href={getPlayerUrl(session.user)}>
								<span>{session.user.displayName ?? session.user.name}</span>
							</Link>
						</li>
						{session.user.isAdministator && (
							<li className={style["hide-on-mobile"]}>
								<Link href="/admin">
									<span>{"Admin"}</span>
								</Link>
							</li>
						)}
						<li className={style["hide-on-mobile"]}>
							<Form
								action={async () => {
									"use server";
									await signOut();
								}}
							>
								<Submit value="Sign Out" />
							</Form>
						</li>
					</>
				) : (
					<li className={style["right"]}>
						<Form
							action={async () => {
								"use server";
								await signIn("discord");
							}}
						>
							<Submit value="Sign In" />
						</Form>
					</li>
				)}
			</ul>
		</nav>
	);
}
