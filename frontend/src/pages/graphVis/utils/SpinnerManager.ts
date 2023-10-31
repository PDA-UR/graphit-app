/**
 * Handels the start/stop of a loading spinner
 */
export class LoadingSpinner {

    private target: HTMLElement;

    constructor(){
        this.target = document.getElementById("ring") as HTMLElement;
    }

    /**
     * Start the spinner (call before awaiting results)
     */
    public start(){
        this.target.style.display = "inline-block";
    }

    /**
     * Stop the spinner (call after awaiting results)
     */
    public stop(){
        this.target.style.display = "none";
    }

}