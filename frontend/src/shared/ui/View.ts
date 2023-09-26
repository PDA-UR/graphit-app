import EventEmitter from "events";

export abstract class View extends EventEmitter {
	abstract toggleHtmlListeners(on: boolean): void;

	protected stopEvent = (e: Event) => {
		e.stopPropagation();
	};
}
