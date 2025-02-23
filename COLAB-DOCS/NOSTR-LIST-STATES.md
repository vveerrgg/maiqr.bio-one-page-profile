# Nostr List States and Formats

This document outlines the various states and formats of Nostr lists that can be displayed on maiqr.bio profiles. We support both standard Nostr lists (kind:30001) and linktr-nostr lists (kind:30003).

## List Event Structure

### Common Properties
- **Event ID**: Unique identifier for the list
- **Kind**: Either 30001 (standard) or 30003 (linktr-nostr)
- **Created At**: Unix timestamp of creation
- **Public Key**: Creator's public key
- **Content**: Optional additional content/description

### Standard List (kind:30001)
```json
{
  "id": "...",
  "kind": 30001,
  "created_at": 1234567890,
  "pubkey": "...",
  "content": "Optional description",
  "tags": [
    ["d", "list-identifier"],
    ["title", "My List Title"],
    ["description", "List description"],
    ["e", "note1...", "wss://relay.example.com"],
    ["p", "profile1...", "wss://relay.example.com"],
    ["a", "article1...", "wss://relay.example.com"]
  ]
}
```

### Linktr List (kind:30003)
```json
{
  "id": "...",
  "kind": 30003,
  "created_at": 1234567890,
  "pubkey": "...",
  "content": "Optional description",
  "tags": [
    ["d", "list-identifier"],
    ["t", "List Title"],
    ["summary", "List description"],
    ["l", "https://example.com", "", "Link Title"],
    ["hashtag", "technology"],
    ["hashtag", "nostr"]
  ]
}
```

## Tag Types and Their States

### Identifier Tags
- **d**: Unique identifier for the list (used in both formats)
  - Format: `["d", "<identifier>"]`
  - Example: `["d", "my-tech-links"]`

### Title Tags
- **title** (standard) or **t** (linktr):
  - Format: `["title", "<title>"]` or `["t", "<title>"]`
  - Example: `["title", "My Favorite Resources"]`

### Description Tags
- **description** (standard) or **summary** (linktr):
  - Format: `["description", "<text>"]` or `["summary", "<text>"]`
  - Example: `["description", "A collection of useful links"]`

### Content Tags

#### Standard List Items
1. **Notes (e)**:
   - Format: `["e", "<note-id>", "<relay-url>", "<marker>"]`
   - Example: `["e", "note1abc...", "wss://relay.example.com", "reply"]`

2. **Profiles (p)**:
   - Format: `["p", "<pubkey>", "<relay-url>", "<petname>"]`
   - Example: `["p", "pubkey123...", "wss://relay.example.com", "alice"]`

3. **Articles/Addresses (a)**:
   - Format: `["a", "<identifier>", "<relay-url>", "<marker>"]`
   - Example: `["a", "article123...", "wss://relay.example.com", ""]`

#### Linktr List Items
1. **Links (l)**:
   - Format: `["l", "<url>", "<relay-url>", "<title>"]`
   - Example: `["l", "https://example.com", "", "Example Site"]`

2. **Hashtags**:
   - Format: `["hashtag", "<tag>"]`
   - Example: `["hashtag", "technology"]`

### Optional Metadata
1. **Relay URLs**: Optional third parameter in tags for specifying preferred relay
2. **Markers/Petnames**: Optional fourth parameter for additional context
3. **Hashtags**: Used for categorization (primarily in linktr format)

## Display States

### List Card States
1. **Empty List**:
   - No items
   - Shows only title and description
   - Creation date

2. **Links Only**:
   - Contains only URL links
   - Each link shows title/description
   - Optional icons for link types

3. **Mixed Content**:
   - Combination of notes, profiles, and links
   - Different icons for different content types
   - Consistent display format

4. **With Hashtags**:
   - Shows categorization
   - Filterable/searchable

### Item Display States
1. **Link Items**:
   - Title (if available)
   - URL (truncated if too long)
   - Description (if available)
   - Icon: 🔗

2. **Note References**:
   - Note preview (if available)
   - Link to full note
   - Icon: 📝

3. **Profile References**:
   - Profile name/pubkey
   - Petname (if available)
   - Icon: 👤

4. **Article References**:
   - Article title
   - Preview (if available)
   - Icon: 📄

## Error States
1. **Invalid URLs**: Show error indicator, disable link
2. **Missing Content**: Hide empty fields
3. **Invalid Tags**: Skip invalid tags during rendering
4. **Network Issues**: Show placeholder/loading state
5. **Permission Issues**: Handle private/deleted content gracefully

## List Lifecycle Management

### Version Chain
1. **Initial Creation**
   - First event of a list with a specific `d` tag
   - No `e` tag referencing previous versions
   - Serves as the root of the version chain

2. **Updates**
   - New event with same `d` tag
   - Contains `e` tag referencing previous version
   - Format: `["e", "<previous-event-id>", "", "previous"]`
   - Creates a linked chain of versions

3. **Version History**
   ```
   List "my-tech-links"
   └── Initial (event_id_1)
       └── Update 1 (event_id_2)
           └── Update 2 (event_id_3)
               └── Current (event_id_4)
   ```

### List States
1. **Active**
   - Most recent version in the chain
   - No deletion markers
   - Has content/items

2. **Empty**
   - No items in the list
   - Can be hidden from display
   - Might indicate:
     - New list awaiting content
     - Temporary placeholder
     - All items removed

3. **Marked for Deletion**
   - Contains deletion marker tag: `["status", "deleted"]`
   - Or referenced by a kind:5 (deletion) event
   - Should be hidden from default view
   - Accessible in history/archive mode

4. **Archived**
   - Older versions in the chain
   - Accessible via version history
   - Read-only state
   - Useful for:
     - Tracking changes
     - Restoring previous versions
     - Audit trails

### Display Preferences
1. **Default View**
   ```json
   {
     "show": {
       "active": true,
       "empty": false,
       "deleted": false,
       "archived": false
     }
   }
   ```

2. **History View**
   ```json
   {
     "show": {
       "active": true,
       "empty": true,
       "deleted": true,
       "archived": true
     },
     "sort": "chronological",
     "groupBy": "version_chain"
   }
   ```

### State Transitions
```
Initial Creation → Active
     ↓
   Active → Empty (remove all items)
     ↓
   Empty → Active (add items)
     ↓
   Active → Marked for Deletion
     ↓
   Any State → Archived (when superseded by new version)
```

### Implementation Considerations
1. **Version Tracking**
   - Store event IDs in chronological order
   - Maintain reference to current version
   - Index by `d` tag for quick lookup

2. **State Management**
   - Check for deletion events
   - Verify empty status
   - Track version chain

3. **Display Logic**
   ```javascript
   function shouldDisplayList(list, preferences) {
     if (list.isDeleted && !preferences.show.deleted) return false;
     if (list.isEmpty && !preferences.show.empty) return false;
     if (list.isArchived && !preferences.show.archived) return false;
     return true;
   }
   ```

4. **Performance Optimization**
   - Cache current versions
   - Lazy load history
   - Batch update checks

### Migration Path
1. **Adding Version Support**
   - Update existing lists to be "initial versions"
   - Add version chain tracking
   - Implement history view

2. **State Management Updates**
   - Add state flags to list objects
   - Update display logic
   - Add user preferences

3. **UI Enhancements**
   - Version history viewer
   - State toggles
   - Restore functionality

## Future Considerations
1. **Real-time Updates**: WebSocket support for live list updates
2. **Caching**: Local storage for frequently accessed lists
3. **Pagination**: Handling large lists efficiently
4. **Search/Filter**: Advanced filtering by type, tag, or content
5. **Rich Media**: Embedded previews for links and content
6. **Analytics**: View counts and interaction metrics
7. **Collaboration**: Multi-author lists and permissions
8. **Export/Import**: Data portability between formats
