import { css } from "lit";

// set font of all to IBM plex mono
export const globalCss = css`
	* {
		font-family: "IBM Plex Mono", monospace;
	}
	button {
		background-color: none;
		background: none;
		border: none;
		border-radius: 5px;
		padding: 0.5rem;
		font-size: 0.8rem;
		white-space: nowrap;
	}
	button::before {
		content: "[";
	}
	button::after {
		content: "]";
	}
	button:hover {
		cursor: pointer;
		text-decoration: underline;
	}
	.spacer {
		flex-grow: 1;
	}
`;

// remove all styling from buttons so only text is visible
