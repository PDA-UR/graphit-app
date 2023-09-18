import { eventBus } from "../../propertyEditor/global/EventBus";

// Classes for handeling Events/Interactions

// HANDLE MENU EVENTS
export class MenuEventController {
    
    private readonly $container : HTMLDivElement;
    private readonly $dropBtn : HTMLSelectElement;
    private readonly $searchBtn : HTMLButtonElement;
    private readonly $toggleBtn1 : HTMLInputElement;
    private readonly $toggleBtn2 : HTMLInputElement;

    constructor() {
        this.$container = document.getElementById("toolbar") as HTMLDivElement;
        this.$dropBtn = document.getElementById("layout-options") as HTMLSelectElement;
        this.$searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;
        this.$toggleBtn1 = document.getElementById("toggle1") as HTMLInputElement;
        this.$toggleBtn2 = document.getElementById("toggle2") as HTMLInputElement;
        this.$initListeners();
    }


    private $initListeners() {
        this.$dropBtn.selectedIndex = 0; // Change Dropdown back to default value
        this.$dropBtn.addEventListener("change", this.onLayoutChange);
        this.$searchBtn.addEventListener("click", this.onSearch);
        this.$toggleBtn1.addEventListener("click", this.onToggleBubbleSet);
        this.$toggleBtn2.addEventListener("click", this.onTogglePacking);
    };

    // ---- EVENTS ----

    // Event to change to layout depending on selecte option (dropdown-menu)
    private onLayoutChange = (e:any) => {
        var layoutVar = e.target.value;
        eventBus.emit("layoutChange", layoutVar);
    };

    private onToggleBubbleSet = (e:any) => {
        var toggleVar = e.target;
        eventBus.emit("toggleBubble", toggleVar);
    };

    private onTogglePacking = (e:any) => {
        var toggleVar = e.target;
        eventBus.emit("togglePacking", toggleVar);
    }

    private onSearch = (e:any) => {
        eventBus.emit("searchNode", e)
    };

}


// HANDEL GRAPH EVENTS
export class GraphEventController {

    private readonly $cy : any;

    constructor(cy: any){
        this.$cy = cy;
        this.$initListeners();
    }

    private $initListeners() {
        //this.$cy.dblclick(); // Note: Extension Also triggers several regular click event
        this.$cy.on("click", this.onSingleClick);
        this.initDoubleClick();
        this.$cy.on("dblclick", this.onDoubleClick);
    }

    // ---- EVENTS ----

    private onSingleClick = (e:any) => {
        eventBus.emit("click", e.target);
    }

    // via: [3rd Answer] https://stackoverflow.com/questions/18610621/cytoscape-js-check-for-double-click-on-nodes
    // Improvement? Check position
    private initDoubleClick() {
        var doubleClickDelayMs = 350;
        var previousTapStamp:any;
        this.$cy.on("mouseup", function(e:any) {
            //Disaple click events until double click triggers -> macht keinen Sinn
            // e.target.style("events", "no");
            var currentTapStamp = e.timeStamp;
            var msFromLastTap = currentTapStamp - previousTapStamp;
        
            if (msFromLastTap < doubleClickDelayMs) {
                e.target.trigger('doubleClick', e);
            }
            previousTapStamp = currentTapStamp;

        });
    }

    // Event to open an Item-Page on doubleclick
    private onDoubleClick = (e:any) => {
        const target = e.target;
        eventBus.emit("openItemPage", target);
    }

}