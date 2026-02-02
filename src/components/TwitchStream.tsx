import type { JSX } from "react";
import multiclass from "util/multiclass";
import style from "./styles/youtube-video.module.scss";

/**
 * Properties that can be passed to a Twitch stream embed.
 * @see {@link https://dev.twitch.tv/docs/embed/video-and-clips/ | Embedding Video and Clips}
 * @public
 */
export interface TwitchStreamProps extends Omit<
	JSX.IntrinsicElements["iframe"],
	"src" | "allow" | "children"
> {
	/** Change `allow` functionality to support a list of strings. */
	allow?: string[] | undefined;

	/** The domain(s) that will be embedding Twitch. */
	parent: string;

	/** The name of the channel, to embed a live stream. Overrides the video and collection IDs if specified. At least one of the channel name, video ID, or collection ID must be specified. */
	channel?: string;

	/** The video ID, for past broadcasts, highlights, and video uploads. Must be prefixed with a `"v"`. */
	video?: string;

	/** The collection ID, for a collection of videos. If a video ID is specified and the video is in the collection, the collection starts playing from the specified video (if the video is not in the collection, the collection is ignored). */
	collection?: string;

	/** Whether or not the video should start playing automatically. */
	autoPlay?: boolean;

	/** Whether or not the initial state of the video should be muted. */
	muted?: boolean;

	/** The time in the video where playback starts. */
	time?: string;
}

/**
 * A Twitch stream embed.
 * @param props - Properties to pass to the embed.
 * @returns The embed.
 * @throws `Error` if the channel name, video ID, and collection ID are all missing.
 * @public
 */
export default function TwitchStream({
	parent,
	channel,
	video,
	collection,
	autoPlay,
	muted,
	time,

	// Properties with modified functionality.
	allow,
	className,

	// Remaining properties.
	...props
}: TwitchStreamProps): JSX.Element {
	if (!channel && !video && !collection) {
		throw new Error(
			"At least one of the channel name, video ID, or collection ID is required."
		);
	}

	const src = new URL("", "https://player.twitch.tv/");
	src.searchParams.set("parent", parent);
	if (channel) {
		src.searchParams.set("channel", channel);
	}
	if (video) {
		src.searchParams.set("video", video);
	}
	if (collection) {
		src.searchParams.set("collection", collection);
	}
	if (typeof autoPlay === "boolean") {
		src.searchParams.set("autoplay", autoPlay.toString());
	}
	if (typeof muted === "boolean") {
		src.searchParams.set("muted", muted.toString());
	}
	if (time) {
		src.searchParams.set("time", time);
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
