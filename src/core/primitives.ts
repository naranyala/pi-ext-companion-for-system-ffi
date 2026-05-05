/**
 * Defines the core data structures and API schemas for the extension.
 */
import { Type } from "@sinclair/typebox";

// The shape of our persistent data in the store.
export interface AppState {
  sessionCount: number;
  todoList: string[];
}

// Schemas for our tool parameters.
export const GreetToolParams = Type.Object({
  message: Type.String({ description: "The greeting message to use." }),
});

export const TodoToolParams = Type.Object({
  action: Type.Enum({ add: "add", list: "list", clear: "clear" }),
  item: Type.Optional(Type.String({ description: "The content of the to-do item." })),
});

export const LongProcessToolParams = Type.Object({});
