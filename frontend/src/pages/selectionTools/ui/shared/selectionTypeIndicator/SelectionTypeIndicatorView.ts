import { View } from "../../../../../shared/ui/View";
import {
	SELECTION_TYPE_ICON_MAP,
	SELECTION_TYPE_LABEL_MAP,
	SelectionType,
} from "../../../global/SelectionType";
import { SharedEventBusEvent, sharedEventBus } from "../SharedEventBus";
import "./selectionTypeIndicator.css";

export class SelectionTypeIndicatorView extends View {
	private readonly $containers: NodeListOf<HTMLElement>;

	constructor() {
		super();
		this.$containers = document.querySelectorAll("#selection-type-indicator");
		this.setType(SelectionType.NEW);
	}

	toggleHtmlListeners(on: boolean): void {
		if (on) {
			this.$containers.forEach(($container) => {
				$container.addEventListener("click", this.toggleNextType);
			});
		} else {
			this.$containers.forEach(($container) => {
				$container.removeEventListener("click", this.toggleNextType);
			});
		}
	}

	public setType = (type: SelectionType) => {
		const label = SELECTION_TYPE_LABEL_MAP[type],
			icon = SELECTION_TYPE_ICON_MAP[type],
			newLabel = "Modus: " + icon + " " + label;
		this.$containers.forEach(($container) => {
			$container.innerHTML = newLabel;
		});

		Object.values(SelectionType).forEach((t) => {
			const className = "selection-type-" + t.toLowerCase();
			if (t === type) {
				this.$containers.forEach(($container) => {
					$container.classList.add(className);
					$container.dataset.type = t;
				});
			} else {
				this.$containers.forEach(($container) => {
					$container.classList.remove(className);
				});
			}
		});
	};

	private getType = (): SelectionType => {
		return this.$containers[0].dataset.type as SelectionType;
	};

	private toggleNextType = () => {
		const type = this.getType();
		const types = Object.values(SelectionType);
		const index = types.indexOf(type);
		const nextIndex = (index + 1) % types.length;

		sharedEventBus.emit(
			SharedEventBusEvent.SELECTION_TYPE_CHANGED,
			types[nextIndex]
		);
	};

	public reset(): void {
		this.setType(SelectionType.NEW);
	}
}
