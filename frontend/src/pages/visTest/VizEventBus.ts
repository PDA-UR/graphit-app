import EventEmitter from "events";

class VizEventBus extends EventEmitter {}

export const vizEventBus = new VizEventBus();
