
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pb } from './pocketbase';
import { ClientResponseError } from 'pocketbase';

describe('PocketBase API Abstraction', () => {
    
    // We need to ensure we don't affect other tests, usually cleanup is handled by the framework 
    // but since pb is a singleton, we should be careful. 
    // However, the patch is applied globally in the module, so we are testing that global state.

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should inject friendly error message when connection fails (status 0)', async () => {
        // Mock fetch to simulate a network error (which results in status 0 in PB SDK)
        // Actually, PB SDK catches fetch errors and wraps them.
        // If fetch rejects, PB SDK makes a ClientResponseError with status 0.
        
        // We can spy on the internal send or just rely on fetch failure.
        // Let's mock fetch to fail.
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() => {
            return Promise.reject(new TypeError('Network request failed'));
        });

        // We expect the call to fail
        try {
            await pb.send('/api/collections/users/records', {});
            expect.fail('Should have thrown an error');
        } catch (err: any) {
            // Verify it's a ClientResponseError (or similar)
            // And mostly importantly, verify our message was injected
            expect(err.message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
            expect(err.response?.data?.message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
            expect(err.status).toBe(0);
        }
    });

    it('should pass through other errors (status != 0) untouched', async () => {
        // Mock fetch to return a 404
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ code: 404, message: 'Not Found', data: {} }), 
            { status: 404, statusText: 'Not Found' }
        ));

        try {
            await pb.send('/api/collections/users/records', {});
            expect.fail('Should have thrown 404');
        } catch (err: any) {
            expect(err.status).toBe(404);
            expect(err.message).not.toContain('Unable to connect');
            expect(err.message).toBe('Not Found');
        }
    });
});
