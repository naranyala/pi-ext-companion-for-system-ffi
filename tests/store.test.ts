import { describe, expect, it, beforeEach } from "bun:test";
import { Store } from "../src/core/store";
import { createMockApi } from "./mocks";
import { STORE_KEY } from "../src/core/constants";

describe("Core Service: Store", () => {
  let api: ReturnType<typeof createMockApi>;
  const initialState = { sessionCount: 0, todoList: [] };

  beforeEach(() => {
    api = createMockApi();
  });

  it("should initialize with the provided initial state", () => {
    const store = new Store(api, initialState);
    expect(store.get()).toEqual(initialState);
  });

  it("should load state from the api entries", async () => {
    const prevState = { sessionCount: 5, todoList: ["old item"] };
    api.__unstable_getRegistry().entries.push({
      type: "extension_state",
      key: STORE_KEY,
      value: prevState,
    });
    
    const store = new Store(api, initialState);
    await store.load();

    expect(store.get()).toEqual(prevState);
  });

  it("should save the current state to the api", async () => {
    const store = new Store(api, initialState);
    const newState = { sessionCount: 1, todoList: ["new item"] };
    await store.update(newState);
    
    const { entries } = api.__unstable_getRegistry();
    expect(entries.length).toBe(1);
    expect(entries[0].key).toBe(STORE_KEY);
    expect(entries[0].value).toEqual(newState);
  });
});
