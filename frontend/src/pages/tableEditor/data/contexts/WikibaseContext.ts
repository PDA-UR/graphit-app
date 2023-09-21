import { createContext } from "@lit-labs/context";
import WikibaseClient from "../../../../shared/WikibaseClient";

export const wikibaseContext = createContext<WikibaseClient>("wikibaseContext");
