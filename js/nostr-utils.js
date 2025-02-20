import { nip19 } from 'nostr-crypto-utils';

// List of relay APIs to try in order
const RELAY_APIS = [
    'https://api.primal.net/v1/profile/',
    'https://relay.damus.io/',
    'https://relay.snort.social/'
];

export class NostrProfileFetcher {
    constructor() {
        this.currentRelayIndex = 0;
    }

    async fetchProfile(npub) {
        const { data: pubkey } = nip19.decode(npub);
        const errors = [];

        // Try each relay in sequence until we get a successful response
        for (let i = 0; i < RELAY_APIS.length; i++) {
            try {
                const relayUrl = RELAY_APIS[this.currentRelayIndex];
                const response = await fetch(`${relayUrl}${pubkey}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Move to next relay for next request (round-robin)
                this.currentRelayIndex = (this.currentRelayIndex + 1) % RELAY_APIS.length;
                
                return this.normalizeProfileData(data);
            } catch (error) {
                errors.push(`Relay ${RELAY_APIS[this.currentRelayIndex]}: ${error.message}`);
                this.currentRelayIndex = (this.currentRelayIndex + 1) % RELAY_APIS.length;
            }
        }

        throw new Error(`Failed to fetch profile from all relays: ${errors.join(', ')}`);
    }

    normalizeProfileData(data) {
        // Handle different relay response formats
        const content = data.content || data;
        
        return {
            picture: content.picture ? this.getOptimizedImageUrl(content.picture) : null,
            displayName: content.display_name || content.name || 'Unknown',
            name: content.name || 'unknown',
            about: content.about || '',
            lightning: content.lud16 || content.lud06 || null,
            nip05: content.nip05 || null,
            banner: content.banner ? this.getOptimizedImageUrl(content.banner) : null,
            website: content.website || null
        };
    }

    getOptimizedImageUrl(url) {
        // Use Primal's CDN for better image loading
        return `https://primal.b-cdn.net/media-cache?s=m&a=1&u=${encodeURIComponent(url)}`;
    }
}

// Export singleton instance
export const nostrProfileFetcher = new NostrProfileFetcher();
