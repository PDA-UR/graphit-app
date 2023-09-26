import { createContext } from "@lit-labs/context";
import { SelectionController } from "../../ui/controllers/SelectionController";

export const selectionControllerContext = createContext<SelectionController>(
	"selectionControllerContext"
);
