// App State Management
const AppState = {
    isInitialized: false,
    currentTheme: null,
    router: null,
    
    async initialize() {
        if (this.isInitialized) return;
        
        // Initialize theme first
        await this.initializeTheme();
        
        // Initialize router
        this.initializeRouter();
        
        // Mark as initialized
        this.isInitialized = true;
        
        // Remove loading state
        document.documentElement.classList.remove('loading');
        
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
    },
    
    async initializeTheme() {
        // Get system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Get saved theme or use system preference
        this.currentTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon(this.currentTheme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                this.updateThemeIcon(this.currentTheme);
            }
        });
    },
    
    initializeRouter() {
        this.router = new Router([
            { pattern: '^#/$', view: views.home },
            { pattern: '^#/p/.*', view: views.profile },
            { pattern: '*', view: views.home }
        ]);
    },
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeIcon(this.currentTheme);
    },
    
    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            if (theme === 'light') {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            } else {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }
};

// Router Class
class Router {
    constructor(routes) {
        this.routes = routes;
        this.handleRoute = this.handleRoute.bind(this);
        
        // Handle hash changes
        window.addEventListener('hashchange', this.handleRoute);
        this.handleRoute(); // Initial route handling
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
            <h1>#Helloworld</h1>
            <p>Welcome to maiqr.bio</p>
            <p>Try visiting <code>#/p/npub...</code> to see a profile</p>
            <div class="npub-form">
                <input type="text" id="npub-input" placeholder="Enter npub..." />
                <button onclick="handleNpubSubmit()">View Profile</button>
            </div>
        </div>
    `,
    
    profile: () => {
        const npub = window.location.hash.replace('#/p/', '');
        return `
            <div class="container">
                <div class="profile-card">
                    <div class="profile-header">
                        <img src="assets/imgs/default-avatar.svg" alt="Profile" class="profile-avatar">
                        <div class="profile-info">
                            <h1 class="profile-name profile-placeholder">Satoshi Nakamoto</h1>
                            <a href="#" class="profile-website profile-placeholder">https://bitcoin.org</a>
                            <p class="profile-bio profile-placeholder">Creator of Bitcoin. Focused on decentralization, cryptography, and digital currencies. Building tools for financial freedom.</p>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <a href="#/" class="back-link">← Back to Home</a>
                        <button class="copy-url-btn" onclick="copyProfileUrl()">
                            <i class="fas fa-copy"></i>
                            <span class="copy-text">Copy maiqr.bio Profile URL</span>
                        </button>
                    </div>
                </div>
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

// Copy profile URL to clipboard
async function copyProfileUrl() {
    const url = window.location.href;
    try {
        await navigator.clipboard.writeText(url);
        const btn = document.querySelector('.copy-url-btn');
        const text = btn.querySelector('.copy-text');
        const icon = btn.querySelector('i');
        
        // Update button state
        btn.classList.add('copied');
        text.textContent = 'Copied!';
        icon.classList.remove('fa-copy');
        icon.classList.add('fa-check');
        
        // Reset button state after 2 seconds
        setTimeout(() => {
            btn.classList.remove('copied');
            text.textContent = 'Copy Profile URL';
            icon.classList.remove('fa-check');
            icon.classList.add('fa-copy');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy URL:', err);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add theme toggle listener
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', () => AppState.toggleTheme());
    
    // Initialize app
    AppState.initialize();
});
