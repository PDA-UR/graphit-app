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
import { UserInfo } from "os";
import { getCircularReplacer } from "../graphVis/global/DataManager";

// OLD function -> remove once new one works and is tested enough
const main = async () => {
	const api = createApiClient();

	const localStorageElements = localStorage.getItem("elements");

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
	// const elements = await wikibaseClient.getUserGraph(), // works
	const elements = await wikibaseClient.getWissGraph(),
		experimentApp = document.getElementById("experiment-app") as HTMLDivElement;

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
		} else if (progress === GraphSaveProgress.COUNT_WARNING) { 
			const str = "Saving more than 50 items can take a long time.";
			Toast.info(str, ToastLength.LONG).show();
		}
	});
};

/* 
This function can be used for developing. 
It saves the data in the localstorage, meaning it:
- doesn't pull data from wikibase on every reload of the page
- will not show changes to the data on reload (not saved in localStorage, YET) 
-> probably won't need this for acutal usage as users will not reload the page that often 
*/
const mainDev = async () => {
	const api = createApiClient();

	const localStorageElements = localStorage.getItem("elements");
	const localStorageCredentials = localStorage.getItem("credentials");
	let credentials: CredentialsModel;
	let elements: any;
	let fromStorage: Boolean;
	
	// get Credentials
	if (localStorageCredentials) {
		console.log("loading from local storage");
		fromStorage = true;
		credentials = JSON.parse(localStorageCredentials);
	} else {
		console.log("loading from wikibase");
		fromStorage = false;
		credentials = getCredentials();
		localStorage.setItem("credentials", JSON.stringify(credentials));
	}

	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);
	const userInfo = await wikibaseClient.login();

	// Get Elements
	if(fromStorage && localStorageElements) { 
		console.log("loading from local storage 2");
		elements = JSON.parse(localStorageElements);
	} else {
		console.log("loading from wikibase 2");
		elements = await wikibaseClient.getWissGraph(); // WissArb-query
		// const elements = await wikibaseClient.getUserGraph(), // cgbv-query
		
		// Store elements for the session
		localStorage.setItem(
			"elements",
			JSON.stringify(elements, getCircularReplacer()),
		);
	}

	const experimentApp = document.getElementById("experiment-app") as HTMLDivElement;

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
		} else if (progress === GraphSaveProgress.COUNT_WARNING) { 
			const str = "Saving more than 50 changes can take a long time.";
			Toast.info(str, ToastLength.LONG).show();
		}
	});
};

main();
// mainDev();
