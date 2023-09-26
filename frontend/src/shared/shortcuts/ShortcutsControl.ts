import {
	SHARED_SHORTCUTS,
	SHARED_SHORTCUTS_END,
	ShortcutInfo,
} from "./Shortcut";

export const ShortcutsControl: ShortcutInfo[] = [
	...SHARED_SHORTCUTS,

	{
		category: "Selektion - Aktion",
		description: "Rechteck Selektion",
		shortcut: {
			mouseButton: "hleft",
		},
	},

	...SHARED_SHORTCUTS_END,
];
