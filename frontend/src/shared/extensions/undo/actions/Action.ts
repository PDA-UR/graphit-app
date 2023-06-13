export abstract class Action {
	abstract do(): void;

	abstract undo(): void;
}
