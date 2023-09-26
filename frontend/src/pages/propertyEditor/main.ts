import { GraphController } from "./ui/graph/GraphController";

import "./style.css";
import { ToolbarViewController } from "./ui/toolbar/ToolbarController";
import { PropertyModalController } from "./ui/propertyModal/PropertyModalController";
import { state } from "./global/State";
import { getCredentials } from "../../shared/util/GetCredentials";
import SaveButtonController from "./ui/saveButton/SaveButtonController";
import { SparqlParser } from "../../shared/sparql/SparqlParser";
import WikibaseClient from "../../shared/WikibaseClient";
import { createApiClient } from "../../shared/util/getApiClient";

async function main() {
	const credentials = getCredentials();

	console.log(import.meta.env);
	const parser = new SparqlParser();

	const api = createApiClient();
	const wikibaseClient = new WikibaseClient(credentials, api);

	try {
		console.log("Logging in...", credentials, api);

		const userInfo = await wikibaseClient.login();

		const elements = await wikibaseClient.getUserGraph();
		console.log(elements);

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
