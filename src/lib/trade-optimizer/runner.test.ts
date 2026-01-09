import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTradeMatching, finalizeTradeMatching } from './runner';
import { pb } from '$lib/pocketbase';

// Mock PocketBase
vi.mock('$lib/pocketbase', () => {
    const collectionMock = {
        getFullList: vi.fn(),
        getOne: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
    };
    return {
        pb: {
            collection: vi.fn(() => collectionMock),
        },
    };
});

// Mock TradeMaximizer
vi.mock('./algorithm/trademax', () => {
    return {
        TradeMaximizer: class {
            run(inputFunc: any, outputFunc: any) {
                outputFunc(`
TRADE CHAINS:
*** CHAIN 1
alice_id receives sub2 from bob_id
bob_id receives sub1 from alice_id
`, true);
            }
        }
    };
});

describe('Trade Matching Runner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('runTradeMatching creates draft trades and context', async () => {
        const partyId = 'party123';
        const mockParty = { id: partyId, status: 'approved', organizer: 'org1', name: 'Test Party' };
        const mockSubmissions = [
            { id: 'sub1', title: 'Wingspan', user: 'alice_id', expand: { user: { id: 'alice_id' } } },
            { id: 'sub2', title: 'Gloomhaven', user: 'bob_id', expand: { user: { id: 'bob_id' } } },
        ];

        const collectionMock = pb.collection('any') as any;
        collectionMock.getOne.mockResolvedValue(mockParty);
        collectionMock.getFullList.mockResolvedValue(mockSubmissions);
        collectionMock.create.mockImplementation(async (data: any) => ({
            id: 'mock_trade_id',
            ...data
        }));

        await runTradeMatching(partyId);

        // Verify trades created as drafts
        expect(collectionMock.create).toHaveBeenCalledWith(expect.objectContaining({
            is_draft: true,
            seller: 'alice_id',
            buyer: 'bob_id'
        }), expect.anything());

        // Verify context created
        expect(collectionMock.create).toHaveBeenCalledWith(expect.objectContaining({
            party: partyId,
            is_draft: true,
        }), expect.anything());

        // Verify party status updated to preview
        expect(collectionMock.update).toHaveBeenCalledWith(partyId, expect.objectContaining({
            status: 'matching_preview'
        }));
    });

    it('finalizeTradeMatching converts drafts to permanent', async () => {
        const partyId = 'party123';
        const mockParty = { id: partyId, name: 'Test Party', organizer: 'org1' };
        const mockContext = [
            { id: 'ctx1', trade: 'trade1', is_draft: true, expand: { trade: { id: 'trade1', seller: 'alice_id', buyer: 'bob_id' } } },
        ];

        const collectionMock = pb.collection('any') as any;
        collectionMock.getOne.mockResolvedValue(mockParty);
        collectionMock.getFullList.mockResolvedValue(mockContext);

        await finalizeTradeMatching(partyId);

        // Verify trades updated to non-draft
        expect(collectionMock.update).toHaveBeenCalledWith('trade1', { is_draft: false }, expect.anything());

        // Verify context updated
        expect(collectionMock.update).toHaveBeenCalledWith('ctx1', { is_draft: false }, expect.anything());

        // Verify party status
        expect(collectionMock.update).toHaveBeenCalledWith(partyId, expect.objectContaining({
            status: 'execution'
        }));
    });
});
