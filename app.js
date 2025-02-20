// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Simple hash-based router for static hosting
class Router {
    constructor(routes) {
        this.routes = routes;
        this.handleRoute = this.handleRoute.bind(this);
        
        // Handle hash changes
        window.addEventListener('hashchange', this.handleRoute);
        window.addEventListener('load', () => {
            initTheme();
            this.handleRoute();
        });
    }

    handleRoute() {
        const hash = window.location.hash || '#/';
        const route = this.routes.find(r => hash.match(r.pattern)) || this.routes.find(r => r.pattern === '*');
        
        if (route) {
            const app = document.getElementById('app');
            app.innerHTML = route.view();
            route.afterRender && route.afterRender();
        }
    }

    navigate(path) {
        window.location.hash = path;
    }
}

// Views
const views = {
    home: () => `
        <div class="container">
            <h1>Hello World</h1>
            <p>Welcome to maiqr.bio</p>
            <p>Try visiting <code>#/p/npub...</code> to see a profile</p>
            <div class="npub-form">
                <input type="text" id="npub-input" placeholder="Enter npub..." />
                <button onclick="handleNpubSubmit()">View Profile</button>
            </div>
        </div>
    `,
    
    profile: () => {
        const npub = window.location.hash.split('/p/')[1];
        return `
            <div class="container">
                <h1>Profile Page</h1>
                <p>Profile goes here for: ${npub || 'unknown'}</p>
                <p><a href="#/">Back to Home</a></p>
            </div>
        `;
    }
};

// Handle npub form submission
function handleNpubSubmit() {
    const input = document.getElementById('npub-input');
    const npub = input.value.trim();
    if (npub) {
        // Remove any existing hash or /p/ prefix
        const cleanNpub = npub.replace(/^#?\/p\//, '').replace(/^nostr:/, '');
        window.location.hash = `/p/${cleanNpub}`;
    }
}

// Routes configuration (using hash-based patterns)
const routes = [
    { pattern: '^#/$', view: views.home },
    { pattern: '^#/p/.*', view: views.profile },
    { pattern: '*', view: views.home }  // Default route
];

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    new Router(routes);
    
    // Add theme toggle listener
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Apply theme
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.theme.primaryColor);
    root.style.setProperty('--background-color', config.theme.backgroundColor);
    root.style.setProperty('--text-color', config.theme.textColor);
    root.style.setProperty('--secondary-color', config.theme.secondaryColor);

    // Get npub from URL if on maiqr.bio
    const path = window.location.pathname;
    const npubMatch = path.match(/\/p\/(npub[a-zA-Z0-9]+)/);
    const npub = npubMatch ? npubMatch[1] : config.profile.npub;

    // Update profile information
    document.getElementById('profile-name').textContent = config.profile.name;
    document.getElementById('profile-about').textContent = config.profile.about;
    document.getElementById('profile-picture').src = config.profile.picture;
    
    if (npub) {
        document.getElementById('profile-npub').textContent = npub;
        
        // Generate QR code
        const qrContainer = document.getElementById('qr-code');
        QRCode.toCanvas(qrContainer, `nostr:${npub}`, {
            width: 256,
            margin: 4,
            color: {
                dark: config.theme.textColor,
                light: '#ffffff'
            }
        });

        // Use nostr-crypto-utils for profile data fetching
        try {
            const { decodeNpub } = await import('nostr-crypto-utils');
            const pubkey = decodeNpub(npub);
            
            // TODO: Add profile fetching logic using nostr-crypto-utils
            // This will be implemented once we have the proper relay connection setup
            
        } catch (error) {
            console.error('Error decoding npub:', error);
        }
    }

    // Add social links
    const socialLinksContainer = document.getElementById('social-links');
    config.socialLinks.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'social-link';
        a.textContent = link.name;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        socialLinksContainer.appendChild(a);
    });
});
