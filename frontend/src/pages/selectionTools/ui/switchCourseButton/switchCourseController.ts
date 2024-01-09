import WikibaseClient from "../../../../shared/WikibaseClient";
import { LoadingSpinner } from "../../../../shared/ui/LoadingSpinner/SpinnerManager";
import { View } from "../../../../shared/ui/View";
import { GLOBALS } from "../../../graphVis/global/config";
import "./switchCourse.css";

export enum SwitchCourseEvents {
    SWITCH_COURSE = "switchCourse"
}

export class SwitchCourseController extends View {

    private readonly client: WikibaseClient;
    private readonly cy: cytoscape.Core;
    private $switchMenu: HTMLSelectElement;

    constructor(client:WikibaseClient, cy:cytoscape.Core){
        super();
        this.client = client;
        this.cy = cy;

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
            elements = await this.client.getWissGraph(courseQID);
        }

        spinner.stop();
        
        // Reset the displayed graph
        this.cy.elements().remove();
        this.cy.add(elements);
        this.cy.layout(GLOBALS.courseLayout).run();
        
    }

}

