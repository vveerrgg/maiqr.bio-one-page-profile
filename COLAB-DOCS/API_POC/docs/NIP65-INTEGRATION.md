# NIP-65 Integration for maiqr.bio

## Overview
maiqr.bio acts as an identity oracle for Nostr users, providing DNS-based verification and relay discovery. Our implementation aligns with NIP-65 (Relay List Metadata) while focusing on identity verification rather than relay preferences management.

## DNS Record Structure

For a user `alice.maiqr.bio`, the TXT records would be:

```
# Identity verification
TXT: nostr=npub1alice...

# Relay list (NIP-65 compatible)
TXT: relays=["wss://relay.damus.io","wss://relay.nostr.band"]

# Optional official URL
TXT: url=https://alice.com
```

## API Endpoints

### POST /api/profile
Creates or updates a user's profile information.

```json
{
  "username": "alice",
  "npub": "npub1alice...",
  "relays": [
    "wss://relay.damus.io",
    "wss://relay.nostr.band"
  ],
  "url": "https://alice.com"  // optional
}
```

### GET /api/profile/:username
Retrieves a user's profile information in NIP-65 compatible format.

```json
{
  "username": "alice",
  "npub": "npub1alice...",
  "relays": [
    "wss://relay.damus.io",
    "wss://relay.nostr.band"
  ],
  "url": "https://alice.com",
  "dns": "alice.maiqr.bio"
}
```

## NIP-65 Compatibility
While we store relay information, we act as an oracle rather than a relay preference manager. Clients should:

1. Use our DNS records to verify user identity
2. Consider our relay list as a discovery mechanism
3. Respect user's kind:10002 events for actual relay preferences

## Example Usage

### JavaScript
```javascript
// Lookup user profile
const response = await fetch('https://api.maiqr.bio/profile/alice');
const profile = await response.json();

// Use with NIP-65
const kind10002Event = {
  kind: 10002,
  tags: profile.relays.map(relay => ['r', relay]),
  content: '',
  // ... other event fields
};
```

### DNS Lookup
```bash
# Direct DNS query
dig TXT alice.maiqr.bio

# Expected output:
;; ANSWER SECTION:
alice.maiqr.bio. IN TXT "nostr=npub1alice..."
alice.maiqr.bio. IN TXT "relays=[\"wss://relay.damus.io\",\"wss://relay.nostr.band\"]"
alice.maiqr.bio. IN TXT "url=https://alice.com"
```
