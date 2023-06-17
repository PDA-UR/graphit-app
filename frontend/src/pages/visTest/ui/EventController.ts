import { eventBus } from "../../propertyEditor/global/EventBus";

// Classes for handeling Events/Interactions

// Handeling Menu Events
export class MenuEventController {
    
    private readonly $container : HTMLDivElement;
    private readonly $dropBtn : HTMLSelectElement;

    constructor() {
        this.$container = document.getElementById("toolbar") as HTMLDivElement;
        this.$dropBtn = document.getElementById("layout-options") as HTMLSelectElement;
        this.$initListeners();
    }


    private $initListeners() {
        this.$dropBtn.selectedIndex = 0; // Change Dropdown back to default value
        this.$dropBtn.addEventListener("change", this.onLayoutChange);
    };

    // Event to change to layout depending on selecte option (dropdown-menu)
    private onLayoutChange = (e:any) => {
        var layoutVar = e.target.value;
        eventBus.emit("layoutChange", layoutVar);
    };

}

// Handeling Graph Events
export class GraphEventController {

    private readonly $cy : any;

    constructor(cy: any){
        this.$cy = cy;
        this.$initListeners();
    }

    private $initListeners() {
        //this.$cy.dblclick(); // Note: Extension Also triggers several regular click event
        this.initDoubleClick();
        this.$cy.on("dblclick", this.ondoubleClick);
    }

    // via: [3rd Answer] https://stackoverflow.com/questions/18610621/cytoscape-js-check-for-double-click-on-nodes
    private initDoubleClick() {
        var doubleClickDelayMs = 350;
        var previousTapStamp:any;
        this.$cy.on("tap", function(e:any) {
            var currentTapStamp = e.timeStamp;
            var msFromLastTap = currentTapStamp - previousTapStamp;
        
            if (msFromLastTap < doubleClickDelayMs) {
                e.target.trigger('doubleClick', e);
            }
            previousTapStamp = currentTapStamp;
        });
    }

    // Event to open an Item-Page on doubleclick
    private ondoubleClick = (e:any) => {
        const target = e.target;
        const timestamp = e.timestamp;
        eventBus.emit("openItemPage", target, timestamp);
    }

}