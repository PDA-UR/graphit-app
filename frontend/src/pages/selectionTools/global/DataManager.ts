import WikibaseClient from "../../../shared/WikibaseClient";
import { getCredentials } from "../../../shared/util/GetCredentials";

const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key: any, value: any) => {
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) {
				return;
			}
			seen.add(value);
		}
		return value;
	};
};

export const getElements = async () => {
	const localStorageKey = "elements";
	const elements = localStorage.getItem(localStorageKey);

	if (elements) {
		console.log("loading from local storage");
		const parsedElements = JSON.parse(elements);
		return parsedElements;
	} else {
		console.log("loading from wikibase");
		const credentials = getCredentials();
		const wikibase = new WikibaseClient(credentials);
		const elements = await wikibase.getDependentsAndDependencies();
		console.log(elements);
		localStorage.setItem(
			localStorageKey,
			JSON.stringify(elements, getCircularReplacer())
		);
		return elements;
	}
};
