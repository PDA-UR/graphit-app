export enum ModifierKey {
	SHIFT = "Shift",
	CTRL = "Control",
	ALT = "Alt",
	SPACE = " ",
}

export const toUiText = (modifierKey: ModifierKey): string => {
	switch (modifierKey) {
		case ModifierKey.SHIFT:
			return "Shift";
		case ModifierKey.CTRL:
			return "Ctrl";
		case ModifierKey.ALT:
			return "Alt";
		case ModifierKey.SPACE:
			return "Leertaste";
	}
};

export const fromMouseEvent = (event: MouseEvent): ModifierKey[] => {
	const keys: ModifierKey[] = [];

	if (event.shiftKey) keys.push(ModifierKey.SHIFT);
	if (event.ctrlKey) keys.push(ModifierKey.CTRL);
	if (event.altKey) keys.push(ModifierKey.ALT);

	return keys;
};

export const fromKeyboardEvent = (event: KeyboardEvent): ModifierKey[] => {
	const keys: ModifierKey[] = [];

	if (event.shiftKey) keys.push(ModifierKey.SHIFT);
	if (event.ctrlKey) keys.push(ModifierKey.CTRL);
	if (event.altKey) keys.push(ModifierKey.ALT);
	if (event.key === " ") keys.push(ModifierKey.SPACE);

	return keys;
};

export const fromEvent = (event: MouseEvent | KeyboardEvent): ModifierKey[] => {
	if (event instanceof MouseEvent) return fromMouseEvent(event);
	else return fromKeyboardEvent(event);
};

export const isModifierActive = (
	activeModfierKeys: ModifierKey[],
	key: ModifierKey
): boolean => {
	return activeModfierKeys.includes(key);
};
