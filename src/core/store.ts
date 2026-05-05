/**
 * The Store service handles all persistent state management.
 * It abstracts away the logic of reading from and writing to Pi's history.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { AppState } from "./primitives";
import { STORE_KEY } from "./constants";

export class Store {
  private state: AppState;

  constructor(private readonly api: ExtensionAPI, initialState: AppState) {
    this.state = initialState;
  }

  /**
   * Loads the most recent state from Pi's history.
   * Should be called once during the 'session_start' event.
   */
  async load(): Promise<void> {
    const entries = (this.api as any).getEntries?.() || [];
    const lastStateEntry = [...entries]
      .reverse()
      .find(e => e.type === "extension_state" && e.key === STORE_KEY);

    if (lastStateEntry) {
      this.state = { ...this.state, ...lastStateEntry.value };
    }
  }

  /**
   * Persists the entire current state to Pi's history.
   */
  async save(): Promise<void> {
    (this.api as any).appendEntry?.({
      type: "extension_state",
      key: STORE_KEY,
      value: this.state,
    });
  }

  /**
   * Updates a part of the state and immediately persists the change.
   */
  async update(patch: Partial<AppState>): Promise<void> {
    this.state = { ...this.state, ...patch };
    await this.save();
  }

  /**
   * Returns a copy of the current in-memory state.
   */
  get(): AppState {
    return { ...this.state };
  }
}
