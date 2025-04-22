# Visual Editor

The visual editor allows users to view a dependency graph of a course (as defined by the GraphIT-project).
They can explore the items of the graph and their relationships, as well as mark items they are *interested in* or *have completed*. This will modify their Wikibase User-Item.

The graph is visualized using [cytoscape.js](https://js.cytoscape.org/). 


## The Graph
A displayed graph contains all items, that are *included* a in *Session* of a *Course*, as defined by the GraphIT-project.

    [COURSE] --includes-> [SESSION] --includes-> [ITEM]


For a more in depth explanation on the graph structure see: [Quick Intro](https://graphit.ur.de/wiki/Quick_Overview) or [Graph Structure](https://graphit.ur.de/wiki/GraphStructure).

The graph is pulled via a SPARQL-Query and then parsed into a readable format for the visualization using *cytoscape.js*

## The Frontends

#### Visual Editor
- in `frontend\selectionTools`
Shows the the dependency graph of one course at a time and allows logged in users to modify their Wikibase User-Item to display *interest* or *existing knowledge* about learning contents discussed in a course.


#### Table Editor
- in `frontend\tableEditor`
Shows a tabular view of different Items of the dependency graph and their properties (or edges). It allows logged in users to modify connections between items.


#### Learney Clone
- in `frontend\learneyClone`
A simple clone of the graph created for the discontinued [Learney](https://web.archive.org/web/20230602185637/https://learney.me/) project to allow interaction with the collected data and resources.


#### GraphVis
- in `frontend\graphVis`
A very early and simple test-suit for graph layouts and visualizations created with [cytoscape.js](https://js.cytoscape.org/)