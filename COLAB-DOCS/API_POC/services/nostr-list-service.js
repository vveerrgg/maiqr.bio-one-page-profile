const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class NostrListService {
  constructor(config) {
    this.config = config;
  }

  /**
   * Fetches recent list events for a given npub
   * @param {string} npub - The user's npub
   * @param {Array<string>} relays - List of relays to query
   * @param {number} sinceUnix - Unix timestamp to fetch events since
   * @returns {Promise<Array>} Array of list events
   */
  async fetchUserLists(npub, relays, sinceUnix) {
    const oneYearAgo = sinceUnix || Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    
    // Convert npub to hex pubkey if needed
    const pubkey = npub.startsWith('npub1') ? 
      this.npubToHex(npub) : 
      npub;

    const filter = {
      authors: [pubkey],
      kinds: [30001, 30003], // Generic lists and linktr-nostr lists
      since: oneYearAgo
    };

    return this.queryRelays(relays, filter);
  }

  /**
   * Query multiple relays for events
   * @param {Array<string>} relays - List of relay URLs
   * @param {Object} filter - Nostr filter object
   * @returns {Promise<Array>} Combined unique events from all relays
   */
  async queryRelays(relays, filter) {
    const events = new Map();
    
    await Promise.all(relays.map(async (relay) => {
      try {
        const ws = new WebSocket(relay);
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            resolve([]); // Timeout, but don't fail completely
          }, 5000); // 5 second timeout

          ws.onopen = () => {
            const subId = Math.random().toString(36).substring(2);
            ws.send(JSON.stringify(["REQ", subId, filter]));
          };

          ws.onmessage = (msg) => {
            const [type, subId, event] = JSON.parse(msg.data);
            
            if (type === "EVENT") {
              events.set(event.id, event);
            } else if (type === "EOSE") {
              clearTimeout(timeout);
              ws.close();
              resolve();
            }
          };

          ws.onerror = (error) => {
            clearTimeout(timeout);
            ws.close();
            resolve([]); // Don't fail completely on error
          };
        });
      } catch (error) {
        console.warn(`Failed to query relay ${relay}:`, error);
        return [];
      }
    }));

    return Array.from(events.values());
  }

  /**
   * Parse list events into a structured format
   * @param {Array} events - Raw list events
   * @returns {Object} Structured lists by category
   */
  parseListEvents(events) {
    const lists = {};

    events.forEach(event => {
      try {
        // Get list name from d tag or default to event id
        const dTag = event.tags.find(t => t[0] === 'd');
        const name = dTag ? dTag[1] : event.id.slice(0, 8);

        // Get title if present (support both title tag and t tag for linktr-nostr)
        const titleTag = event.tags.find(t => t[0] === 'title') || event.tags.find(t => t[0] === 't');
        const title = titleTag ? titleTag[1] : name;

        // Get description if present (support both description tag and summary tag)
        const descTag = event.tags.find(t => t[0] === 'description') || 
                       event.tags.find(t => t[0] === 'summary');
        const description = descTag ? descTag[1] : '';

        // Parse list items - support both standard format and linktr-nostr format
        const items = event.tags
          .filter(t => ['e', 'p', 'a', 'r', 'l'].includes(t[0])) // Include 'l' tag for linktr-nostr links
          .map(t => ({
            type: t[0],
            value: t[1],
            relay: t[2] || null,
            marker: t[3] || null,
            // For linktr-nostr links (l tags), include title if available
            title: t[0] === 'l' && t[3] ? t[3] : null
          }));

        lists[name] = {
          id: event.id,
          kind: event.kind,
          title,
          description,
          items,
          created_at: event.created_at,
          content: event.content
        };
      } catch (error) {
        console.warn('Failed to parse list event:', error);
      }
    });

    return lists;
  }

  /**
   * Convert npub to hex format
   * @param {string} npub - npub1... format public key
   * @returns {string} hex format public key
   */
  npubToHex(npub) {
    // TODO: Implement proper bech32 conversion
    // For now, this is a placeholder
    return npub;
  }
}

module.exports = NostrListService;
