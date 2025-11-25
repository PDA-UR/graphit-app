import { ModifierKey } from "../../pages/selectionTools/global/KeyboardManager";
import {
	SHARED_SHORTCUTS,
	SHARED_SHORTCUTS_END,
	ShortcutInfo,
} from "./Shortcut";

export const ShortcutsExperiment: ShortcutInfo[] = [
	...SHARED_SHORTCUTS,

	{
		category: "Selektion - Aktion",
		description: "Lasso/Rechteck Selektion",
		shortcut: {
			mouseButton: "hleft",
		},
	},
	{
		category: "Selektion - Aktion",
		description: "Nachbarn von Knoten selektieren",
		shortcut: {
			mouseButton: "dleft",
		},
	},
	{
		category: "Selektion - Aktion",
		description: "Pfad zu Knoten selektieren",
		shortcut: {
			mouseButton: "left",
			modifierKeys: [ModifierKey.SHIFT],
		},
	},
	{
		category: "Selektion - Aktion",
		description: "Alle Knoten selektieren",
		shortcut: {
			key: "a",
			modifierKeys: [ModifierKey.CTRL],
		},
	},
	{
		category: "Selektion - Aktion",
		description: "Selektion umkehren",
		shortcut: {
			key: "i",
			modifierKeys: [ModifierKey.CTRL],
		},
	},
	{
		category: "Selektion - Modifier",
		description: "Zu Selektion hinzufügen (mit Selektions-Aktion)",
		shortcut: {
			modifierKeys: [ModifierKey.CTRL],
		},
	},
	{
		category: "Selektion - Modifier",
		description: "Von Selektion entfernen (mit Selektions-Aktion)",
		shortcut: {
			modifierKeys: [ModifierKey.ALT],
		},
	},
	{
		category: "Suche",
		description: "Suche anzeigen/ausblenden",
		shortcut: {
			key: "f",
			modifierKeys: [ModifierKey.CTRL],
		},
	},
	{
		category: "Filter",
		description: "Filter löschen",
		shortcut: {
			key: "Esc",
		},
	},
	{
		category: "Filter",
		description: "Zu Filter 0-9 wechseln",
		shortcut: {
			key: "0-9",
		},
	},
	...SHARED_SHORTCUTS_END,
];
