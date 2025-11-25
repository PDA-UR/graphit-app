import EventEmitter from "events";

class SharedEventBus extends EventEmitter {}

// eventBus is a singleton
export const sharedEventBus = new SharedEventBus();