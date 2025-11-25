// Via: https://stackoverflow.com/a/55202728 und
// Via: https://stackoverflow.com/a/70108281

// EVTL.: disable Events for Nodes while dragging
    // Mouse over node while dragging selects elements (blue)

export function dragElement(element: HTMLElement, direction:string) {

    var md: any; // remember mouse down info
    const first  = document.getElementById("graph") as HTMLElement;
    const second = document.getElementById("view") as HTMLElement;
    const top = document.getElementById("info-container") as HTMLElement;
    const bottom = document.getElementById("path") as HTMLElement;

    element.onmousedown = onMouseDown;

    function onMouseDown(e:MouseEvent)
    {
        //console.log("mouse down: " + e.clientX);
        md = {e,
              offsetLeft:   element.offsetLeft,
              offsetTop:    element.offsetTop,
              firstWidth:   first.offsetWidth,
              secondWidth:  second.offsetWidth,
              topHeight:    top.offsetHeight,
              bottomHeight: bottom.offsetHeight,
            };

        document.onmousemove = onMouseMove;
        document.onmouseup = () => {
            //console.log("mouse up");
            document.onmousemove = document.onmouseup = null;
        }
    }

    function onMouseMove(e:MouseEvent)
    {
        // console.log("mouse move: " + e.clientX);
        var delta = {x: e.clientX - md.e.clientX,
                     y: e.clientY - md.e.clientY};

        if (direction === "H" ) // Horizontal
        {
            // Prevent negative-sized elements
            delta.x = Math.min(Math.max(delta.x, -md.firstWidth),
                       md.secondWidth);

            element.style.left = md.offsetLeft + delta.x + "px";
            first.style.width = (md.firstWidth + delta.x) + "px";
            second.style.width = (md.secondWidth - delta.x) + "px";
        }
        else if (direction === "V") // Vertical
        {        
            // Prevent negative-sized elements
            delta.x = Math.min(Math.max(delta.y, -md.topHeight),
                md.bottomHeight);

            element.style.top = md.offsetTop + delta.x + "px";
            top.style.height = (md.topHeight + delta.x) + "px";
            bottom.style.height = (md.bottomHeight - delta.x) + "px";
        }

    }
}

/* ELEMENTS CURRENTLY

--FIRST-- --SECOND--
|       | |  TOP   |
| FIRST | |--------|
|       | | BOTTOM |

*/


// Problem with undefined elements
/*export class Splitter {

    private readonly left: HTMLElement;
    private readonly right: HTMLElement;
    private readonly dragger: HTMLElement;
    private readonly direction: any;
    private md: any; // remember mouse info

    constructor(element: HTMLElement, direction: any){
        this.left = document.getElementById("graph") as HTMLElement;
        this.right = document.getElementById("view") as HTMLElement;
        this.dragger = document.getElementById("separator") as HTMLElement;;
        this.direction = direction;
        // this.dragger = document.getElementById("separator") as HTMLElement;
        this.dragger.onmousedown = this.onMouseDown;
        console.log(this.left, this.dragger)
    }


    private onMouseDown(e:MouseEvent) {
        console.log("mouse down: " + e.clientX);
        this.md = {e,
            offsetLeft:  this.dragger.offsetLeft,
            offsetTop:   this.dragger.offsetTop,
            firstWidth:  this.left.offsetWidth,
            secondWidth: this.right.offsetWidth
        };

        document.onmousemove = this.onMouseMove;
        document.onmouseup = () => {
            //console.log("mouse up");
            document.onmousemove = document.onmouseup = null;
        }
    }

    private onMouseMove(e:MouseEvent){
        //console.log("mouse move: " + e.clientX);
        var delta = {x: e.clientX - this.md.e.clientX,
            y: e.clientY - this.md.e.clientY};

        if (this.direction === "H" ) // Horizontal
        {
        // Prevent negative-sized elements
        delta.x = Math.min(Math.max(delta.x, -this.md.firstWidth),
            this.md.secondWidth);

        this.dragger.style.left = this.md.offsetLeft + delta.x + "px";
        this.left.style.width = (this.md.firstWidth + delta.x) + "px";
        this.right.style.width = (this.md.secondWidth - delta.x) + "px";
        }
    }


} */