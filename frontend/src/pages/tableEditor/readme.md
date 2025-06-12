# Table Editor

Table editor allows editing relationships between wikibase items.

## Dev

Built using LIT-Elements (UI), Zustand (state management), and Typescript.

Users can log in using the Wikibase user-item and can modify items by dragging.
Items are dragged into columns, where you can select from a list of properties.
They can be moved (default) or copied between each other as statements .
Wikibase-Qualifiers don't carry over between items by default, but this can be enabled.


Rights are managed using the graph structure itself. Any logged in user is being queried on their role (the class that they are an "instance of").
Students can modify their own wikibase user-item and items "included" in any course they "participate in" (those changes will add a qualifier to denote the student who made the changes).


## Shortcuts
- <kbd>CTRL+f</kbd> toggles sidebar
- <kbd>Del</kbd> or <kbd>Backspace</kbd> removes a selected item
- <kbd>Shift</kbd> + *drag* will paste items
- ... see: `ui/atomic/InfoBox.ts`