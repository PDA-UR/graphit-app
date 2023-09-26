import { ViewController } from "../../../../shared/ui/ViewController";
import { GraphView } from "./GraphView";

export abstract class GraphController<
	T extends GraphView
> extends ViewController<T> {
	constructor(view: T) {
		super(view);
	}

	private initMouseListeners = (on = true) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("wheel", this.view.onWheel);
		fn("mousedown", this.view.onMousedown);
		fn("mouseup", this.view.onMouseUp);
		fn("mousemove", this.view.onMouseMove);
	};

	private initKeyboardListeners = (on = true) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.view.onKeydown);
		fn("keyup", this.view.onKeyUp);
	};

	public reset = () => {
		this.view.reset();
	};

	toggleListeners = (on = true) => {
		this.initMouseListeners(on);
		this.initKeyboardListeners(on);
	};
}
