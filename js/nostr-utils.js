// Nostr Profile Fetcher with Round-Robin Relay Support
import { decodeNpub } from './nostr-bech32.js';
import { NostrWebSocket } from './nostr-websocket.js';

console.log('Loading nostr-utils.js');

export const nostrProfileFetcher = {
    relays: [
        'wss://relay.damus.io',
        'wss://relay.snort.social',
        'wss://nos.lol'
    ],
    currentRelayIndex: 0,
    relayConnections: new Map(),
    activeSubscriptions: new Map(),

    async fetchProfile(npub) {
        console.log('fetchProfile() called with npub:', npub);
        let lastError = null;
        
        // Try each relay in sequence
        for (let i = 0; i < this.relays.length; i++) {
            const relay = this.relays[this.currentRelayIndex];
            console.log(`Attempting relay ${i + 1}/${this.relays.length}:`, relay);
            
            try {
                const profile = await this.fetchFromRelay(npub, relay);
                if (profile) {
                    console.log('Successfully fetched profile from relay:', relay);
                    return this.normalizeProfileData(profile);
                }
            } catch (error) {
                console.warn(`Failed to fetch from relay ${relay}:`, error);
                lastError = error;
                // Move to next relay
                this.currentRelayIndex = (this.currentRelayIndex + 1) % this.relays.length;
            }
        }
        
        // If we get here, all relays failed
        console.error('All relays failed to fetch profile');
        throw new Error('Failed to fetch profile from all relays: ' + lastError?.message);
    },
    
    async fetchFromRelay(npub, relay) {
        console.log('fetchFromRelay() called with npub:', npub);
        console.log('Using relay:', relay);
        
        try {
            console.log('Decoding npub...');
            const pubkey = decodeNpub(npub);
            if (!pubkey) {
                throw new Error('Invalid npub format');
            }
            console.log('Decoded pubkey:', pubkey);
            
            // Get or create WebSocket connection
            let ws = this.relayConnections.get(relay);
            if (!ws) {
                ws = new NostrWebSocket(relay);
                this.relayConnections.set(relay, ws);
            }
            
            // Generate a unique subscription ID for this request
            const subId = `profile-${pubkey}-${Date.now()}`;
            
            // Cleanup any existing subscription for this pubkey
            const existingSubId = Array.from(this.activeSubscriptions.keys())
                .find(id => id.startsWith(`profile-${pubkey}`));
            
            if (existingSubId) {
                const existingUnsub = this.activeSubscriptions.get(existingSubId);
                if (typeof existingUnsub === 'function') {
                    existingUnsub();
                }
                this.activeSubscriptions.delete(existingSubId);
            }
            
            // Create a promise that will resolve with the profile data
            const profilePromise = new Promise((resolve, reject) => {
                let timeout = setTimeout(() => {
                    this.activeSubscriptions.delete(subId);
                    reject(new Error('Timeout waiting for profile'));
                }, 5000);
                
                const unsubscribe = ws.subscribe([
                    {
                        kinds: [0],
                        authors: [pubkey]
                    }
                ], (message) => {
                    if (message[0] === 'EVENT' && message[2].kind === 0) {
                        clearTimeout(timeout);
                        try {
                            const content = JSON.parse(message[2].content);
                            resolve(content);
                            // Cleanup after successful fetch
                            if (typeof unsubscribe === 'function') {
                                unsubscribe();
                            }
                            this.activeSubscriptions.delete(subId);
                        } catch (error) {
                            reject(new Error('Invalid profile data'));
                        }
                    } else if (message[0] === 'EOSE') {
                        clearTimeout(timeout);
                        reject(new Error('Profile not found'));
                    }
                });
                
                // Store the unsubscribe function with the subscription ID
                if (typeof unsubscribe === 'function') {
                    this.activeSubscriptions.set(subId, unsubscribe);
                }
            });
            
            const profile = await profilePromise;
            return profile;
            
        } catch (error) {
            console.error('Error in fetchFromRelay:', error);
            throw error;
        }
    },
    
    normalizeProfileData(rawProfile) {
        console.log('normalizeProfileData() called with:', rawProfile);
        // Extract common fields and normalize them
        const normalized = {
            name: rawProfile.name || null,
            displayName: rawProfile.display_name || rawProfile.name || 'Anonymous',
            about: rawProfile.about || rawProfile.description || null,
            picture: this.validateImageUrl(rawProfile.picture || rawProfile.avatar || rawProfile.image),
            nip05: rawProfile.nip05 || null,
            lightning: rawProfile.lightning || rawProfile.lud16 || null,
            website: this.validateUrl(rawProfile.website || rawProfile.url || null)
        };
        console.log('Normalized profile data:', normalized);
        return normalized;
    },
    
    validateImageUrl(url) {
        console.log('validateImageUrl() called with:', url);
        if (!url) return null;
        try {
            const parsed = new URL(url);
            return parsed.toString();
        } catch (error) {
            console.warn('Invalid image URL:', error);
            return null;
        }
    },
    
    validateUrl(url) {
        console.log('validateUrl() called with:', url);
        if (!url) return null;
        try {
            const parsed = new URL(url);
            return parsed.toString();
        } catch (error) {
            console.warn('Invalid URL:', error);
            return null;
        }
    },
    
    // Cleanup method to be called when navigating away or closing
    cleanup() {
        for (const [_, unsubscribe] of this.activeSubscriptions) {
            unsubscribe();
        }
        this.activeSubscriptions.clear();
        
        for (const [_, ws] of this.relayConnections) {
            ws.close();
        }
        this.relayConnections.clear();
    }
};
