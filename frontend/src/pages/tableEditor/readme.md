# Table Editor

Table editor allows editing relationships between wikibase items.

## Dev

Built using LIT-Elements (UI), Zustand (state management), and Typescript.

Users can log in using the Wikibase user-item and can modify items by dragging.
Items are dragged into columns, where you can select from a list of properties.
They can be moved (default) or copied between each other as statements .
Wikibase-Qualifiers don't carry over between items by default, but this can be enabled.


Rights are manged using the Wikibase user-groups that can be assigned/changed by an admin and accessed using the Mediawiki API (see: [Users](https://www.mediawiki.org/wiki/API:Users)). Students can only modify their own wikibase user-item.


## Shortcuts
- <kbd>CTRL+f</kbd> toggles sidebar
- <kbd>Del</kbd> or <kbd>Backspace</kbd> removes a selected item
- <kbd>Shift</kbd> + *drag* will paste items
- ... see: `ui/atomic/InfoBox.ts`