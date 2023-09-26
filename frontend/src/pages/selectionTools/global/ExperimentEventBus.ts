import EventEmitter from "events";

class ExperimentEventBus extends EventEmitter {}

// eventBus is a singleton
export const experimentEventBus = new ExperimentEventBus();
