# Frontend

This directory contains the frontend code.
You can add a subpage by creating a new folder in the `src/pages` directory and adding its to the vite config in `vite.config.ts`.

Frontend are mostly self-contained, with some shared functions (see: `frontend/src/shared`)

## TableEditor
  - `frontend/src/pages/tableEditor`
  - more info: see its `readme.md`
  - shows a tabular view of Wikibase items and their properties
  - allows logged in users to modify connections between items
  - allows admins to create items directly from the UI
  - a simple rights management is implemented

## SelectionTools or VisualEditor
  - `frontend/src/pages/selectionTools`
  - shows the the dependency graph of one course at a time
  - allows logged in users to modify their Wikibase User-Item to display *interest* or *existing knowledge*
  - shows information about items, such as descriptions, resources, learning paths and neighbors
  - graph visualization and interaction build with [cytoscape.js](https://js.cytoscape.org/)
  - initially build for a bachelor thesis (on selection tools for dependency graphs), then merged with [graphVis](#graphvis)

## LearneyClone
  - `frontend/src/pages/learneyClone`
  - a very simple frontend to preserve the data created for the learney project
  - runs with a static data file

## graphVis (Legacy)
  - `frontend/src/pages/graphVis`
  - old graph-visualization page (uses static data)
  - initially build for a bachelor thesis on graph visualization
      - merged into [selectionTools](#selectiontools-or-visualeditor) (e.g. learn path, styling, graph layouts)

## visTest (Legacy)
  - an old test page for cytoscape.js graph algorithms
  - runs with static data (`frontend/src/data/eimi.json`)

## Dev

To update the API client from the backend, run `update-api-client.sh`! This is necessary when you make changes to the backend.