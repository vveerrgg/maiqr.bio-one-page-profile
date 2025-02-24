# nostr-metadata-utils Features

A frontend-first utility library for handling Nostr profile metadata in Progressive Web Apps (PWAs).

## Core Features

### Profile Management

#### Local Profile Handling
- Smart profile caching with TTL
- Offline-first data access
- Background sync capabilities
- Change detection and updates
- Profile data validation and normalization

#### Profile Enhancement
```javascript
const enriched = await ProfileEnricher.enhance(profile, {
  validateImages: true,     // Check if images are accessible
  optimizeImages: true,     // Suggest optimal image sizes
  validateLinks: true,      // Verify website/social links
  suggestFixes: true       // Get suggestions for invalid data
});
```

#### Progressive Display
- Lazy loading of resources
- Placeholder and blur-up images
- Adaptive layouts based on available data
- Fallback handling for missing data

### DNS Integration

#### NIP-05 Verification
- Client-side NIP-05 verification
- Cached verification results
- Offline verification support
- Batch verification for multiple identifiers

#### DNS Discovery
```javascript
const metadata = await NostrDNSUtils.discoverFromDomain("example.com", {
  recordTypes: ["TXT", "SRV"],
  includeSubdomains: true,
  cacheResults: true
});
```

Features:
- Discover Nostr metadata from DNS TXT records
- Find preferred relays via DNS
- Discover associated pubkeys
- Cross-reference DNS data with profile data

### Analytics & Insights

#### Profile Analytics
- Profile completion scoring
- Content quality assessment
- Engagement metrics
- Improvement suggestions

#### Usage Metrics
- Cache hit rates
- DNS lookup performance
- Image load success rates
- Network usage statistics

## MaiQR Platform Architecture

### Core Concept
- Universal profile platform for any npub
- Adaptive display of nostr ecosystem content
- Progressive enhancement through maiqr.app
- Future-proof for emerging nostr replacements of Web2 platforms

### Content Sources
```javascript
const CONTENT_TYPES = {
  COMMERCE: {
    kind: 30017,  // Example kind for commerce
    platforms: ['etsy', 'shopify', 'gumroad'],
    metadata: ['products', 'store_info', 'pricing']
  },
  PROFESSIONAL: {
    kind: 30018,  // Example kind for professional
    platforms: ['linkedin', 'github', 'cv'],
    metadata: ['experience', 'skills', 'projects']
  },
  SOCIAL: {
    kind: 30019,  // Example kind for social
    platforms: ['instagram', 'twitter'],
    metadata: ['gallery', 'posts', 'interactions']
  },
  MUSIC: {
    kind: 30020,  // Example kind for music
    platforms: ['soundcloud', 'spotify', 'bandcamp'],
    metadata: ['tracks', 'albums', 'events']
  }
};
```

### Layout Management
```javascript
class ProfileLayoutManager {
  constructor(npub) {
    this.npub = npub;
    this.pool = new NostrWebSocketPool();
    this.metadataUtils = new NostrMetadataUtils();
  }

  async getLayout() {
    // First check for custom layout
    const layoutPost = await this.metadataUtils.findLatestMetadata(this.npub, {
      kinds: [39901], // Example kind for maiqr layout
      tags: [['c', 'maiqr-layout']]
    });

    if (layoutPost) {
      return this.parseLayoutPost(layoutPost);
    }

    // Fall back to automatic layout based on content
    return this.generateAutomaticLayout();
  }

  async generateAutomaticLayout() {
    // Discover available content types
    const contentMap = await this.discoverContent();
    
    // Organize by type and activity
    return this.organizeContent(contentMap);
  }

  async discoverContent() {
    const contentMap = {};
    
    // Check each content type
    for (const [type, config] of Object.entries(CONTENT_TYPES)) {
      const content = await this.metadataUtils.findContent(this.npub, {
        kinds: [config.kind],
        limit: 10,
        since: Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
      });

      if (content.length > 0) {
        contentMap[type] = {
          items: content,
          activity: this.calculateActivity(content),
          metadata: await this.extractMetadata(content, config.metadata)
        };
      }
    }

    return contentMap;
  }

  calculateActivity(content) {
    // Score based on:
    // - Recency
    // - Interaction count
    // - Content completeness
    return content.reduce((score, item) => {
      const age = Date.now() - item.created_at * 1000;
      const recency = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // Week half-life
      return score + recency;
    }, 0);
  }
}
```

### Content Adaptation
```javascript
class ContentAdapter {
  static async migrateFromWeb2(oldPlatform, content) {
    // Convert Web2 content to appropriate nostr kinds
    const kindMapping = {
      'etsy': 30017,
      'linkedin': 30018,
      'instagram': 30019,
      'soundcloud': 30020
    };

    return {
      kind: kindMapping[oldPlatform],
      content: JSON.stringify(content),
      tags: [
        ['p', content.creator],
        ['platform', oldPlatform],
        ['migration', 'web2-to-nostr']
      ]
    };
  }

  static detectContentType(post) {
    // Analyze post content and tags to determine type
    const platformTag = post.tags.find(t => t[0] === 'platform');
    if (platformTag) {
      return this.mapPlatformToType(platformTag[1]);
    }

    // Fallback to content analysis
    return this.analyzeContent(post.content);
  }
}
```

### Profile Display
```javascript
class ProfileDisplay {
  constructor(npub) {
    this.layout = new ProfileLayoutManager(npub);
    this.adapter = new ContentAdapter();
  }

  async render() {
    const layout = await this.layout.getLayout();
    
    return {
      header: this.renderHeader(layout.profile),
      sections: layout.sections.map(section => ({
        type: section.type,
        content: this.adapter.adaptContent(section.content),
        layout: section.layout || 'default',
        visibility: this.calculateVisibility(section)
      })),
      footer: this.renderFooter(layout.metadata)
    };
  }

  calculateVisibility(section) {
    // Hide empty or stale sections
    if (!section.content || section.content.length === 0) {
      return 'hidden';
    }

    // Check freshness
    const age = Date.now() - section.lastUpdate;
    if (age > 365 * 24 * 60 * 60 * 1000) { // 1 year
      return 'archived';
    }

    return 'visible';
  }
}
```

### Key Features
1. **Automatic Content Discovery**
   - Monitors nostr network for relevant content
   - Adapts to new post kinds as they emerge
   - Smart categorization of content types

2. **Layout Intelligence**
   - Automatic organization based on content
   - Custom layouts via maiqr.app
   - Progressive enhancement of display

3. **Platform Migration**
   - Seamless transition from Web2 platforms
   - Content type preservation
   - Historical data integration

4. **Future Proofing**
   - Extensible content type system
   - Adaptive display mechanisms
   - Flexible metadata handling

### Benefits
- Zero configuration needed for basic profiles
- Automatic discovery of user content
- Seamless integration with nostr ecosystem
- Ready for future platform migrations

## List Implementation (NIP-74 Compatible)

### List Structure
```javascript
// List definition post (NIP-74)
{
  kind: 30011,  // NIP-74 kind for link lists
  tags: [
    ['d', 'my-links'],       // Unique identifier
    ['title', 'My Links'],   // List title
    ['description', 'Collection of my favorite resources'],
    ['image', 'https://example.com/list-image.jpg'], // Optional list image
    ['lang', 'en'],          // Language specification
    ['order', '1']           // Display order
  ],
  content: JSON.stringify({
    items: [
      {
        id: 'item1',
        url: 'https://store.example.com',
        title: 'My Store',
        description: 'Check out my store!',
        image: 'https://example.com/store-thumb.jpg',
        protocol: 'https',
        icon: '🛍️',
        order: 1,
        metadata: {
          type: 'commerce',
          lang: 'en'
        }
      },
      {
        id: 'item2',
        url: 'ipfs://QmExample...',
        title: 'IPFS Resource',
        description: 'Decentralized content',
        protocol: 'ipfs',
        icon: '📦',
        order: 2,
        metadata: {
          type: 'resource',
          lang: 'en'
        }
      }
    ],
    metadata: {
      updated_at: 1645567890,
      visibility: 'visible',
      style: 'card',
      version: '1.0.0'
    }
  })
}
```

### Enhanced List Manager
```javascript
class NIP74ListManager {
  constructor(npub) {
    this.npub = npub;
    this.pool = new NostrWebSocketPool();
  }

  async getLists() {
    // Get all NIP-74 list posts
    const posts = await this.pool.queryPosts({
      authors: [this.npub],
      kinds: [30011],  // NIP-74 kind
      limit: 50
    });

    // Group by list ID and get latest version
    const lists = this.processLists(posts);
    
    // Sort by order
    return this.sortLists(lists);
  }

  processLists(posts) {
    // Group by list ID ('d' tag)
    const grouped = posts.reduce((acc, post) => {
      const id = post.tags.find(t => t[0] === 'd')?.[1];
      if (!id) return acc;
      
      if (!acc[id]) acc[id] = [];
      acc[id].push(post);
      return acc;
    }, {});

    // Get latest version of each list
    return Object.entries(grouped).map(([id, posts]) => {
      const latest = posts.sort((a, b) => b.created_at - a.created_at)[0];
      return {
        id,
        ...this.parseList(latest)
      };
    });
  }

  parseList(post) {
    // Extract all metadata from tags
    const tags = post.tags.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

    const content = JSON.parse(post.content);

    return {
      id: tags.d,
      title: tags.title,
      description: tags.description,
      image: tags.image,
      lang: tags.lang || 'en',
      order: parseInt(tags.order || '0'),
      items: this.processItems(content.items),
      metadata: {
        ...content.metadata,
        created_at: post.created_at
      }
    };
  }

  processItems(items) {
    return items.map(item => ({
      ...item,
      // Validate and normalize URL based on protocol
      url: this.normalizeUrl(item.url, item.protocol),
      // Ensure required fields
      title: item.title || new URL(item.url).hostname,
      protocol: item.protocol || new URL(item.url).protocol.slice(0, -1)
    }));
  }

  normalizeUrl(url, protocol) {
    switch (protocol) {
      case 'ipfs':
        return url.startsWith('ipfs://') ? url : `ipfs://${url}`;
      case 'magnet':
        return url.startsWith('magnet:') ? url : `magnet:${url}`;
      default:
        return url;
    }
  }

  async createList(data) {
    const post = {
      kind: 30011,
      tags: [
        ['d', data.id],
        ['title', data.title],
        ['description', data.description || ''],
        ['lang', data.lang || 'en'],
        ['order', `${data.order || 0}`]
      ],
      content: JSON.stringify({
        items: data.items,
        metadata: {
          updated_at: Math.floor(Date.now() / 1000),
          visibility: data.visibility || 'visible',
          style: data.style || 'list',
          version: '1.0.0'
        }
      })
    };

    // Add optional tags
    if (data.image) post.tags.push(['image', data.image]);

    return await this.pool.publish(post);
  }
}

// Example usage
class ListDisplay {
  constructor(npub) {
    this.manager = new NIP74ListManager(npub);
  }

  async render() {
    const lists = await this.manager.getLists();
    
    return lists.map(list => ({
      id: list.id,
      title: list.title,
      description: list.description,
      image: list.image,
      lang: list.lang,
      items: this.renderItems(list.items, list.metadata.style),
      style: list.metadata.style,
      visibility: this.calculateVisibility(list)
    }));
  }

  renderItems(items, style) {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    
    return sorted.map(item => ({
      ...item,
      rendered: this.renderItemByProtocol(item)
    }));
  }

  renderItemByProtocol(item) {
    switch (item.protocol) {
      case 'ipfs':
        return this.renderIPFSItem(item);
      case 'magnet':
        return this.renderMagnetItem(item);
      default:
        return this.renderHttpItem(item);
    }
  }
}
```

### Key Features (NIP-74 Alignment)
1. **Standard Compliance**
   - Uses kind 30011 for link lists
   - Rich metadata support
   - Internationalization (lang tag)
   - Protocol-specific handling

2. **Enhanced Metadata**
   - List-level metadata (title, description, image)
   - Item-level metadata (protocol, type, lang)
   - Version tracking
   - Visibility controls

3. **Protocol Support**
   - HTTP/HTTPS links
   - IPFS resources
   - Magnet links
   - Extensible for new protocols

4. **Integration Features**
   - Compatible with existing nostr clients
   - Supports multiple display formats
   - Progressive enhancement
   - Drag-and-drop reordering

## Architecture

### Storage Layer
- Uses browser's localStorage for efficient client-side caching
- Structured storage format for profile data:
```javascript
// Example localStorage structure
{
  'nostr:profiles': {
    [npub]: {
      data: ProfileData,
      lastUpdated: timestamp,
      version: '1.0',
      checksum: 'sha256-hash'
    }
  },
  'nostr:dns-cache': {
    [domain]: {
      records: DNSRecords,
      expires: timestamp
    }
  }
}
```

### Connectivity Layer
- Leverages `nostr-websocket-utils` for relay communication
- Handles connection pooling and relay selection
- Example integration:
```javascript
import { NostrWebSocketPool } from 'nostr-websocket-utils';

class ProfileManager {
  constructor() {
    this.storage = new StorageManager('localStorage');
    this.pool = new NostrWebSocketPool({
      maxConnections: 3,
      timeout: 5000
    });
  }

  async getProfile(npub) {
    // Try cache first
    const cached = this.storage.get(`profiles:${npub}`);
    if (cached && !this.isStale(cached)) {
      return cached;
    }

    // Fetch from network
    const profile = await this.pool.requestProfile(npub);
    
    // Update cache
    this.storage.set(`profiles:${npub}`, {
      data: profile,
      lastUpdated: Date.now()
    });

    return profile;
  }
}

## Content Discovery

### List Aggregation
- Automatically discovers and aggregates lists from recent posts
- Supports various list formats (bullet points, numbered lists, etc.)
- Categories and tags detection
- Smart content organization

#### List Types
- **Recommendations**: Products, tools, apps
- **Collections**: Music, books, movies
- **Resources**: Learning materials, documentation
- **Bookmarks**: Interesting links and references
- **Reviews**: Products or service reviews
- **Guides**: How-to's and tutorials

### Use Case
- Enhance profile display with user-created lists
- Query for specific kinds of content (e.g., app lists, link collections)
- Display lists alongside profile information
- Keep lists updated in real-time

### Implementation Approach

Example implementation:
```javascript
class ListContentManager {
  constructor(options = {}) {
    this.storage = new StorageManager('localStorage');
    this.pool = new NostrWebSocketPool();
    this.kinds = options.kinds || ['lists', 'links', 'apps'];
  }

  async findUserLists(npub) {
    // Check cache first
    const cached = this.storage.get(`user-lists:${npub}`);
    if (cached && !this.isStale(cached)) {
      return cached;
    }

    // Query recent posts with specific tags or markers
    const posts = await this.pool.queryPosts({
      authors: [npub],
      kinds: [1], // Regular posts
      tags: ['l', 'list', 'collection'], // Common list markers
      limit: 50
    });

    // Process and categorize
    const lists = posts
      .filter(post => this.hasListContent(post))
      .map(post => this.parseListContent(post));

    // Cache results
    this.storage.set(`user-lists:${npub}`, {
      lists,
      timestamp: Date.now()
    });

    return lists;
  }

  hasListContent(post) {
    // Check for list indicators:
    // - Specific hashtags (#list, #collection)
    // - List-like content structure
    // - Specific app markers
    return (
      post.tags.some(t => ['l', 'list', 'collection'].includes(t[0])) ||
      this.detectListStructure(post.content)
    );
  }

  parseListContent(post) {
    return {
      id: post.id,
      created_at: post.created_at,
      kind: this.detectListKind(post),
      items: this.extractItems(post.content),
      metadata: {
        title: this.extractTitle(post),
        description: this.extractDescription(post),
        tags: post.tags
      }
    };
  }

  detectListKind(post) {
    // Determine list type based on:
    // - Content analysis
    // - Tags
    // - Known patterns
    if (post.tags.some(t => t[0] === 'l' && t[1] === 'apps')) {
      return 'apps';
    }
    if (post.tags.some(t => t[0] === 'l' && t[1] === 'links')) {
      return 'links';
    }
    return 'general';
  }
}

// Usage in Profile Display
class ProfileEnhancer {
  async enhanceWithLists(profile) {
    const listManager = new ListContentManager();
    const lists = await listManager.findUserLists(profile.npub);

    return {
      ...profile,
      lists: {
        apps: lists.filter(l => l.kind === 'apps'),
        links: lists.filter(l => l.kind === 'links'),
        general: lists.filter(l => l.kind === 'general')
      }
    };
  }
}

// Example Result
{
  basic: ProfileData,
  lists: {
    apps: [{
      id: 'note1...',
      kind: 'apps',
      items: ['Damus', 'Amethyst', 'Iris'],
      metadata: {
        title: 'My Favorite Nostr Apps',
        description: 'Apps I use daily',
        tags: [['l', 'apps'], ['t', 'nostr']]
      }
    }],
    links: [{
      id: 'note2...',
      kind: 'links',
      items: ['https://example.com', 'https://nostr.com'],
      metadata: {
        title: 'Useful Nostr Resources',
        tags: [['l', 'links']]
      }
    }]
  }
}

### Features
- Focused on discovering specific types of lists
- Real-time updates when new lists are posted
- Caching for performance
- Smart content categorization
- Easy integration with profile display

### Benefits
- Enhanced profile content
- Better content organization
- Improved user experience
- Efficient data loading
- Offline access to lists

## Technical Features

### Performance Optimization
- Efficient caching strategies
- Lazy loading of resources
- Background processing
- Network request batching

### PWA Support
- Service worker integration
- Offline functionality
- Background sync
- Push notifications for updates

### Developer Experience
- TypeScript support
- Comprehensive documentation
- Usage examples
- Testing utilities

## Example Usage

### Basic Profile Management
```javascript
const profile = await ProfileManager.get(npub, {
  cache: true,               // Use local cache
  maxAge: '1h',             // Cache TTL
  offlineFirst: true,       // Use cache when offline
  backgroundSync: true      // Update cache in background
});
```

### DNS Integration
```javascript
const dnsUtils = new NostrDNSUtils();

// Discover all nostr-related DNS records
const metadata = await dnsUtils.discoverFromDomain("example.com");

// Specific lookups
const hasNostr = await dnsUtils.checkNostrSupport("example.com");
const relays = await dnsUtils.getPreferredRelays("example.com");
const pubkeys = await dnsUtils.getAssociatedPubkeys("example.com");
```

### Profile Sync
```javascript
const sync = new ProfileSync(npub, {
  strategy: 'periodic',     // Sync strategy
  interval: '15m',         // Check interval
  diffOnly: true,          // Only sync changes
  notifications: true      // Notify on updates
});
```

## Future Enhancements

### Planned Features
- [ ] Multi-relay data aggregation
- [ ] Profile data versioning
- [ ] Automated profile backup
- [ ] Cross-device sync
- [ ] Enhanced privacy controls

### Under Consideration
- Profile data encryption
- Relay performance metrics
- Advanced caching strategies
- Integration with other NIPs
- Custom metadata extensions

## Integration Examples

### React Integration
```javascript
function ProfileComponent({ npub }) {
  const { profile, loading, error } = useProfile(npub, {
    enableDNS: true,
    enableCache: true
  });

  if (loading) return <ProfileSkeleton />;
  if (error) return <ProfileError error={error} />;
  
  return <ProfileDisplay profile={profile} />;
}
```

### Vue Integration
```javascript
export default {
  setup(props) {
    const { profile, isLoading } = useNostrProfile(props.npub);
    
    return { profile, isLoading };
  }
}
