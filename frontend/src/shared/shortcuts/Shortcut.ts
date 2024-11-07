import {
	ModifierKey,
	toUiText,
} from "../../pages/selectionTools/global/KeyboardManager";
import "./shortcuts.css";
// key = number or character (single one)
type Key = string;

type MouseButton = "hleft" | "left" | "dleft" | "middle" | "right";

type Shortcut = {
	key?: Key;
	mouseButton?: MouseButton;
	modifierKeys?: ModifierKey[];
};

export type ShortcutInfo = {
	category: string;
	description: string;
	shortcut: Shortcut;
};

// INFO: add shortcuts here
export const SHARED_SHORTCUTS: ShortcutInfo[] = [
	{
		category: "Selektion - Aktion",
		description: "Einzelnen Knoten selektieren",
		shortcut: {
			mouseButton: "left",
		},
	},
	{
		category: "Undo/Redo",
		description: "Selektion rückgängig machen",
		shortcut: {
			key: "z",
			modifierKeys: [ModifierKey.CTRL],
		},
	},
	{
		category: "Undo/Redo",
		description: "Selektion wiederherstellen",
		shortcut: {
			key: "y",
			modifierKeys: [ModifierKey.CTRL],
		},
	},
];

export const SHARED_SHORTCUTS_END: ShortcutInfo[] = [
	{
		category: "Informationen",
		description: "Resourcen ansehen",
		shortcut: {
			key: "+",
			modifierKeys: [ModifierKey.ALT],
		}
	},
	{
		category: "Informationen",
		description: "Lernpfad öffnen",
		shortcut: {
			key: "L",
			modifierKeys: [ModifierKey.CTRL],
		}
	},
	{
		category: "Hilfe",
		description: "Dieses Hilfe-Menü öffnen",
		shortcut: {
			key: "?",
			modifierKeys: [ModifierKey.CTRL],
		},
	},
	{
		category: "Speichern",
		description: "Änderungen des Graphens speichern",
		shortcut: {
			key: "S",
			modifierKeys: [ModifierKey.CTRL],
		},
	},
];

function createShortcutElement(shortcutInfo: ShortcutInfo): HTMLElement {
	const shortcutElement = document.createElement("div");
	shortcutElement.className = "shortcut-element";

	const shortcut = shortcutInfo.shortcut;

	const modifierKeys = shortcut.modifierKeys || [];
	modifierKeys.sort((a, b) => {
		// shift, ctrl, alt
		if (a === ModifierKey.SHIFT) return -1;
		if (b === ModifierKey.SHIFT) return 1;
		if (a === ModifierKey.CTRL) return -1;
		if (b === ModifierKey.CTRL) return 1;
		if (a === ModifierKey.ALT) return -1;
		if (b === ModifierKey.ALT) return 1;
		return 0;
	});

	const modifierKeyElements = modifierKeys.map((modifierKey) => {
		const modifierKeyElement = document.createElement("span");
		modifierKeyElement.className = "shortcut-modifier-key " + modifierKey;
		modifierKeyElement.textContent = toUiText(modifierKey);
		return modifierKeyElement;
	});

	const keyContainerElement = document.createElement("span");
	keyContainerElement.className = "shortcut-key-container";

	if (shortcut.mouseButton !== undefined) {
		const mouseButtonElement = document.createElement("span");
		mouseButtonElement.className = "mouse-icon " + shortcut.mouseButton;
		// mouseButtonElement.textContent = shortcut.mouseButton || "";
		keyContainerElement.appendChild(mouseButtonElement);
	}

	if (shortcut.key !== undefined) {
		const keyElement = document.createElement("span");
		keyElement.className = "shortcut-key";
		keyElement.textContent = shortcut.key || "";
		keyContainerElement.appendChild(keyElement);
	}

	for (const modifierKeyElement of modifierKeyElements) {
		keyContainerElement.appendChild(modifierKeyElement);
	}

	shortcutElement.appendChild(keyContainerElement);

	const descriptionElement = document.createElement("span");
	descriptionElement.className = "shortcut-description";
	descriptionElement.textContent = shortcutInfo.description;
	shortcutElement.appendChild(descriptionElement);

	return shortcutElement;
}

const createShortcutCheatsheet = (shortcutInfos: ShortcutInfo[]) => {
	const shortcutsContainer = document.createElement("div");
	shortcutsContainer.className = "shortcuts-container base-container card";

	const shortcutsList = document.createElement("div");
	shortcutsList.className = "shortcuts-list";

	const categories: any = {};

	shortcutInfos.forEach((shortcutInfo) => {
		const shortcutElement = createShortcutElement(shortcutInfo);
		const shortcutListItem = document.createElement("div");
		shortcutListItem.className = "shortcut-list-item";
		shortcutListItem.appendChild(shortcutElement);
		if (categories[shortcutInfo.category] === undefined) {
			categories[shortcutInfo.category] = [shortcutListItem];
		} else {
			categories[shortcutInfo.category].push(shortcutListItem);
		}
	});

	Object.keys(categories).forEach((category) => {
		const categoryEl = document.createElement("div");
		categoryEl.className = "shortcut-category-container";
		const categoryTitle = document.createElement("h2");
		categoryTitle.className = "shortcut-category-title";
		categoryTitle.textContent = category;
		categoryEl.appendChild(categoryTitle);
		const categoryList = document.createElement("div");
		categoryList.className = "shortcut-category-list";
		categories[category].forEach((shortcutListItem: any) => {
			categoryList.appendChild(shortcutListItem);
		});
		categoryEl.appendChild(categoryList);
		shortcutsList.appendChild(categoryEl);
	});

	shortcutsContainer.appendChild(shortcutsList);

	return shortcutsContainer;
};

export const toggleShortcutCheatsheet = (
	shortcutInfos: ShortcutInfo[],
	on?: boolean
) => {
	const existingShortcutsContainer = document.querySelector(
		".shortcuts-container"
	);

	const create = () => {
		const shortcutsContainer = createShortcutCheatsheet(shortcutInfos);
		const dimmer = document.createElement("div");
		dimmer.className = "dimmer";

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				e.preventDefault();
				e.stopPropagation();
			}
		};
		document.addEventListener("keydown", onKeyDown);

		const onClose = () => {
			shortcutsContainer.remove();
			dimmer.remove();
		};

		dimmer.addEventListener("click", onClose);
		document.addEventListener("keydown", onKeyDown);

		dimmer.addEventListener("DOMNodeRemoved", () => {
			document.removeEventListener("keydown", onKeyDown);
		});

		document.body.appendChild(dimmer);
		document.body.appendChild(shortcutsContainer);
	};

	const remove = () => {
		existingShortcutsContainer?.remove();
		document.querySelector(".dimmer")?.remove();
	};

	if (on === true) {
		if (!existingShortcutsContainer) create();
	} else if (on === false) {
		if (existingShortcutsContainer) remove();
	} else {
		if (existingShortcutsContainer) remove();
		else create();
	}
};
