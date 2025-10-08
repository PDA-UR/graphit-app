import "./style.css";
import "tippy.js/dist/tippy.css";
import { onStartExperimentCondition } from "./loadLogic/startExperimentCondition";
import { createApiClient } from "../../shared/util/getApiClient";
import WikibaseClient from "../../shared/WikibaseClient";
import { CredentialsModel } from "../../shared/client/ApiClient";
import { experimentEventBus } from "./global/ExperimentEventBus";
import {
	GRAPH_SAVE_EVENT,
	GraphSaveProgress,
} from "./ui/graph/GraphController";
import { Toast, ToastLength } from "./ui/toast/Toast";
import { getCircularReplacer } from "../graphVis/global/DataManager";
import { LoadingSpinner } from "../../shared/ui/LoadingSpinner/SpinnerManager";
import { askDemoAccess, handleLogin } from "../../shared/util/GetCredentials";
import { getEnvVar } from "../../shared/util/Env";
import { PreselectCourseController } from "./ui/switchCourse/preselectCourseController";


/**
 * Get the qid (e.g. Q926) of the default course,
 * i.e. the course, that is preselected in the dropdown menu (see: selectionTools/index.html)
 * @returns the qid as a string
 */
function getDefaultCourse() {
	const menu = document.getElementById("switch-course") as HTMLSelectElement;
	return menu.selectedOptions[0].value as string;
}


/**
 * Starts the application.
 * Checks the if current environment is production or local development 
 */
const main = async() => {
	const instance = getEnvVar("VITE_WIKIBASE_INSTANCE");

	let isProd = true
	if(instance.includes("localhost")) {
		isProd = false;
	} 
	console.log("[PROD]", isProd)

	initApp(isProd);
}


/**
 * Loads the graph according to the environment.
 * Start the necessary services and controllers for the application.
 * @param isProd is the app in production?
 */
const initApp = async (isProd: boolean) => {
	
	// show dimmer
	const spinner = new LoadingSpinner();
	spinner.startDimmer();
	
	const { wikibaseClient, userInfo } = await doLogin();
	
	spinner.start();

	await addExistingCourseOptions(wikibaseClient);
	
	const preselectCourse = new PreselectCourseController(wikibaseClient);
	let course = await preselectCourse.getCurrentCourse();
	

	// Get the elements for the graph
	let elements: any;
	if (isProd) {
		elements = await wikibaseClient.getCourseQuery(course);
	} else {
		elements = await getElementsForDev(wikibaseClient, course);
	}

	// init the application
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
			console.log("save successful")
		} else if (progress === GraphSaveProgress.ERROR) {
			experimentApp.classList.remove("loading");
			experimentApp.classList.add("error");
			console.error(e.error);
			Toast.error("Error saving changes!", ToastLength.LONG).show();
		} else if (progress === GraphSaveProgress.COUNT_WARNING) { 
			const str = "Saving more than 50 items can take a long time.";
			Toast.info(str, ToastLength.LONG).show();
		} else if (progress === GraphSaveProgress.UNAUTHORIZED) {
			toggleControllers(true);
			experimentApp.classList.remove("loading");
			Toast.error("Unauthorized action", ToastLength.SHORT).show();
			console.log("unauthorized action")
		}
	});

	spinner.stop();
}

/**
 * Creates a wikibaseClient to handle the login (normal or demo).
 * @returns both {wikibaseClient, userInfo}
 */
async function doLogin() {
	const localStorageCredentials = localStorage.getItem("credentials");
	let credentials: CredentialsModel;
	let wikibaseClient: WikibaseClient;
	let userInfo;

	const api = createApiClient();

	let userString = "[username]";
	const wantsDemo = await askDemoAccess();

	if (wantsDemo) {
		console.log("[DEMO]");
		credentials = getDemoCredentials();
		wikibaseClient = new WikibaseClient(credentials, api);
		userInfo = await wikibaseClient.login();
		userString = "[DEMO]";
	} else 
	if (localStorageCredentials) {
		credentials = JSON.parse(localStorageCredentials);
		wikibaseClient = new WikibaseClient(credentials, api);
		userInfo = await wikibaseClient.login();
	} else {
		let logRes = await handleLogin(api); 
		wikibaseClient = logRes[0];
		userInfo = logRes[1];
	}

	// display username 
	const userDiv = document.getElementById("username") as HTMLAnchorElement;
	userDiv.href = `https://graphit.ur.de/wiki/Item:${userInfo.userItemId}`
	userDiv.innerText = "[" + userInfo.username + "]";

	return {
		wikibaseClient,
		userInfo
	}
}

/**
 * Uses the "Max Mustermann" account to login for demo. Doesn't have editing rights.
 * @returns credentials
 */
function getDemoCredentials() {
	return {
		username: "Max Mustermann",
		password: "placeholder"
	} as CredentialsModel
}

/**
 * Gets the graph elements once and then saves them in localStorage.
 * This is to prevent too many calls to Wikibase, when developing/testing things.
 * Elements are deleted if you return to the homepage. Or do it manually.
 * @param wikibaseClient 
 * @returns elements
 */
async function getElementsForDev(wikibaseClient: WikibaseClient, course:string) {
	const localStorageElements = localStorage.getItem("elements");
	let elements: any;

	// check if elements are saved in localStorage
	if(localStorageElements) { 
		console.log("[DEV] loading from local storage");
		elements = JSON.parse(localStorageElements);
	} else {
		console.log("[DEV] loading from wikibase");
		elements = await wikibaseClient.getCourseQuery(course);
		
		// Store elements for the session
		localStorage.setItem(
			"elements",
			JSON.stringify(elements, getCircularReplacer()),
		);
	}

	return elements;
	
}

/**
 * Query all existing courses (that include at least one session) from the wikibase instance 
 * and add them as option to the course selection drop down
 * @param wikibaseClient 
 */
async function addExistingCourseOptions(wikibaseClient: WikibaseClient) {
	const existingCourses = await wikibaseClient.getExistingCourses();

	const courseSelect = document.getElementById("switch-course") as HTMLSelectElement;
	const bindings = existingCourses.data.results.bindings;
	bindings.forEach((binding:any) => {
		const key = binding.courseLabel.value;
		let url = binding.course.value;
		const value = url.match(/[Q]\d*/g)[0];
		courseSelect.options.add(new Option(key, value));
	});
}


/* MAIN */

main();
