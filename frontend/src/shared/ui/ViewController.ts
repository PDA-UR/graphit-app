import { View } from "./View";

export abstract class ViewController<T extends View> {
	protected readonly view: T;

	constructor(view: T) {
		this.view = view;
	}

	protected abstract toggleListeners(on: boolean): void;

	public abstract reset(): void;

	public toggle(on: boolean): void {
		this.toggleListeners(on);
		this.view.toggleHtmlListeners(on);
	}
}
