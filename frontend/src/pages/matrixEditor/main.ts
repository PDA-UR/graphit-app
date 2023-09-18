import WikibaseClient from "../../shared/WikibaseClient";
import { getCredentials } from "../../shared/util/GetCredentials";
import { createApiClient } from "../../shared/util/getApiClient";

import "./ui/Components";

async function main() {
	console.log("Matrix editor");
	// await setupApi();
}

async function setupApi() {
	const credentials = getCredentials();

	console.log(import.meta.env);
	const api = createApiClient();
	const wikibaseClient = new WikibaseClient(credentials, api);

	try {
		console.log("Logging in...", credentials, api);
		const userInfo = await wikibaseClient.login();
		console.log(userInfo);
	} catch (e) {
		window.alert(e);
		console.log(e);
	}
}
main();
