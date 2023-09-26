import "./style.css";
import "tippy.js/dist/tippy.css";
import { onStartExperimentCondition } from "./loadLogic/startExperimentCondition";
import { createApiClient } from "../../shared/util/getApiClient";
import WikibaseClient from "../../shared/WikibaseClient";
import { getCredentials } from "../../shared/util/GetCredentials";
import { CredentialsModel } from "../../shared/client/ApiClient";

const main = async () => {
	const api = createApiClient();

	const localStorageCredentials = localStorage.getItem("credentials");
	let credentials: CredentialsModel;
	if (localStorageCredentials) {
		credentials = JSON.parse(localStorageCredentials);
	} else {
		credentials = getCredentials();
		localStorage.setItem("credentials", JSON.stringify(credentials));
	}

	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);

	const userInfo = await wikibaseClient.login();
	const elements = await wikibaseClient.getUserGraph(),
		experimentApp = document.getElementById("experiment-app") as HTMLDivElement;

	experimentApp.style.display = "flex";
	const { resetControllers, toggleControllers } = onStartExperimentCondition(
		elements,
		experimentApp
	);
	resetControllers();
	toggleControllers(true);
};

main();
