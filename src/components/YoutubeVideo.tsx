import type { JSX } from "react";
import multiclass from "util/multiclass";
import style from "./styles/youtube-video.module.scss";

/**
 * Properties that can be passed to a YouTube video embed.
 * @public
 */
export interface YoutubeVideoProps extends Omit<
	JSX.IntrinsicElements["iframe"],
	"src" | "allow" | "children"
> {
	/** The ID of the YouTube video to embed. */
	id: string;

	/** Change `allow` functionality to support a list of strings. */
	allow?: string[] | undefined;

	// Parameters documented at https://developers.google.com/youtube/player_parameters.

	/** Whether or not to auto-play the video. Requires that `allow` contains `"autoplay"`. */
	autoPlay?: boolean | undefined;

	/** The ISO 639-1 two-letter language code of the preferred language for closed captions. */
	ccLangPref?: string | undefined;

	/** Whether or not to display closed captions by default. */
	ccLoadPolicy?: boolean | undefined;

	/** The color to use in the progress bar. */
	color?: "red" | "white" | undefined;

	/** Whether or not to display player controls. */
	controls?: boolean | undefined;

	/** Whether or not to disable keyboard controls. */
	disableKeyboard?: boolean | undefined;

	/** Whether or not to enable controlling the player via the IFrame Player API. */
	enableJsApi?: boolean | undefined;

	/** The time (measured in seconds from the start of the video) at which the player should stop playing the video. */
	end?: number | undefined;

	/** Whether or not to show the full-screen button. Required that `allowFullscreen` is `true`. */
	fs?: boolean | undefined;

	/** The ISO 639-1 two-letter language code of the interface language. */
	hl?: string | undefined;

	/** Whether or not to show video annotations by default. */
	ivLoadPolicy?: boolean | undefined;

	/** Identifies the content that will load in the player. */
	list?: string | undefined;

	/** Identifies the content that will load in the player. */
	listType?: "playlist" | "user_uploads" | undefined;

	/** Whether or not to loop the initial video. */
	loop?: boolean | undefined;

	/** A security measure for the IFrame API. When using the IFrame API, always set this to this website's domain. */
	origin?: string | undefined;

	/** A list of video IDs to play. */
	playlist?: string[] | undefined;

	/** Whether or not videos should be played inline (as opposed to fullscreen) on iOS. */
	playsInline?: boolean | undefined;

	/** Whether or not related videos should not be required to come from the same channel as the video that was just played. */
	relYt?: boolean | undefined;

	/** The time (measured in seconds from the start of the video) at which the player should start playing the video. */
	start?: number | undefined;

	/** The URL at which the video is embedded. */
	widgetReferrer?: string | undefined;

	// Undocumented parameters.

	/** Whether or not to mute the video by default. */
	mute?: boolean | undefined;

	/** A tracking token. */
	si?: string | undefined;
}

/**
 * A YouTube video embed.
 * @param props - Properties to pass to the embed.
 * @returns The embed.
 * @public
 */
export default function YoutubeVideo({
	// Use YouTube video ID instead of source URL.
	id,
	autoPlay,
	ccLangPref,
	ccLoadPolicy,
	color,
	controls,
	disableKeyboard,
	enableJsApi,
	end,
	fs,
	hl,
	ivLoadPolicy,
	list,
	listType,
	loop,
	origin,
	playlist,
	playsInline,
	relYt,
	start,
	widgetReferrer,
	mute,
	si,

	// Properties with modified functionality.
	allow,
	className,

	// Remaining properties.
	...props
}: YoutubeVideoProps): JSX.Element {
	const src = new URL(id, "https://www.youtube-nocookie.com/embed/");
	if (typeof autoPlay === "boolean") {
		src.searchParams.set("autoplay", autoPlay ? "1" : "0");
	}
	if (ccLangPref) {
		src.searchParams.set("cc_lang_pref", ccLangPref);
	}
	if (typeof ccLoadPolicy === "boolean") {
		src.searchParams.set("cc_load_policy", controls ? "1" : "0");
	}
	if (color) {
		src.searchParams.set("color", color);
	}
	if (typeof controls === "boolean") {
		src.searchParams.set("controls", controls ? "1" : "0");
	}
	if (typeof disableKeyboard === "boolean") {
		src.searchParams.set("disablekb", disableKeyboard ? "1" : "0");
	}
	if (typeof enableJsApi === "boolean") {
		src.searchParams.set("enablejsapi", enableJsApi ? "1" : "0");
	}
	if (typeof end === "number") {
		src.searchParams.set("end", end.toString());
	}
	if (typeof fs === "boolean") {
		src.searchParams.set("fs", fs ? "1" : "0");
	}
	if (hl) {
		src.searchParams.set("hl", hl);
	}
	if (typeof ivLoadPolicy === "boolean") {
		src.searchParams.set("iv_load_policy", ivLoadPolicy ? "1" : "3");
	}
	if (list) {
		src.searchParams.set("list", list);
	}
	if (listType) {
		src.searchParams.set("listType", listType);
	}
	if (typeof loop === "boolean") {
		src.searchParams.set("loop", loop ? "1" : "0");
	}
	if (origin) {
		src.searchParams.set("origin", origin);
	}
	if (playlist) {
		src.searchParams.set("playlist", playlist.join(","));
	}
	if (loop && !playlist) {
		src.searchParams.set("playlist", id);
	}
	if (typeof playsInline === "boolean") {
		src.searchParams.set("playsinline", playsInline ? "1" : "0");
	}
	if (typeof relYt === "boolean") {
		src.searchParams.set("rel", relYt ? "1" : "0");
	}
	if (typeof start === "number") {
		src.searchParams.set("start", start.toString());
	}
	if (widgetReferrer) {
		src.searchParams.set("widget_referrer", widgetReferrer);
	}
	if (typeof mute === "boolean") {
		src.searchParams.set("mute", mute ? "1" : "0");
	}
	if (si) {
		src.searchParams.set("si", si);
	}

	return (
		<iframe
			src={src.href}
			allow={allow?.join(";")}
			className={multiclass(className, style["embed"])}
			{...props}
		/>
	);
}
