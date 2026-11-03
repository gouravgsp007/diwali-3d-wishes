// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback<T = any> = (data: T) => void;

export class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();

  public on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit<T>(event: string, data: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }
}

export const globalEventBus = new EventBus();
