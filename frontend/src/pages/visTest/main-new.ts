import "./style.css";
import WikibaseClient from "../../shared/WikibaseClient";
import { MainViz } from "./vis/MainViz";

async function main() {
	const wikibase = new WikibaseClient();
	const elements = await wikibase.getDependentsAndDependencies();
	const parents = await wikibase.getCategories();

	const graph = parents.concat(elements);

    const mainViz = new MainViz(graph);
	
}

main();