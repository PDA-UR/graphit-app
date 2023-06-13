import { GraphController } from "./ui/graph/GraphController";

import "./style.css";
import { ToolbarViewController } from "./ui/toolbar/ToolbarController";
import { PropertyModalController } from "./ui/propertyModal/PropertyModalController";
import WikibaseClient from "../../shared/WikibaseClient";
import { state } from "./global/State";
import { getCredentials } from "../../shared/util/GetCredentials";
import { ApiClient } from "../../shared/client/ApiClient";
import SaveButtonController from "./ui/saveButton/SaveButtonController";
import { getEnvVar } from "../../shared/util/Env";

async function main() {
	const credentials = getCredentials();
	console.log(credentials);
	const wikibase = new WikibaseClient(credentials);

	const isProduction = getEnvVar("PROD");

	const userInfo = await wikibase.getUserInfo();
	if (userInfo.userItemId === "") {
		// show alert
		alert("You must add your user item id to your user page!");
		return;
	}

	const api = new ApiClient({
		baseURL: "http://localhost:8083",
	});

	try {
		const login = await api.auth.controllerLogin(credentials);
		console.log(login);
	} catch (error) {
		console.log("error", error);
	}

	const elements = await wikibase.getDependentsAndDependencies();
	const propertyModalController = new PropertyModalController();
	const toolbarController = new ToolbarViewController();
	const saveButtonController = new SaveButtonController();
	const graphController = new GraphController(
		elements,
		api,
		userInfo.userItemId
	);
}

state.init();
main();
