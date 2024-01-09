import "./Spinner.css"

export class LoadingSpinner {

    private spinner: HTMLElement;
    private dimmer: HTMLElement;

    constructor(){
        this.spinner = document.getElementById("ring") as HTMLElement;
        this.dimmer = document.createElement("div") as HTMLElement;
        this.dimmer.setAttribute("class", "dimmer");
    }

    /**
     * Start the spinner (call before awaiting results)
     */
    public start(){
        this.spinner.style.display = "inline-block";
        document.body.appendChild(this.dimmer);
    }

    /**
     * Stop the spinner (call after awaiting results)
     */
    public stop(){
        this.spinner.style.display = "none";
        document.body.removeChild(this.dimmer);
    }

}

/**
 * Necessary component in the html-file:
 * <div id="ring" class="lds-ring"><div></div><div></div><div></div><div></div></div>
 * 
 */