// Reserved subdomains for maiqr.bio
const RESERVED_NAMES = {
  // System and API endpoints
  'api': 'API endpoint',
  'relay': 'Nostr relay endpoint',
  'www': 'Web endpoint',
  'admin': 'Administrative access',
  'dns': 'DNS services',
  'mail': 'Email services',
  'smtp': 'Email server',
  'mx': 'Mail exchange',
  'ns': 'Nameserver prefix',
  'ns1': 'Nameserver 1',
  'ns2': 'Nameserver 2',
  
  // Service-specific
  'app': 'Application endpoint',
  'docs': 'Documentation',
  'help': 'Help and support',
  'support': 'Support services',
  'status': 'System status',
  'blog': 'Blog platform',
  'news': 'News and updates',
  
  // Authentication and security
  'auth': 'Authentication service',
  'login': 'Login service',
  'oauth': 'OAuth service',
  'secure': 'Security services',
  
  // Generic terms
  'test': 'Testing purposes',
  'dev': 'Development environment',
  'staging': 'Staging environment',
  'prod': 'Production environment',
  'demo': 'Demonstration',
  
  // Nostr specific
  'nostr': 'Nostr protocol',
  'relay': 'Nostr relay',
  'nip05': 'NIP-05 verification',
  
  // Brand protection
  'maiqr': 'Brand name',
  'maiqrbio': 'Brand name',
  'maiqrapp': 'Brand name',
  'official': 'Official content',
  'verify': 'Verification service'
};

// Helper functions for name validation
const nameValidation = {
  isReserved: (name) => {
    return RESERVED_NAMES.hasOwnProperty(name.toLowerCase());
  },
  
  getReservationReason: (name) => {
    return RESERVED_NAMES[name.toLowerCase()];
  },
  
  validateUsername: (name) => {
    // Convert to lowercase for consistent checking
    name = name.toLowerCase();
    
    // Check if reserved
    if (nameValidation.isReserved(name)) {
      return {
        valid: false,
        reason: `'${name}' is reserved for ${RESERVED_NAMES[name]}`
      };
    }
    
    // Check length (adjust these values as needed)
    if (name.length < 3) {
      return {
        valid: false,
        reason: 'Username must be at least 3 characters long'
      };
    }
    if (name.length > 63) {
      return {
        valid: false,
        reason: 'Username must be less than 64 characters'
      };
    }
    
    // Check characters (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(name)) {
      return {
        valid: false,
        reason: 'Username can only contain lowercase letters, numbers, and hyphens'
      };
    }
    
    // Check start/end characters
    if (name.startsWith('-') || name.endsWith('-')) {
      return {
        valid: false,
        reason: 'Username cannot start or end with a hyphen'
      };
    }
    
    // All checks passed
    return {
      valid: true,
      reason: null
    };
  }
};

module.exports = {
  RESERVED_NAMES,
  nameValidation
};
