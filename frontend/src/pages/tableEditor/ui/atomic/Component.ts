import { CSSResultGroup, LitElement } from "lit-element";
import { globalCss } from "../../styles/global-css";
import { PropertyValues } from "lit";
/**
 * Base class for all components.
 * Automatically includes global styles and resets.
 */
export abstract class Component extends LitElement {
	// Small hack to include global styles
	private static _styles: CSSResultGroup;

	static get styles(): CSSResultGroup {
		const derivedStyles = this._styles || [];
		return [
			globalCss,
			...(Array.isArray(derivedStyles) ? derivedStyles : [derivedStyles]),
		];
	}

	static set styles(styles: CSSResultGroup) {
		this._styles = styles;
	}
}
