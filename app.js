// Import dependencies
import { nostrProfileFetcher } from './js/nostr-utils.js';

console.log('Starting app initialization...');

// Make Buffer available globally for nostr-crypto-utils
if (typeof window.Buffer === 'undefined' && typeof Buffer !== 'undefined') {
    console.log('Setting up Buffer globally');
    window.Buffer = Buffer;
}

// App State Management
const AppState = {
    isInitialized: false,
    currentTheme: null,
    router: null,
    
    async initialize() {
        console.log('AppState.initialize() called');
        if (this.isInitialized) {
            console.log('App already initialized, skipping...');
            return;
        }
        
        try {
            // Initialize theme first
            console.log('Initializing theme...');
            await this.initializeTheme();
            console.log('Theme initialized successfully');
            
            // Initialize router
            console.log('Initializing router...');
            this.initializeRouter();
            console.log('Router initialized successfully');
            
            // Mark as initialized
            this.isInitialized = true;
            console.log('App initialization complete');
            
            // Remove loading state
            document.documentElement.classList.remove('loading');
            
            // Get npub from URL if on maiqr.bio
            const path = window.location.pathname;
            const npubMatch = path.match(/\/p\/(npub[a-zA-Z0-9]+)/);
            
            if (npubMatch) {
                console.log('Found npub in URL:', npubMatch[1]);
                // If we have an npub in the URL, navigate to its profile
                window.location.hash = `#/p/${npubMatch[1]}`;
            }
        } catch (error) {
            console.error('Error during app initialization:', error);
        }
    },
    
    async initializeTheme() {
        console.log('initializeTheme() called');
        // Get system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('System prefers dark mode:', prefersDark);
        
        // Get saved theme or use system preference
        this.currentTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
        console.log('Current theme:', this.currentTheme);
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        updateThemeIcon(this.currentTheme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            console.log('System theme changed, matches dark:', e.matches);
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                updateThemeIcon(this.currentTheme);
            }
        });
    },
    
    initializeRouter() {
        console.log('initializeRouter() called');
        this.router = new Router([
            { pattern: '^#/$', view: views.home },
            { pattern: '^#/p/.*', view: views.profile },
            { pattern: '^#/404$', view: views.notFound },
            { pattern: '*', view: views.home }
        ]);
        console.log('Router initialized with routes');
    },
    
    toggleTheme() {
        console.log('toggleTheme() called');
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        console.log('Theme toggled to:', newTheme);
    }
};

// Router Class
class Router {
    constructor(routes) {
        console.log('Router constructor called');
        this.routes = routes;
        this.handleRoute = this.handleRoute.bind(this);
        
        // Handle hash changes
        window.addEventListener('hashchange', this.handleRoute);
        console.log('Hash change listener added');
        this.handleRoute(); // Initial route handling
    }
    
    handleRoute() {
        console.log('handleRoute() called');
        const hash = window.location.hash || '#/';
        console.log('Current hash:', hash);
        
        // Special handling for profile routes
        if (hash.startsWith('#/p/')) {
            const npub = hash.replace('#/p/', '');
            console.log('Processing profile route for npub:', npub);
            if (!this.isValidNpub(npub)) {
                console.log('Invalid npub, redirecting to 404');
                this.navigate('/404');
                return;
            }
        }
        
        const route = this.routes.find(r => hash.match(r.pattern)) || this.routes.find(r => r.pattern === '*');
        console.log('Found matching route:', route?.pattern);
        
        if (route) {
            const app = document.getElementById('app');
            if (!app) {
                console.error('Could not find app element!');
                return;
            }
            console.log('Rendering view for route:', route.pattern);
            app.innerHTML = route.view();
            route.afterRender && route.afterRender();
        }
    }
    
    navigate(path) {
        console.log('navigate() called with path:', path);
        window.location.hash = path;
    }
    
    isValidNpub(npub) {
        const isValid = npub && npub.startsWith('npub1') && npub.length === 63;
        console.log('Validating npub:', npub, 'Result:', isValid);
        return isValid;
    }
}

// Views
const views = {
    home: () => `
        <div class="container">
            <div class="npub-form-container">
            <h1 style="margin-bottom: -.5rem;">Lazy-Links for Nostr Profiles</h1>
            <h3 style="margin: -2rem, 0">... with fewer hassles</h3>
            <p>To get started, visit <code>#/p/npub...</code> to see a profile, or enter an npub to create one.</p>
                <hr style="margin: 1rem 0;">
                <div class="npub-form">
                    <div class="input-group">
                        <input type="text" id="npub-input" placeholder="Enter npub..." />
                        <button onclick="handleNpubSubmit()">View Profile</button>
                    </div>
                    <div id="npub-error" class="error-message"></div>
                </div>
            </div>
        </div>
    `,
    
    notFound: () => `
        <div class="container">
            <div class="not-found">
                <h1>404 - Page Not Found</h1>
                <p>The profile you're looking for doesn't exist or the npub is invalid.</p>
                <p>A valid npub should:</p>
                <ul>
                    <li>Start with "npub1"</li>
                    <li>Be exactly 63 characters long</li>
                    <li>Contain only letters and numbers</li>
                </ul>
                <a href="#/" class="button">Go Home</a>
            </div>
        </div>
    `,
    
    profile: () => {
        const npub = window.location.hash.replace('#/p/', '');
        
        // Validate npub format
        if (!npub || !npub.startsWith('npub1') || npub.length !== 63) {
            window.location.hash = '/404';
            return views.notFound();
        }
        
        // Show loading state
        const view = `
            <div class="container">
                <div class="profile-content loading">
                    <div class="profile-header">
                        <div class="profile-image-container">
                            <img src="assets/imgs/default-avatar.svg" alt="Profile" class="profile-image" />
                        </div>
                        <div class="profile-info">
                            <h1 class="profile-name">Loading...</h1>
                            <p class="profile-bio">Loading profile information...</p>
                        </div>
                    </div>
                    <div class="profile-details">
                        <div class="detail-group">
                            <label>Nostr Address</label>
                            <code class="npub-display">${npub}</code>
                            <button onclick="copyProfileUrl()" class="copy-button">
                                <i class="fas fa-copy"></i> Copy URL
                            </button>
                        </div>
                    </div>
                    <div id="qr-container">
                        <button onclick="toggleQRModal()" class="qr-button">
                            <i class="fas fa-qrcode"></i> Show QR Code
                        </button>
                    </div>
                </div>
            </div>
            <div id="qr-modal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="toggleQRModal()">&times;</span>
                    <div id="qr-modal-content"></div>
                </div>
            </div>
        `;
        
        // After view is rendered, fetch profile data
        setTimeout(async () => {
            try {
                const profile = await nostrProfileFetcher.fetchProfile(npub);
                
                // Update profile image
                const profileImage = document.querySelector('.profile-image');
                if (profile.picture) {
                    profileImage.src = profile.picture;
                }
                
                // Update name and bio
                document.querySelector('.profile-name').textContent = 
                    `${profile.displayName} ${profile.name ? `• @${profile.name}` : ''}`;
                document.querySelector('.profile-bio').textContent = 
                    profile.about || 'No bio available';
                
                // Add additional profile details if available
                const detailsContainer = document.querySelector('.profile-details');
                
                if (profile.nip05) {
                    detailsContainer.insertAdjacentHTML('beforeend', `
                        <div class="detail-group">
                            <label>Verified As</label>
                            <code>${profile.nip05}</code>
                        </div>
                    `);
                }
                
                if (profile.lightning) {
                    detailsContainer.insertAdjacentHTML('beforeend', `
                        <div class="detail-group">
                            <label>Lightning Address</label>
                            <code>${profile.lightning}</code>
                        </div>
                    `);
                }
                
                if (profile.website) {
                    detailsContainer.insertAdjacentHTML('beforeend', `
                        <div class="detail-group">
                            <label>Website</label>
                            <a href="${profile.website}" target="_blank" rel="noopener noreferrer">${profile.website}</a>
                        </div>
                    `);
                }
                
                // Remove loading state
                document.querySelector('.profile-content').classList.remove('loading');
                
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                document.querySelector('.profile-bio').textContent = 
                    'Failed to load profile information. Please try again later.';
                document.querySelector('.profile-content').classList.remove('loading');
            }
            
            // Generate QR code
            const qrContainer = document.getElementById('qr-modal-content');
            if (qrContainer) {
                const qr = qrcode(0, 'L');
                qr.addData(`nostr:${npub}`);
                qr.make();
                qrContainer.innerHTML = qr.createImgTag(5);
            }
        }, 0);
        
        return view;
    }
};

// Helper functions
function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Handle npub form submission
function handleNpubSubmit() {
    const input = document.getElementById('npub-input');
    const errorDiv = document.getElementById('npub-error');
    
    const npub = input.value.trim();
    
    // Clear previous error
    errorDiv.textContent = '';
    input.classList.remove('error');
    
    // Validate input
    if (!npub) {
        errorDiv.textContent = 'Please enter a npub';
        input.classList.add('error');
        return;
    }
    
    // Basic npub format validation
    const cleanNpub = npub.replace(/^#?\/p\//, '').replace(/^nostr:/, '');
    if (!cleanNpub.startsWith('npub1') || cleanNpub.length !== 63) {
        errorDiv.textContent = 'Invalid npub format. It should start with "npub1" and be 63 characters long.';
        input.classList.add('error');
        return;
    }
    
    // If validation passes, navigate to profile
    window.location.hash = `/p/${cleanNpub}`;
}

// Copy profile URL to clipboard
async function copyProfileUrl() {
    const url = window.location.href;
    try {
        await navigator.clipboard.writeText(url);
        const copyButton = document.querySelector('.copy-button');
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy URL:', err);
    }
}

// QR Code Modal Toggle
function toggleQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.classList.toggle('show');
    }
}

// Make functions available globally
window.handleNpubSubmit = handleNpubSubmit;
window.copyProfileUrl = copyProfileUrl;
window.toggleQRModal = toggleQRModal;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    try {
        // Add theme toggle listener
        const themeToggle = document.querySelector('.theme-toggle');
        console.log('Theme toggle element found:', !!themeToggle);
        themeToggle?.addEventListener('click', () => AppState.toggleTheme());
        
        // Initialize app
        console.log('Starting AppState initialization...');
        AppState.initialize();
    } catch (error) {
        console.error('Error during DOM ready initialization:', error);
    }
});
