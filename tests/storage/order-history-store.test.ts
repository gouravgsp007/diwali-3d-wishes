import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderHistoryStore } from '../../src/storage/order-history-store';

describe('OrderHistoryStore Local Passcode and Order Tracker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with an empty order list', () => {
    expect(OrderHistoryStore.getOrders()).toEqual([]);
  });

  it('saves an order with generated id, timestamp, recipient, and secret passcode', () => {
    const saved = OrderHistoryStore.saveOrder({
      recipient: 'Aarav',
      sender: 'Pooja',
      occasion: 'diwali',
      passcode: 'DIYA2026',
      shareUrl: 'https://diwali.app/#d=token123',
      musicChoice: 'track1',
    });

    expect(saved.id).toBeDefined();
    expect(saved.recipient).toBe('Aarav');
    expect(saved.sender).toBe('Pooja');
    expect(saved.occasion).toBe('diwali');
    expect(saved.passcode).toBe('DIYA2026');
    expect(saved.shareUrl).toBe('https://diwali.app/#d=token123');

    const orders = OrderHistoryStore.getOrders();
    expect(orders.length).toBe(1);
    expect(orders[0].passcode).toBe('DIYA2026');
  });

  it('prepends latest orders in descending chronological order', () => {
    OrderHistoryStore.saveOrder({
      recipient: 'Order 1',
      sender: 'Seller',
      occasion: 'birthday',
      passcode: 'CAKE1',
      shareUrl: 'https://diwali.app/?theme=birthday#d=1',
      musicChoice: 'track1',
      createdAt: 1000,
    });

    OrderHistoryStore.saveOrder({
      recipient: 'Order 2',
      sender: 'Seller',
      occasion: 'wedding',
      passcode: 'RING2',
      shareUrl: 'https://diwali.app/?theme=wedding#d=2',
      musicChoice: 'track2',
      createdAt: 2000,
    });

    const orders = OrderHistoryStore.getOrders();
    expect(orders.length).toBe(2);
    expect(orders[0].recipient).toBe('Order 2');
    expect(orders[0].passcode).toBe('RING2');
    expect(orders[1].recipient).toBe('Order 1');
  });

  it('deletes an order by id and allows clearing all orders', () => {
    const o1 = OrderHistoryStore.saveOrder({
      recipient: 'Rohan',
      sender: 'Kavita',
      occasion: 'newyear',
      passcode: 'NY2026',
      shareUrl: 'https://diwali.app/?theme=newyear#d=3',
      musicChoice: 'track3',
    });

    const o2 = OrderHistoryStore.saveOrder({
      recipient: 'Ananya',
      sender: 'Vikram',
      occasion: 'diwali',
      passcode: 'LIGHT',
      shareUrl: 'https://diwali.app/#d=4',
      musicChoice: 'custom',
    });

    expect(OrderHistoryStore.getOrders().length).toBe(2);

    OrderHistoryStore.deleteOrder(o1.id);
    const afterDelete = OrderHistoryStore.getOrders();
    expect(afterDelete.length).toBe(1);
    expect(afterDelete[0].id).toBe(o2.id);

    OrderHistoryStore.clearAll();
    expect(OrderHistoryStore.getOrders().length).toBe(0);
  });

  it('exports orders as a formatted CSV spreadsheet string with headers', () => {
    OrderHistoryStore.saveOrder({
      recipient: 'Simran "Sim" Kaur',
      sender: 'Raj',
      occasion: 'diwali',
      passcode: 'DIYA88',
      shareUrl: 'https://diwali.app/#d=abc',
      musicChoice: 'track1',
      createdAt: 1730635200000,
    });

    const csv = OrderHistoryStore.exportToCsv();
    expect(csv).toContain('Order ID,Created Date (ISO),Recipient,Sender,Occasion,Passcode,Sound Choice,Delivery URL');
    expect(csv).toContain('"Simran ""Sim"" Kaur"');
    expect(csv).toContain('"DIYA88"');
    expect(csv).toContain('"https://diwali.app/#d=abc"');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('exports and restores orders via JSON backup without duplicates', () => {
    OrderHistoryStore.saveOrder({
      recipient: 'Rohit',
      sender: 'Neha',
      occasion: 'diwali',
      passcode: 'ROHIT26',
      shareUrl: 'https://diwali.app/#d=test1',
      musicChoice: 'track1',
    });

    const json = OrderHistoryStore.exportToJson();
    expect(json).toContain('ROHIT26');

    // Clear local storage to simulate new device
    localStorage.clear();
    expect(OrderHistoryStore.getOrders().length).toBe(0);

    const importRes = OrderHistoryStore.importFromJson(json);
    expect(importRes.importedCount).toBe(1);
    expect(OrderHistoryStore.getOrders().length).toBe(1);
    expect(OrderHistoryStore.getOrders()[0].recipient).toBe('Rohit');

    // Re-importing same data ignores duplicates
    const duplicateImport = OrderHistoryStore.importFromJson(json);
    expect(duplicateImport.importedCount).toBe(0);
    expect(duplicateImport.newTotal).toBe(1);
  });

  it('configures Google Sheets cloud webhook URL and syncs orders', async () => {
    expect(OrderHistoryStore.getCloudWebhookUrl()).toBe('');

    OrderHistoryStore.setCloudWebhookUrl('https://script.google.com/macros/s/test-webhook/exec');
    expect(OrderHistoryStore.getCloudWebhookUrl()).toBe('https://script.google.com/macros/s/test-webhook/exec');

    const template = OrderHistoryStore.getGoogleAppsScriptTemplate();
    expect(template).toContain('SpreadsheetApp.getActiveSpreadsheet()');
    expect(template).toContain('doPost(e)');

    // Mock fetch for sync test
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"success"}'));
    globalThis.fetch = fetchMock;

    try {
      const order = OrderHistoryStore.saveOrder({
        recipient: 'Kavita',
        sender: 'Aman',
        occasion: 'birthday',
        passcode: 'AMAN123',
        shareUrl: 'https://diwali.app/?theme=birthday#d=test2',
        musicChoice: 'track2',
      });

      expect(fetchMock).toHaveBeenCalled();
      const syncRes = await OrderHistoryStore.syncOrderToCloud(order);
      expect(syncRes.success).toBe(true);

      const syncAllRes = await OrderHistoryStore.syncAllOrdersToCloud();
      expect(syncAllRes.success).toBe(true);
      expect(syncAllRes.count).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
