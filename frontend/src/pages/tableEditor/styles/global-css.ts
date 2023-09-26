import { css } from "lit";

// set font of all to IBM plex mono
export const globalCss = css`
	* {
		font-family: "IBM Plex Mono", monospace;
	}
	:host {
		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		-webkit-text-size-adjust: 100%;
	}
	button {
		background-color: none;
		background: none;
		border: none;
		border-radius: 5px;
		padding: 0.5rem;
		font-size: 0.9rem;
		white-space: nowrap;
		color: var(--fg-color);
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
	input,
	select {
		color: var(--fg-color);
		background-color: var(--bg-color);
		border-radius: 3px;
		border: 1px solid var(--border-color-light);
	}
	.spacer {
		flex-grow: 1;
	}
	.hidden {
		display: none;
	}
`;

// remove all styling from buttons so only text is visible
