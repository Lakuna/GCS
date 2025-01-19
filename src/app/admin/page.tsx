import { forbidden, unauthorized } from "next/navigation";
import CreateSeasonForm from "./CreateSeasonForm";
import type { Metadata } from "next";
import SaveGameForm from "./SaveGameForm";
import { auth } from "db/auth";
import style from "./page.module.scss";

/**
 * An administrator-only page for configuring database objects.
 * @returns The admin page.
 * @public
 */
export default async function Page() {
	const session = await auth();
	if (!session?.user) {
		unauthorized();
	}

	if (!session.user.isAdministator) {
		forbidden();
	}

	return (
		<>
			<header>
				<h1>{"Administrator Tools"}</h1>
				<hr />
			</header>
			<div className={style["widgets"]}>
				<CreateSeasonForm />
				<SaveGameForm />
			</div>
		</>
	);
}

/**
 * The metadata of the administrator page.
 * @public
 */
export const metadata = {
	description: "GCS administrator tools.",
	openGraph: { url: "/admin" },
	title: "Admin Tools"
} satisfies Metadata;
