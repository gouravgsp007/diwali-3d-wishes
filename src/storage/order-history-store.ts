/**
 * OrderHistoryStore
 *
 * Provides persistent, zero-cost, privacy-first local storage for all custom wishes,
 * passcodes, and delivery links created by the Admin / Seller.
 *
 * Allows the seller to:
 * 1. Keep track of all generated passcodes across clients.
 * 2. Re-retrieve previously generated delivery URLs without regenerating.
 * 3. Export all client order data to a CSV spreadsheet (compatible with Excel & Google Sheets).
 */

export interface SavedOrderRecord {
  id: string;
  recipient: string;
  sender: string;
  occasion: string;
  passcode: string;
  shareUrl: string;
  musicChoice: string;
  createdAt: number;
}

export class OrderHistoryStore {
  private static readonly STORAGE_KEY = 'diwali_admin_saved_orders';

  public static getOrders(): SavedOrderRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public static saveOrder(
    order: Omit<SavedOrderRecord, 'id' | 'createdAt'> & { createdAt?: number }
  ): SavedOrderRecord {
    const existing = this.getOrders();
    const newRecord: SavedOrderRecord = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: order.createdAt || Date.now(),
      ...order,
    };
    const updated = [newRecord, ...existing];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save order to localStorage', err);
      }
    }
    return newRecord;
  }

  public static deleteOrder(id: string): void {
    const existing = this.getOrders();
    const updated = existing.filter((item) => item.id !== id);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update localStorage', err);
      }
    }
  }

  public static clearAll(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (err) {
        console.warn('Failed to clear localStorage', err);
      }
    }
  }

  public static exportToCsv(orders: SavedOrderRecord[] = this.getOrders()): string {
    const headers = [
      'Order ID',
      'Created Date (ISO)',
      'Recipient',
      'Sender',
      'Occasion',
      'Passcode',
      'Sound Choice',
      'Delivery URL',
    ];

    const sanitizeCell = (val: string): string => {
      let escaped = val.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(escaped)) {
        escaped = `'${escaped}`;
      }
      return `"${escaped}"`;
    };

    const rows = orders.map((o) => {
      const dateStr = new Date(o.createdAt).toISOString();
      return [
        o.id,
        dateStr,
        sanitizeCell(o.recipient),
        sanitizeCell(o.sender),
        sanitizeCell(o.occasion),
        sanitizeCell(o.passcode),
        sanitizeCell(o.musicChoice),
        sanitizeCell(o.shareUrl),
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  public static downloadCsv(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const csvContent = this.exportToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `wishes_orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
