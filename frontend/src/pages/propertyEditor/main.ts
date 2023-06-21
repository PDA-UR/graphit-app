import { GraphController } from "./ui/graph/GraphController";

import "./style.css";
import { ToolbarViewController } from "./ui/toolbar/ToolbarController";
import { PropertyModalController } from "./ui/propertyModal/PropertyModalController";
import { state } from "./global/State";
import { getCredentials } from "../../shared/util/GetCredentials";
import { ApiClient, UserSessionModel } from "../../shared/client/ApiClient";
import SaveButtonController from "./ui/saveButton/SaveButtonController";
import { getEnvVar } from "../../shared/util/Env";
import { SparqlParser } from "../../shared/sparql/SparqlParser";
import WikibaseClient from "../../shared/WikibaseClient";
import { createApiClient } from "../../shared/util/getApiClient";
import { getCircularReplacer } from "../selectionTools/global/DataManager";

async function main() {
	const credentials = getCredentials();

	const isProduction = getEnvVar("PROD");
	console.log(import.meta.env);
	console.log("isProduction", isProduction);
	const parser = new SparqlParser();

	const api = createApiClient();
	const wikibaseClient = new WikibaseClient(credentials, api);

	try {
		const userInfo = await wikibaseClient.login();
		console.log(userInfo);

		const elements = await wikibaseClient.getUserGraph();

		const propertyModalController = new PropertyModalController();
		const toolbarController = new ToolbarViewController();
		const saveButtonController = new SaveButtonController();
		const graphController = new GraphController(
			elements,
			api,
			userInfo.userItemId
		);
	} catch (e) {
		window.alert(e);
		console.log(e);
	}
}

state.init();
main();
