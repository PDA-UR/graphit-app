import EventEmitter from "events";

class ControlEventBus extends EventEmitter {}

export const controlEventBus = new ControlEventBus();
