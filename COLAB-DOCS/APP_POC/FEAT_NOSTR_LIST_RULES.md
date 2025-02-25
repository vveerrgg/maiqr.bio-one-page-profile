# Nostr List Rules and Behavior

## Event Types

### List Events (kind:30001, kind:30003)
- Lists are created as Nostr events with kind `30001` (generic lists) or `30003` (bookmark lists)
- Each list contains:
  - Title (in tags as `["t", "title"]` or `["title", "title"]`)
  - Description (in content or tags as `["description", "desc"]`)
  - Items (as various tag types)
  - Metadata (creation time, author pubkey, etc.)

### Deletion Events (kind:5)
- Deletions are separate events with kind `5`
- They reference the original event ID in their tags
- Example: `["e", "original_event_id"]`
- Deletions don't remove data, they mark it as "should be hidden"

## Event Persistence

### Storage on Relays
1. **Permanent Storage**
   - Events (including deletions) are stored permanently by default
   - Original events remain in the network even after deletion
   - Think of it like a blockchain - immutable once created

2. **Relay Policies**
   - Each relay has its own retention policies
   - Some keep everything forever
   - Some delete old events after a certain time
   - Some honor deletion events, others don't

3. **Event States**
   - Available: Event is stored and accessible
   - Deleted: Event is marked as deleted but still stored
   - Unknown: Relay doesn't have the event or didn't respond

### Event Propagation

1. **Publishing**
   - Events are published to multiple relays for redundancy
   - Each relay independently decides:
     - Whether to accept the event
     - How long to store it
     - Whether to honor deletions

2. **Fetching**
   - Clients should query multiple relays
   - Events might exist on some relays but not others
   - Deletion status might differ between relays

## Client-Side Handling

### Best Practices
1. **Publishing**
   - Always publish to multiple relays
   - Wait for at least one successful confirmation
   - Handle failed publications gracefully

2. **Fetching**
   - Query multiple relays
   - Deduplicate events by event ID
   - Track which relays have each event

3. **Deletion Handling**
   - Check for kind:5 events referencing the event ID
   - Decide how to display deleted content
   - Consider showing deletion status per relay

### Display Guidelines
1. **Active Events**
   - Show full content
   - Display relay availability
   - Allow interaction (e.g., deletion)

2. **Deleted Events**
   - Show as collapsed/minimized
   - Indicate deletion status
   - Allow viewing but not interaction
   - Show which relays honor the deletion

## Caching Strategy

### Local Storage
1. **Cache Structure**
   - Version prefixed keys
   - Store events and deletion markers
   - Track relay availability

2. **Cache Invalidation**
   - Time-based expiry (e.g., 1 hour)
   - Version-based invalidation
   - Per-pubkey clearing

3. **Error Handling**
   - Handle corrupted cache data
   - Fallback to network fetch
   - Clear invalid cache entries

## Implementation Example

```javascript
// Event structure
const listEvent = {
    kind: 30003,
    created_at: timestamp,
    tags: [
        ["t", "My Bookmark List"],
        ["description", "Important links"],
        ["l", "https://example.com", "Example Site"]
    ],
    content: "List description"
};

// Deletion structure
const deletionEvent = {
    kind: 5,
    created_at: timestamp,
    tags: [
        ["e", "original_event_id"]
    ],
    content: ""
};

// Cache key structure
const cacheKey = `nostr_lists_v1_${pubkey}`;
```

## Security Considerations

1. **Data Persistence**
   - Assume all published data is permanent
   - Don't include sensitive information
   - Use appropriate content warnings

2. **Deletion Limitations**
   - Deletions are advisory, not guaranteed
   - Original content may remain accessible
   - Some relays might ignore deletions

3. **Client Trust**
   - Verify event signatures
   - Don't trust relay data blindly
   - Handle malformed events gracefully
