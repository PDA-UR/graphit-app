// Via: https://stackoverflow.com/a/55202728 und
// Via: https://stackoverflow.com/a/70108281

export function dragSpacer(element: HTMLElement, cy: cytoscape.Core, pathCy: cytoscape.Core) {

    const container = document.getElementById("path-container") as HTMLElement;

    element.onmousedown = onMouseDown;

    function onMouseDown(e:MouseEvent)
    {
        document.onmousemove = onMouseMove;
        document.onmouseup = () => {
            document.onmousemove = document.onmouseup = null;
            cy.elements().selectify()
            pathCy.panningEnabled(true)
        }
    }

    function onMouseMove(e:MouseEvent)
    {
        cy.elements().unselectify()
        pathCy.panningEnabled(false)
        e.stopPropagation

        let xPercent = ((innerWidth-e.clientX) / window.innerWidth) * 100
        container.style.width = xPercent + "%";
    }
}