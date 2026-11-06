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
  private static readonly WEBHOOK_KEY = 'diwali_admin_cloud_webhook';

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

    // Background cloud sync to Google Sheets webhook if configured
    const webhook = this.getCloudWebhookUrl();
    if (webhook) {
      this.syncOrderToCloud(newRecord, webhook).catch(() => {});
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

  public static exportToCsv(
    orders: SavedOrderRecord[] = this.getOrders(),
    includeBom: boolean = true
  ): string {
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
        sanitizeCell(o.id),
        dateStr,
        sanitizeCell(o.recipient),
        sanitizeCell(o.sender),
        sanitizeCell(o.occasion),
        sanitizeCell(o.passcode),
        sanitizeCell(o.musicChoice),
        sanitizeCell(o.shareUrl),
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    return includeBom ? '\uFEFF' + csvContent : csvContent;
  }

  public static downloadCsv(filename?: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const csvContent = this.exportToCsv(this.getOrders(), true);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      filename || `wishes_orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static exportToJson(): string {
    return JSON.stringify(this.getOrders(), null, 2);
  }

  public static downloadJsonBackup(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const jsonContent = this.exportToJson();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `wishes_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static importFromJson(jsonString: string): { importedCount: number; newTotal: number } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return { importedCount: 0, newTotal: this.getOrders().length };
      const current = this.getOrders();
      const currentIds = new Set(current.map((o) => o.id));
      const validNewRecords: SavedOrderRecord[] = [];
      for (const item of parsed) {
        if (item && typeof item === 'object' && item.recipient && item.passcode) {
          const id = item.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          if (!currentIds.has(id)) {
            validNewRecords.push({
              id,
              recipient: String(item.recipient || ''),
              sender: String(item.sender || ''),
              occasion: String(item.occasion || 'diwali'),
              passcode: String(item.passcode || ''),
              shareUrl: String(item.shareUrl || ''),
              musicChoice: String(item.musicChoice || 'track1'),
              createdAt: Number(item.createdAt) || Date.now(),
            });
            currentIds.add(id);
          }
        }
      }
      const merged = [...validNewRecords, ...current].sort((a, b) => b.createdAt - a.createdAt);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      }
      return { importedCount: validNewRecords.length, newTotal: merged.length };
    } catch {
      return { importedCount: 0, newTotal: this.getOrders().length };
    }
  }

  public static getCloudWebhookUrl(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(this.WEBHOOK_KEY) || '';
  }

  public static setCloudWebhookUrl(url: string): void {
    if (typeof localStorage === 'undefined') return;
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(this.WEBHOOK_KEY, trimmed);
    } else {
      localStorage.removeItem(this.WEBHOOK_KEY);
    }
  }

  public static async syncOrderToCloud(
    order: SavedOrderRecord,
    webhookUrl: string = this.getCloudWebhookUrl()
  ): Promise<{ success: boolean; error?: string }> {
    if (!webhookUrl) {
      return { success: false, error: 'No webhook URL configured' };
    }
    try {
      if (typeof fetch === 'undefined') {
        return { success: false, error: 'Fetch API unavailable' };
      }
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(order),
      });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  public static async syncAllOrdersToCloud(
    webhookUrl: string = this.getCloudWebhookUrl()
  ): Promise<{ success: boolean; count: number; error?: string }> {
    const orders = this.getOrders();
    if (!webhookUrl) {
      return { success: false, count: 0, error: 'No webhook URL configured' };
    }
    if (orders.length === 0) {
      return { success: true, count: 0 };
    }
    let synced = 0;
    for (const order of orders) {
      const res = await this.syncOrderToCloud(order, webhookUrl);
      if (res.success) synced++;
    }
    return { success: true, count: synced };
  }

  public static getGoogleAppsScriptTemplate(): string {
    return `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Order ID",
        "Timestamp (ISO)",
        "Occasion",
        "Recipient Name",
        "Sender Name",
        "Secret Passcode",
        "Sound Choice",
        "Delivery URL"
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#FFF3CD");
    }
    var data = JSON.parse(e.postData.contents);
    function sanitizeCell(val) {
      var s = String(val || '');
      return /^[=+\\-@\\t\\r]/.test(s) ? ("'" + s) : s;
    }
    sheet.appendRow([
      sanitizeCell(data.id || ("ord_" + new Date().getTime())),
      new Date(data.createdAt || Date.now()).toISOString(),
      sanitizeCell(data.occasion),
      sanitizeCell(data.recipient),
      sanitizeCell(data.sender),
      sanitizeCell(data.passcode),
      sanitizeCell(data.musicChoice),
      sanitizeCell(data.shareUrl)
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
}
