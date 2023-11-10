import WikibaseClient from "../../../shared/WikibaseClient";
import { ApiClient } from "../../../shared/client/ApiClient";
import { toggleShortcutCheatsheet } from "../../../shared/shortcuts/Shortcut";
import { ShortcutsExperiment } from "../../../shared/shortcuts/ShortcutsExperiment";
import { FilterManager } from "../ui/experiment/filter/Filter";
import { FilterBarController } from "../ui/experiment/filter/FilterBarController";
import { ExperimentGraphController } from "../ui/experiment/graph/ExperimentGraphController";
import { SearchViewController } from "../ui/experiment/search/SearchController";
import { getExperimentCy } from "../ui/graph/CytoscapeFabric";
import LegendButtonController from "../ui/legend/legendButtonControler";
import LogoutButtonController from "../ui/logoutButton/logoutButtonController";
import { PropertyModalController } from "../ui/propertyModal/PropertyModalController";
import SaveButtonController from "../ui/saveButton/SaveButtonController";
import { SelectionTypeIndicatorController } from "../ui/shared/selectionTypeIndicator/SelectionTypeIndicatorController";
import { ExperimentStarter } from "./startExperiment";

export const onStartExperimentCondition = (
	elements: any,
	app: HTMLDivElement,
	client: WikibaseClient,
	userEntityId: string
): ExperimentStarter => {
	document.addEventListener("keydown", (event) => {
		if (event.key === "?") {
			toggleShortcutCheatsheet(ShortcutsExperiment);
		}
	});

	const cy = getExperimentCy(elements),
		filterManager = new FilterManager(cy);

	const graphController = new ExperimentGraphController(
		cy,
		client,
		userEntityId
	);
	//@ts-ignore
	const searchController = new SearchViewController(cy);
	const filterController = new FilterBarController(cy, filterManager);
	const selectionTypeIndicatorController =
		new SelectionTypeIndicatorController();
	const propertyModalController = new PropertyModalController();
	const saveButtonController = new SaveButtonController();
	const logoutButtonController = new LogoutButtonController();
	const legendButtonController = new LegendButtonController();

	const toggleControllers = (on = true) => {
		graphController.toggle(on);
		searchController.toggle(on);
		filterController.toggle(on);
		propertyModalController.toggle(on);
		saveButtonController.toggle(on);
		logoutButtonController.toggle(on);
		legendButtonController.toggle(on);

		app.classList.toggle("disabled", !on);
	};

	const resetControllers = () => {
		graphController.reset();
		searchController.reset();
		filterController.reset();
	};

	return {
		// @ts-ignore
		cy,
		toggleControllers,
		resetControllers,
	};
};
