# Setting up maiqr.bio API POC

This guide walks through setting up the maiqr.bio API POC for local development and testing.

## Prerequisites
- Node.js installed
- npm installed
- Cloudflare account with access to maiqr.bio domain
- Git (for cloning the repository)

## Installation Steps

1. **Install Dependencies**
```bash
cd /path/to/maiqrbio-template-one_page_profile/COLAB-DOCS/API_POC
npm install
```

2. **Get Cloudflare Credentials**

You'll need two pieces of information from Cloudflare:

a) **Zone ID**:
   - Log into Cloudflare dashboard
   - Select maiqr.bio domain
   - Find "Zone ID" on the right side of overview page
   - Copy this value

b) **API Token**:
   - Click profile icon (top right)
   - Select "My Profile"
   - Click "API Tokens" in left sidebar
   - Click "Create Token"
   - Choose "Create Custom Token"
   - Configure permissions:
     ```
     Token name: maiqr-bio-dns-manager
     Permissions:
     - Zone - DNS - Edit
     - Zone - Zone - Read
     Zone Resources:
     - Include - Specific zone - maiqr.bio
     ```
   - Click "Continue to summary" then "Create Token"
   - **IMPORTANT**: Copy token immediately (won't be shown again)

3. **Configure Environment**

Create a `.env` file in the API_POC directory:
```env
DNS_PROVIDER=cloudflare
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
PORT=3000
NODE_ENV=development
```

## Running the API

1. **Start Development Server**
```bash
npm run dev
```

2. **Test Endpoints**

Create a profile:
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "npub": "npub1xxxxxx",
    "relays": ["wss://relay.damus.io"],
    "url": "https://example.com"
  }'
```

Lookup a profile:
```bash
curl http://localhost:3000/api/profile/test
```

## API Documentation

### POST /api/profile
Creates or updates a user profile with DNS records.

Request body:
```json
{
  "username": "string",
  "npub": "string (starts with npub1)",
  "relays": ["array of wss:// URLs"],
  "url": "string (optional)"
}
```

### GET /api/profile/:username
Retrieves a user's profile information.

Response:
```json
{
  "username": "string",
  "dns": "string (username.maiqr.bio)",
  "npub": "string",
  "relays": ["array of relay URLs"],
  "url": "string (optional)"
}
```

## Security Notes

1. Never commit the `.env` file
2. Keep your API token secure
3. You can revoke the token anytime in Cloudflare dashboard
4. The API has rate limiting enabled (100 requests per 15 minutes)

## Troubleshooting

1. **DNS Propagation**
   - DNS changes may take time to propagate
   - Use `dig TXT username.maiqr.bio` to verify records

2. **API Errors**
   - Check `.env` file configuration
   - Verify API token permissions
   - Ensure valid relay URLs (must start with wss://)

## Additional Resources

- [NIP-65 Documentation](https://github.com/nostr-protocol/nips/blob/master/65.md)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [DNS TXT Record Documentation](https://www.cloudflare.com/learning/dns/dns-records/dns-txt-record/)
