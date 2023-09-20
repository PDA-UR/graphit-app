import { createContext } from "@lit-labs/context";
import { DragController } from "../../ui/controllers/DragController";

export const dragControllerContext =
	createContext<DragController>("dragController");
