import { Action } from "./Action";
import { WikibaseAction } from "./WikibaseAction";

export class CompositeAction<T extends Action> extends Action {
	private readonly actions: T[];

	constructor(actions: T[]) {
		super();
		this.actions = actions;
	}

	do(): void {
		this.actions.forEach((a) => a.do());
	}

	undo(): void {
		this.actions.forEach((a) => a.undo());
	}

	merge<A extends Action>(action: A): CompositeAction<WikibaseAction> {
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
		if (action instanceof CompositeAction<WikibaseAction>) {
			if (action.actions.some((a) => !(a instanceof WikibaseAction)))
				throw new Error(
					"Cant merge non-wikibase actions (composite action is not pure)"
				);

			const actions = (this.actions as unknown as WikibaseAction[]).filter(
				(a) => !action.actions.some((a2) => a.isOverriddenBy(a2))
			);
			return new CompositeAction([...actions, ...action.actions]);
		} else {
			throw new Error("Can't merge non-wikibase actions");
		}
	}

	length() {
		return this.actions.length;
	}

	getActions() {
		return this.actions;
	}
}
