import { Action } from "./Action";
import { WikibaseAction } from "./WikibaseAction";

export class CompositeAction<T extends Action> extends Action {
	private readonly actions: T[];

	constructor(actions: T[]) {
		super();
		this.actions = actions;
	}

	do(): void {
		this.actions.forEach((a) => a.do(true));
	}

	undo(): void {
		this.actions.forEach((a) => a.undo(true));
	}

	merge<A extends Action>(
		action: A
	): CompositeAction<WikibaseAction> | undefined {
		if (this.actions.some((a) => !(a instanceof WikibaseAction)))
			throw new Error(
				"Cant merge non-wikibase actions (composite action is not pure)"
			);

		if (action instanceof WikibaseAction) {
			const actions = (this.actions as unknown as WikibaseAction[]).filter(
				(a) => !a.isOverriddenBy(action)
			);
			return new CompositeAction([...actions, action]);
		}
		if (action instanceof CompositeAction) {
			if (action.actions.some((a) => !(a instanceof WikibaseAction)))
				throw new Error(
					"Cant merge non-wikibase actions (composite action is not pure)"
				);
		}
		return undefined;
	}

	getActions() {
		return this.actions;
	}

	getData() {
		return this.actions.map((a) => a.getData());
	}

	getName(): string {
		return "CompositeAction";
	}
}
