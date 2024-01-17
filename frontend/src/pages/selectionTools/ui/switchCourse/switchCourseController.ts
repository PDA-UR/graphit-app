import WikibaseClient from "../../../../shared/WikibaseClient";
import { LoadingSpinner } from "../../../../shared/ui/LoadingSpinner/SpinnerManager";
import { View } from "../../../../shared/ui/View";
import { GLOBALS } from "../../../graphVis/global/config";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import { FilterManager } from "../experiment/filter/Filter";
import "./switchCourse.css";

export enum SwitchCourseEvents {
    SWITCH_COURSE = "switchCourse"
}

export class SwitchCourseController extends View {

    private readonly client: WikibaseClient;
    private readonly cy: cytoscape.Core;
    private readonly filterManager: FilterManager;
    private $switchMenu: HTMLSelectElement;

    constructor(
        client:WikibaseClient, 
        cy:cytoscape.Core,
        filterManager: FilterManager,
    ){
        super();
        this.client = client;
        this.cy = cy;
        this.filterManager = filterManager;

        // Init events
        this.$switchMenu = document.getElementById(
            "switch-course"
        ) as HTMLSelectElement;
    }

    public toggleHtmlListeners(on: boolean): void {
        if(on) {
            this.$switchMenu.addEventListener("change", this.switchCourse);
        } else {
            this.$switchMenu.removeEventListener("change",this.switchCourse);
        }
    }

    /**
     * Switches to the coures, selected in the drop-down menu
     * @param e event
     */
    private switchCourse = async (e:Event) => {
        const target = e.target as HTMLSelectElement
        const courseQID = target.selectedOptions[0].value as string;

        // Load the new graph elements
        const spinner = new LoadingSpinner();
	    spinner.start();

        let elements;
        if(courseQID == "Q171") { // get CGBV -> has diff. query
            elements = await this.client.getUserGraph();
        } else { // get all other courses
            elements = await this.client.getCourseQuery(courseQID);
        }

        spinner.stop();

        // Reset the graph
        this.cy.elements().remove();
        if(elements.length == 0) {
            this.emptyCourseInfo();
        } else {
            this.cy.add(elements);
        }
        this.cy.layout(GLOBALS.courseLayout).run();

        // Reset searchbar (if opened) and FilterBar
        experimentEventBus.emit(SwitchCourseEvents.SWITCH_COURSE);
        this.filterManager.resetRoot(this.cy);
        console.log("switched course");        
    }

    private emptyCourseInfo(){
        console.log("empty course");
        this.cy.add({
            group: "nodes",
            data: { 
                id: "construction",
                label: "Still under construction...",
            },
            style: {
                "shape": "diamond",
                "background-color": "#FFE115",
                "border-width": "1",
                "border-color": "#000000",
                "width": "10",
                "height": "10",
            },
        });
    }

}

