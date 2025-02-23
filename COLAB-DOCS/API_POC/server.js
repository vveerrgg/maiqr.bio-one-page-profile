require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { nameValidation } = require('./config/reserved-names');
const DNSService = require('./services/dns-service');
const NostrListService = require('./services/nostr-list-service');

const app = express();
const port = process.env.PORT || 3000;

// Initialize services
const dnsService = new DNSService({
  provider: process.env.DNS_PROVIDER || 'cloudflare',
  apiToken: process.env.DNS_API_TOKEN,
  zoneId: process.env.CLOUDFLARE_ZONE_ID,
  domain: process.env.DO_DOMAIN
});

const nostrListService = new NostrListService({});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/api/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Validate username
    const validation = nameValidation.validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.reason
      });
    }

    // Get profile
    const profile = await dnsService.getProfile(username);
    
    if (!profile.npub) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile lookup error:', error);
    res.status(500).json({
      error: 'Failed to lookup profile'
    });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const { username, npub, relays, url } = req.body;

    // Validate username
    const validation = nameValidation.validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.reason
      });
    }

    // Validate npub
    if (!npub || !npub.startsWith('npub1')) {
      return res.status(400).json({
        error: 'Invalid npub format'
      });
    }

    // Validate relays
    if (!Array.isArray(relays) || relays.length === 0) {
      return res.status(400).json({
        error: 'At least one relay must be specified'
      });
    }

    // Update DNS records
    const result = await dnsService.updateProfile(username, npub, relays, url);
    
    // Return the full profile
    const profile = await dnsService.getProfile(username);
    res.json(profile);

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

// Get user lists
app.get('/api/profile/:username/lists', async (req, res) => {
  try {
    const { username } = req.params;
    const { since } = req.query; // Optional Unix timestamp

    // Validate username
    const validation = nameValidation.validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.reason
      });
    }

    // Get profile to get npub and relays
    const profile = await dnsService.getProfile(username);
    if (!profile.npub) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    // Fetch lists from relays
    const events = await nostrListService.fetchUserLists(
      profile.npub,
      profile.relays,
      since ? parseInt(since) : undefined
    );

    // Parse and return lists
    const lists = nostrListService.parseListEvents(events);
    res.json(lists);

  } catch (error) {
    console.error('List fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch lists'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
