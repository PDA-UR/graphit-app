import WikibaseClient from "../../../../shared/WikibaseClient";

/**
 * Pre-select a users most current course that they participate in,
 * otherwise uses the course selected by default
 */
export class PreselectCourseController {

    private readonly $container: HTMLDivElement;
    private readonly userInfo: any;
    private readonly client: WikibaseClient;
    private readonly $menu: HTMLSelectElement;
    private courseQID: string = "Q932" // failsave

    constructor(client: WikibaseClient) {
        this.$container = document.getElementById("pre-course-select") as HTMLDivElement;
        this.$menu = document.getElementById("switch-course") as HTMLSelectElement;
        this.client = client;
        this.courseQID = this.getDefaultCourse();
    }

    /**
     * Query the courses taken by the current user and compute the most current one
    */
    private async queryCoursesTaken() {
        const result = await this.client.getCoursesTaken();
        
        if (Object.keys(result).length != 0) {
            let course =  this.findCurrentCourse(result);
            if (course != "") this.courseQID = course;    
        }

        console.log("current course", this.courseQID);
        this.$menu.value = this.courseQID;
    }

    /**
     * Get the most recent course a student currently "participates in"
     * @param result the query result of all "participated" courses
     * @returns the QID of the most recent course (by year and term)
     */
    private findCurrentCourse(result:any) {
        let course:string = "";
        let currYear: number;
        let currTerm: string = "";

        result.forEach((obj:any) => {
            const label = obj.courseLabel.value as string;
            
            const regexYear = /\d+/g;
            const regexTerm = /(WS)|(SS)/g;
            const foundYears = label.match(regexYear) as RegExpMatchArray;
            const foundTerms = label.match(regexTerm) as RegExpMatchArray;;
            const term = foundTerms[0];
            
            // if more than 1 year, take the bigger one (e.g. 24 for 23/24 WS)
            let year:number = 0;
            foundYears.forEach((y:any) => {
                y = parseInt(y);
                if (year == 0 || y > year) year = y;
            });

            // compare the year and term of each course
            if (course == "" 
                || year > currYear 
                || (year == currYear && term == "WS") // winter later than summer
            ) {
                // override currentCourse
                course = obj.courseId.value;
                currYear = year;
                currTerm = term;
            }
        });
        return course;

    }

    public async getCurrentCourse(){
        await this.queryCoursesTaken();
        return this.courseQID;
    }

    /**
     * Get the qid (e.g. Q926) of the default course,
     * i.e. the course, that is preselected in the dropdown menu (see: selectionTools/index.html)
     * @returns the qid as a string
     */
    private getDefaultCourse() {
        return this.$menu.selectedOptions[0].value as string;
    }

}