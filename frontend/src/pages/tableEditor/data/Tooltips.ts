/**
 * Collection of all tooltips for the page.
 * Loaded after all elements are rendered by getting the html-element of the defined id
 * Simply add to the list with the id of the html-element the tooltips attaches to.
 */
export const TOOLTIPS : {[id:string]: string} = 
{
    "sidebar-toggle": "Toggle Sidebar (CTRL+f)",
    "info-toggle": "Toggle Info (CTRL+i)",
    "darkmode-toggle": "Toggle dark/light mode",
    "drag-toggle": "Change item drag-behavior (CTRL+x)",
    "qualifier-toggle": "Toggle qualifiers (CTRL+q)",
    "admin-rights-false": "Students can only modify their personal user item",
    "admin-rights-true": "Admins can modify any items",
}