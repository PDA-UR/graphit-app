import "./Spinner.css"

export class LoadingSpinner {

    private spinner: HTMLElement;
    private dimmer: HTMLElement;
    private isDimmed: boolean = false;

    constructor(){
        this.spinner = document.getElementById("ring") as HTMLElement;
        this.dimmer = document.createElement("div") as HTMLElement;
        this.dimmer.setAttribute("class", "dimmer");
    }

    /**
     * Start showing the dimmer before the spinner starts
     */
    public startDimmer(){
        document.body.appendChild(this.dimmer);
        this.isDimmed = true;
    }

    /**
     * Start the spinner (call before awaiting results)
     */
    public start(){
        this.spinner.style.display = "inline-block";
        if (!this.isDimmed) document.body.appendChild(this.dimmer);
    }

    /**
     * Stop the spinner (call after awaiting results)
     */
    public stop(){
        this.spinner.style.display = "none";
        document.body.removeChild(this.dimmer);
        this.isDimmed = false;
    }

    public setResourceSpinner(set: boolean) {
        if (set) {
            this.spinner.classList.add("resource-spinner");
            this.dimmer.classList.remove("dimmer");
        } else {
            this.spinner.classList.remove("resource-spinner");
            this.dimmer.classList.add("dimmer");
        }
    }

}

/**
 * Necessary component in the html-file:
 * <div id="ring" class="lds-ring"><div></div><div></div><div></div><div></div></div>
 * 
 */