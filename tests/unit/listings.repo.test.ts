import { describe, it, expect } from 'vitest';
import { getApprovedListings, insertPendingListing } from '../../src/lib/listings.repo';

function fakeClient(rows: any[]) {
  const calls: any = {};
  return {
    calls,
    from() {
      return {
        select() {
          return this;
        },
        eq(_col: string, val: string) {
          calls.statusFilter = val;
          return this;
        },
        order() {
          return Promise.resolve({ data: rows, error: null });
        },
        insert(payload: any) {
          calls.inserted = payload;
          return Promise.resolve({ error: null });
        },
      };
    },
  } as any;
}

describe('getApprovedListings', () => {
  it('queries only approved and returns rows', async () => {
    const client = fakeClient([{ id: '1', status: 'approved' }]);
    const rows = await getApprovedListings(client);
    expect(client.calls.statusFilter).toBe('approved');
    expect(rows).toHaveLength(1);
  });
});

describe('insertPendingListing', () => {
  it('inserts with status pending', async () => {
    const client = fakeClient([]);
    await insertPendingListing(client, {
      display_name: 'X',
      platform: 'onlyfans',
      handle: 'x',
      outbound_url: 'https://onlyfans.com/x',
      bio: '',
    });
    expect(client.calls.inserted.status).toBe('pending');
  });
});
