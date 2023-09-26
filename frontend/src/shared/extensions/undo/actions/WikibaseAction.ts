import { ApiClient } from "../../../client/ApiClient";
import { EditAction } from "../other/EditAction";
import { Action } from "./Action";

export abstract class WikibaseAction extends Action {
	abstract getEditAction(
		client: ApiClient<unknown>,
		userEntityId: string
	): EditAction;

	abstract isOverriddenBy(action: WikibaseAction): boolean;
}
