import EventEmitter from "events";
import { v4 as uuidv4 } from "uuid";

export class Filter {
	public nodesToShow: any[]; // was readonly
	public nodesToHide: any[]; // was readonly
	private readonly cy: any;
	private readonly id: string = uuidv4();

	constructor(nodesToShow: any[], cy: any) {
		this.nodesToShow = nodesToShow;
		this.nodesToHide = cy.$(":visible").unmerge(nodesToShow);
		this.cy = cy;
	}

	public apply() {
		this.nodesToHide.forEach((node) => {
			node.hide();
			node.connectedEdges().hide();
		});

		this.nodesToShow.forEach((node) => {
			node.show();
			node.connectedEdges().show();
		});

		this.cy.elements().removeClass("filtered");
		const hiddenNodes = this.cy.elements().unmerge(this.nodesToShow);
		hiddenNodes.addClass("filtered");
	}

	public reset() {
		this.cy.elements().show();
		this.cy.elements().removeClass("filtered");
	}

	// resets the filter when the course gets switched to use the new data
	public resetNodes(){
		this.nodesToShow = this.cy.elements();
		this.nodesToHide = this.cy.$(":visible").unmerge(this.nodesToShow);
	} 

	public startPreview() {
		this.reset();

		this.nodesToShow.forEach((node) => {
			node.addClass("filter-highlight");
			node.connectedEdges().addClass("filter-highlight");
		});

		const hiddenElements = this.cy
			.elements()
			.unmerge(this.nodesToShow)
			.unmerge(this.nodesToHide);

		hiddenElements.hide();

		this.nodesToHide.forEach((node) => {
			node.addClass("filter-fade");
			node.connectedEdges().addClass("filter-fade");
		});

		console.log("prev:", "show=", this.nodesToShow.length, this.nodesToShow,
		"\nhidden=", hiddenElements.length, hiddenElements, 
		"\nhide=", this.nodesToHide.length);
	}

	public stopPreview() {
		this.cy.elements().removeClass("filter-highlight");
		this.cy.elements().removeClass("filter-fade");
		this.apply();
	}

	public isSameAs(filter?: Filter) {
		if (filter === undefined) return false;
		return this.nodesToShow.every(
			(node) =>
				filter.nodesToShow.includes(node) &&
				this.nodesToShow.length === filter.nodesToShow.length
		);
	}

	public getId() {
		return this.id;
	}

	public getNumberOfNodes() {
		return this.nodesToShow.length;
	}
}

export enum FilterManagerEvents {
	FILTER_ADDED = "add-filter",
	FILTER_REMOVED = "remove-filter",
	ACTIVE_FILTER_CHANGED = "jump-to-filter",
}

export class FilterManager extends EventEmitter {
	private readonly filters: Filter[];
	private activeFilterIndex: number = -1;

	constructor(cy: any) {
		super();
		this.filters = [];

		const rootFilter = new Filter(cy.nodes(), cy);
		this.pushFilter(rootFilter);
	}

	public pushFilter(filter: Filter) {
		if (filter.isSameAs(this.getLastFilter())) return false;
		this.filters.push(filter);
		filter.apply();
		this.activeFilterIndex = this.filters.length - 1;
		this.emit(FilterManagerEvents.FILTER_ADDED, this.activeFilterIndex);
		return true;
	}

	public removeFilter(filterIndex: number) {
		if (filterIndex === 0) return;

		if (this.filters.length >= filterIndex) {
			this.filters.splice(filterIndex, 1);
			this.activeFilterIndex = this.filters.length - 1;
			if (this.activeFilterIndex >= 0) this.getActiveFilter().apply();
			this.emit(FilterManagerEvents.FILTER_REMOVED, filterIndex);
		}
	}

	//remove all active filters for a graph (used when course is switched)
	public removeAllActiveFilters(){
		console.log("remove all active Filters", this.filters.length)
		const last = this.filters.length - 1;
		for(let i = last ; i > 0; i--){
			this.stopFilterPreview(i);
			this.removeFilter(i);
			console.log("len", this.filters.length);
		}
	}

	public jumpToFilter(filterIndex: number) {
		if (this.filters.length >= filterIndex) {
			const filter = this.filters[filterIndex];
			filter.apply();
			this.activeFilterIndex = filterIndex;
			this.emit(FilterManagerEvents.ACTIVE_FILTER_CHANGED, filterIndex);
		}
	}

	public startFilterPreview(filterIndex: number) {
		if (this.filters.length >= filterIndex) {
			const filter = this.getFilterByIndex(filterIndex);
			filter.startPreview();
		}
	}

	public stopFilterPreview(filterIndex: number) {
		if (this.filters.length >= filterIndex) {
			const filter = this.getFilterByIndex(filterIndex);
			filter.stopPreview();

			const activeFilter = this.getActiveFilter();
			if (activeFilter) activeFilter.apply();
		}
	}

	public getActiveFilter() {
		return this.filters[this.activeFilterIndex];
	}

	public getActiveFilterIndex() {
		return this.activeFilterIndex;
	}

	public getLastFilter() {
		return this.filters[this.filters.length - 1];
	}

	public getFilterByIndex(index: number) {
		return this.filters[index];
	}

	public getFilterById(id: string) {
		return this.filters.find((filter) => filter.getId() === id);
	}

	public getFilterIndexById(id: string) {
		return this.filters.findIndex((filter) => filter.getId() === id);
	}

	public hasFilters() {
		return this.filters.length > 0;
	}

	public getNumberOfFilters() {
		return this.filters.length;
	}

	public reset() {
		// this.filters.forEach((filter) => filter.reset());
		this.filters.splice(1, this.filters.length - 1);
		this.activeFilterIndex = 0;
		// this.emit(FilterManagerEvents.FILTER_REMOVED, 1);
	}

	// ...to use the new graph data, when a new course gets pulled
	// BUG -> nodes are faded, when there where filters applied
	// TODO: test bugfix -> but should work
	public resetRoot(cy:any) { 
		this.removeAllActiveFilters();
		this.reset();
		const rootFilter = this.filters[0];
		rootFilter.resetNodes();
		cy.elements().removeClass("dimmed"); // so that graph renders undimmed
		cy.style().update();
	}
}
