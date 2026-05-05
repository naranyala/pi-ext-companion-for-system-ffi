/**
 * The InternalBus service provides a simple event emitter for decoupled
 * communication between different features of the extension.
 */
export type BusEvent<T = any> = {
  type: string;
  payload: T;
};

export class InternalBus {
  private listeners: Map<string, Set<(payload: any) => Promise<void> | void>> = new Map();

  /**
   * Subscribe to a specific event type.
   */
  on<T>(type: string, listener: (payload: T) => Promise<void> | void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    
    // Return an unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /**
   * Emit an event to all registered listeners.
   */
  async emit<T>(type: string, payload: T): Promise<void> {
    const handlers = this.listeners.get(type);
    if (handlers) {
      await Promise.all(Array.from(handlers).map(handler => handler(payload)));
    }
  }
}
