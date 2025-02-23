const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class DNSService {
  constructor(config) {
    this.provider = config.provider;
    this.config = config;
  }

  async getProfile(username) {
    const records = await this.getTxtRecords(username);
    return this.parseProfileRecords(username, records);
  }

  parseProfileRecords(username, records) {
    const profile = {
      username,
      dns: `${username}.maiqr.bio`,
      npub: null,
      relays: [],
      url: null
    };

    records.forEach(record => {
      const content = record.data || record.content;
      if (content.startsWith('nostr=')) {
        profile.npub = content.substring(6);
      } else if (content.startsWith('relays=')) {
        try {
          profile.relays = JSON.parse(content.substring(7));
        } catch (e) {
          console.warn('Invalid relay list format:', content);
        }
      } else if (content.startsWith('url=')) {
        profile.url = content.substring(4);
      }
    });

    return profile;
  }

  async getTxtRecords(username) {
    switch(this.provider) {
      case 'cloudflare':
        return this.getCloudflareRecords(username);
      case 'digitalocean':
        return this.getDigitalOceanRecords(username);
      default:
        throw new Error('Unsupported DNS provider');
    }
  }

  async updateProfile(username, npub, relays, url) {
    // Validate and format relays
    const validRelays = relays.filter(relay => {
      try {
        const url = new URL(relay);
        return url.protocol === 'wss:' || url.protocol === 'ws:';
      } catch {
        return false;
      }
    });

    if (validRelays.length === 0) {
      throw new Error('No valid relay URLs provided');
    }

    const records = [
      { type: 'TXT', name: username, content: `nostr=${npub}` },
      { type: 'TXT', name: username, content: `relays=${JSON.stringify(validRelays)}` }
    ];

    if (url) {
      try {
        new URL(url); // Validate URL format
        records.push({ type: 'TXT', name: username, content: `url=${url}` });
      } catch {
        console.warn('Invalid URL format:', url);
      }
    }

    switch(this.provider) {
      case 'cloudflare':
        return this.updateCloudflareRecords(username, records);
      case 'digitalocean':
        return this.updateDigitalOceanRecords(username, records);
      default:
        throw new Error('Unsupported DNS provider');
    }
  }

  async getCloudflareRecords(username) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/dns_records?type=TXT&name=${username}.${this.config.domain}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    return data.result || [];
  }

  async updateCloudflareRecords(username, records) {
    // First delete existing records
    const existing = await this.getCloudflareRecords(username);
    await Promise.all(existing.map(record =>
      fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/dns_records/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      })
    ));

    // Then create new records
    const results = await Promise.all(records.map(record =>
      fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/dns_records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...record,
          name: `${username}.${this.config.domain}`,
          ttl: 1,
          proxied: false
        })
      }).then(res => res.json())
    ));

    return {
      success: results.every(r => r.success),
      results
    };
  }

  async getDigitalOceanRecords(username) {
    const response = await fetch(
      `https://api.digitalocean.com/v2/domains/${this.config.domain}/records?type=TXT&name=${username}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      }
    );
    const data = await response.json();
    return data.domain_records || [];
  }

  async updateDigitalOceanRecords(username, records) {
    // First delete existing records
    const existing = await this.getDigitalOceanRecords(username);
    await Promise.all(existing.map(record =>
      fetch(`https://api.digitalocean.com/v2/domains/${this.config.domain}/records/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      })
    ));

    // Then create new records
    const results = await Promise.all(records.map(record =>
      fetch(`https://api.digitalocean.com/v2/domains/${this.config.domain}/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...record,
          name: username,
          data: record.content
        })
      }).then(res => res.json())
    ));

    return {
      success: results.every(r => r.domain_record),
      results
    };
  }
}

module.exports = DNSService;
