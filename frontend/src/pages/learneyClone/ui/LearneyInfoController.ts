import tippy from "tippy.js";
import "tippy.js/dist/tippy.css"

export class LearneyInfoController {

    private readonly $infoIcon: HTMLDivElement;
    private readonly $app: HTMLDivElement;
    private readonly $infoContainer: HTMLDivElement;

    constructor() {

        this.$app = document.getElementById("app") as HTMLDivElement;
        this.$app.addEventListener("click", this.onAppClick)

        this.$infoContainer = document.getElementById("learney-info-container") as HTMLDivElement;
        this.$infoIcon = document.getElementById("learney-info-icon") as HTMLDivElement;
        
        tippy(this.$infoIcon, {
            content: 'Click icon for more info',
			theme: 'light',
		});

    }

    private onAppClick = (event:any) => {
        if (event.target.id == "learney-info-icon") {
            this.$infoContainer.classList.remove("hidden");
            this.addLearneyInfo();
        } else {
            this.$infoContainer.classList.add("hidden");
        }
    }

    private addLearneyInfo() {
        this.$infoContainer.innerHTML = "";

        const textDiv = document.createElement("span");
        textDiv.innerText = `Learney was created to map and depict learning behavior with the use of dependencies.

        As the project is currently discontinued, the graph is documented here for historical reasons with permission from the original authors.
        
        An older version of their website can be accessed using the Wayback Machine:\n`

        const wayBackLink = "https://web.archive.org/web/20230602185637/https://learney.me/";
        const linkDiv = document.createElement("a");
        linkDiv.href = wayBackLink;
        linkDiv.rel = "noopener noreferrer";
        linkDiv.target = '_blank';

        const linkText = document.createTextNode("learney.me (archived)");                
        linkDiv.appendChild(linkText);

        this.$infoContainer.appendChild(textDiv);
        this.$infoContainer.appendChild(linkDiv);
    }

}