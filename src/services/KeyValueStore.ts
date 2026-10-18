/** Minimal storage port so settings work without localStorage (private windows, tests). */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export class BrowserStore implements KeyValueStore {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage blocked: the setting simply lasts for this visit.
    }
  }
}

export class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, string>();

  get(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }
}
