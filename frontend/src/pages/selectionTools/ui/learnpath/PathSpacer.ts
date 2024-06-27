// Via: https://stackoverflow.com/a/55202728 und
// Via: https://stackoverflow.com/a/70108281

export function dragSpacer(element: HTMLElement, cy: cytoscape.Core, pathCy: cytoscape.Core) {

    const container = document.getElementById("path-container") as HTMLElement;
    const pane = document.getElementById("experiment-app") as HTMLDivElement;

    element.onmousedown = onMouseDown;

    function onMouseDown(e:MouseEvent)
    {
        document.onmousemove = onMouseMove;
        document.onmouseup = () => {
            document.onmousemove = document.onmouseup = null;

            // re-enable events after dragging stopped
            cy.elements().selectify()
            pathCy.panningEnabled(true)
            pathCy.boxSelectionEnabled(false)
            pane.style.pointerEvents = "auto"
        }
    }

    function onMouseMove(e:MouseEvent)
    {
        // disable events while dragging
        cy.elements().unselectify()
        pathCy.panningEnabled(false)
        pathCy.boxSelectionEnabled(false)
        e.stopPropagation
        pane.style.pointerEvents = "none"
        

        let xPercent = ((innerWidth-e.clientX) / window.innerWidth) * 100
        container.style.width = xPercent + "%";
    }
}