import "styles/global.scss";
import type { Metadata, Viewport } from "next";
import { body, title } from "util/font";
import type { JSX } from "react";
import type LayoutProps from "types/LayoutProps";
import Topnav from "./Topnav";
import domain from "util/domain";
import multiclass from "util/multiclass";
import style from "./layout.module.scss";

/**
 * The root layout.
 * @param params - The parameters passed to the layout.
 * @returns The root layout.
 * @public
 */
export default function Layout({ children }: LayoutProps): JSX.Element {
	return (
		<html lang="en-US" className={multiclass(title.variable, body.variable)}>
			<body className={style["spacer"]}>
				<header>
					<Topnav />
				</header>
				<main>{children}</main>
				<footer></footer>
			</body>
		</html>
	);
}

/**
 * The viewport of the website.
 * @public
 */
export const viewport = {
	colorScheme: "dark",
	themeColor: "#e5b451"
} satisfies Viewport;

/**
 * The base metadata of the website.
 * @public
 */
export const metadata = {
	authors: [{ name: "Travis Martin", url: "https://www.lakuna.pw" }],
	creator: "Travis Martin",
	metadataBase: new URL(domain),
	openGraph: { siteName: "Gauntlet Championship Series", type: "website" },
	publisher: "Travis Martin",
	title: { default: "Page", template: "%s | GCS" }
} satisfies Metadata;
