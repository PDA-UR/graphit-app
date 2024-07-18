import cytoscape from "cytoscape";
import WikibaseClient from "../../../shared/WikibaseClient";
import { getElements } from "../global/DataManager";
import { onStartExperimentCondition } from "./startExperimentCondition";

const experimentApp = document.getElementById(
	"experiment-app"
) as HTMLDivElement;

// block ctrl f default
document.addEventListener("keydown", (e) => {
	if (e.ctrlKey && e.key === "f") {
		e.preventDefault();
	}
});

export interface ExperimentStarter {
	cy: cytoscape.Core;
	toggleControllers: (on: boolean) => void;
	resetControllers: () => void;
}

export const onStartExperiment = async (
	api: WikibaseClient,
	userEntityId: string
) => {
	const elements = await getElements();
	const { toggleControllers } = onStartExperimentCondition(
		elements,
		experimentApp,
		api,
		userEntityId
	);
	toggleControllers(true);
};
