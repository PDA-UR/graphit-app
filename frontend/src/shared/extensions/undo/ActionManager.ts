import { Action } from "./actions/Action";
import { CompositeAction } from "./actions/CompositeAction";
import { WikibaseAction } from "./actions/WikibaseAction";

export class ActionManager {
	private readonly undoStack: Action[] = [];
	private readonly redoStack: Action[] = [];

	do(action: Action): void {
		action.do();
		this.undoStack.push(action);
		this.redoStack.length = 0;
	}

	undo(): Action | null {
		if (this.undoStack.length === 0) return null;
		const action = this.undoStack.pop() as Action;
		action.undo();
		this.redoStack.push(action);
		return action;
	}

	redo(): Action | null {
		if (this.redoStack.length === 0) return null;
		const action = this.redoStack.pop() as Action;
		action.do();
		this.undoStack.push(action);
		return action;
	}

	getWikibaseActions(): CompositeAction<WikibaseAction> {
		console.log("compressing", this.undoStack);
		return this.undoStack
			.filter(
				(a) =>
					a instanceof WikibaseAction ||
					a instanceof CompositeAction<WikibaseAction>
			)
			.reduce(
				this.compressReducer,
				new CompositeAction([])
			) as CompositeAction<WikibaseAction>;
	}

	private compressReducer(
		acc: CompositeAction<WikibaseAction>,
		action: Action
	): CompositeAction<WikibaseAction> {
		console.log("merging", acc, action);
		const mergedAction = acc.merge(action);
		if (mergedAction == null) return acc;
		else if (mergedAction instanceof CompositeAction) {
			return mergedAction;
		} else {
			return new CompositeAction([mergedAction]);
		}
	}

	getUndoStack(): Action[] {
		return this.undoStack;
	}

	getRedoStack(): Action[] {
		return this.redoStack;
	}

	clear(): void {
		this.undoStack.length = 0;
		this.redoStack.length = 0;
	}
}
