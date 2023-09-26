import EventEmitter from "events";

class SharedEventBus extends EventEmitter {}

export enum SharedEventBusEvent {
	SELECTION_TYPE_CHANGED = "selection-type-changed",
}

export const sharedEventBus = new SharedEventBus();
