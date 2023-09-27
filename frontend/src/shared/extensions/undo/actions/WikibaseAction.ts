import WikibaseClient from "../../../WikibaseClient";
import { ApiClient } from "../../../client/ApiClient";
import { EditAction } from "../other/EditAction";
import { Action } from "./Action";

export abstract class WikibaseAction extends Action {
	isWikibaseAction = true;

	abstract getEditAction(
		client: WikibaseClient,
		userEntityId: string
	): EditAction;

	abstract isOverriddenBy(action: WikibaseAction): boolean;
}
