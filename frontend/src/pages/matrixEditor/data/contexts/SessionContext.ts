import { createContext } from "@lit-labs/context";

export interface SessionActions {
	logout: () => void;
}

export const sessionContext = createContext<SessionActions>("wikibaseContext");
