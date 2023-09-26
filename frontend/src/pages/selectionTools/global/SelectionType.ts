import { ModifierKey } from "./KeyboardManager";

export enum SelectionType {
	NEW = "new",
	ADD = "add",
	SUBTRACT = "subtract",
}

export const SELECTION_TYPE_LABEL_MAP = {
	[SelectionType.NEW]: "Neue Selektion",
	[SelectionType.ADD]: "Zur Selektion hinzufügen",
	[SelectionType.SUBTRACT]: "Von Selektion abziehen",
};

// utf-8 icons
export const SELECTION_TYPE_ICON_MAP = {
	[SelectionType.NEW]: "🆕",
	[SelectionType.ADD]: "➕",
	[SelectionType.SUBTRACT]: "➖",
};

export function getSelectionType(modifierKeys: ModifierKey[]): SelectionType {
	const hasCtrl = modifierKeys.includes(ModifierKey.CTRL),
		hasAlt = modifierKeys.includes(ModifierKey.ALT);

	if (hasAlt) return SelectionType.SUBTRACT;
	else if (hasCtrl) return SelectionType.ADD;
	else return SelectionType.NEW;
}
