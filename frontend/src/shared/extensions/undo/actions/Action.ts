export abstract class Action {
	abstract do(isComposite: boolean): void;

	abstract undo(isComposite: boolean): void;

	abstract getData(): any;

	abstract getName(): string;
}
