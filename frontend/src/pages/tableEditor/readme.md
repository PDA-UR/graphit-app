# Table Editor

Table editor allows editing relationships between Wikibase items.

## Dev

Built using [lit.js](https://lit.dev/) (UI), [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction) (state management), and Typescript.

- Users can login using the Wikibase user-item and can modify items by dragging
- Items are dragged into columns, where you can select from a list of properties
- They can be moved (default) or copied between each other as statements
- Wikibase-Qualifiers don't carry over between items by default, but this can be enabled
- New Items can be created in the GUI, and will automatically link to the selected columns/items

### Rights Management
- Rights are managed using the graph structure itself. Any logged in user is being queried on their role (the class that they are an "instance of")
- Students can modify their own Wikibase user-item and items "included" in any course they "participate in" (those changes will add a qualifier to denote the student who made the changes)
- Admins can modify any items as well as create new items directly from the GUI

## Important Shortcuts and functionalities
- <kbd>CTRL</kbd>+<kbd>i</kbd> opens the infobox
- <kbd>CTRL</kbd>+<kbd>x</kbd> toggle between moving/copying items
- <kbd>CTRL</kbd>+<kbd>+</kbd> toggle "item creation" sidebar
- <kbd>Del</kbd> or <kbd>Backspace</kbd> removes a selected item
- <kbd>Shift</kbd> + *drag* will paste items

## Other Notes
- search is currently not fuzzy, as the base wikibase-search functionality does not support it either (as of Dez25)

### Match label
This is an option that can be used when creating an item to be added to a column. Open the "Create a new Item" Menu via the `>` button on the top left or <kbd>CTRL</kbd>+<kbd>+</kbd>.
- Uses a SPARQL query to match Regex Strings to item Labels in the database
  - [Documentation](https://en.wikibooks.org/wiki/SPARQL/Expressions_and_Functions#REGEX)
  - The regex is case insensitive, but requires escaping the "\" backslash
  - e.g. Find Items with "ER" at the start
    -  `^(er)\w+` **won't** work
    -  `^(er)\\w+` works
  - Escaping is done automatically in the frontend before making the API call, so no escaping is required in the GUI
-  The query is currently hardcoded (in the frontend) to return only the first 5 results, to save time and resources
