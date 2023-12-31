/// <reference types="vite/client" />

declare module "cytoscape-expand-collapse" {
	const ext: cytoscape.Ext;
	export = ext;
}
declare module "cytoscape-layout-utilities";
declare module "cytoscape-cise";
declare const APP_VERSION: string;
/* // TEMPLATE
declare module 'cytoscape-layout-utilities' {
    const ext: cytoscape.Ext;
    export = ext;
} */

declare module "cytoscape-node-html-label";
declare module "cytoscape-select" {
	const cytoscape = cytoscape;
	export = cytoscape;
}
