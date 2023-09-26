import EventEmitter from "events";

class ExperimentEventBus extends EventEmitter {}

export const experimentEventBus = new ExperimentEventBus();
