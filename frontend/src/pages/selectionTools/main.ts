import "./style.css";
import "tippy.js/dist/tippy.css";
import { onStartExperimentCondition } from "./loadLogic/startExperimentCondition";
import { createApiClient } from "../../shared/util/getApiClient";
import WikibaseClient from "../../shared/WikibaseClient";
import { getCredentials } from "../../shared/util/GetCredentials";
import { CredentialsModel } from "../../shared/client/ApiClient";
import { experimentEventBus } from "./global/ExperimentEventBus";
import {
	GRAPH_SAVE_EVENT,
	GraphSaveProgress,
} from "./ui/graph/GraphController";
import { Toast, ToastLength } from "./ui/toast/Toast";

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

	console.log(elements);

	experimentApp.style.display = "flex";
	const { resetControllers, toggleControllers } = onStartExperimentCondition(
		elements,
		experimentApp,
		wikibaseClient,
		userInfo.userItemId
	);
	resetControllers();
	toggleControllers(true);

	experimentEventBus.addListener(GRAPH_SAVE_EVENT, (e) => {
		const progress = e.progress;
		if (progress === GraphSaveProgress.START) {
			toggleControllers(false);
			experimentApp.classList.add("loading");
			Toast.info("Saving changes...").show();
		} else if (progress === GraphSaveProgress.COMPLETE) {
			toggleControllers(true);
			experimentApp.classList.remove("loading");
			Toast.success("Changes saved!").show();
		} else if (progress === GraphSaveProgress.ERROR) {
			experimentApp.classList.remove("loading");
			experimentApp.classList.add("error");
			console.error(e.error);
			Toast.error("Error saving changes!", ToastLength.LONG).show();
		}
	});
};

main();
