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
        
        if (npubMatch) {
            // If we have an npub in the URL, navigate to its profile
            window.location.hash = `#/p/${npubMatch[1]}`;
        }
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
            { pattern: '^#/404$', view: views.notFound },
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
        
        // Special handling for profile routes
        if (hash.startsWith('#/p/')) {
            const npub = hash.replace('#/p/', '');
            if (!this.isValidNpub(npub)) {
                this.navigate('/404');
                return;
            }
        }
        
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
    
    isValidNpub(npub) {
        return npub && npub.startsWith('npub1') && npub.length === 63;
    }
}

import { nostrProfileFetcher } from './js/nostr-utils.js';

// Views
const views = {
    home: () => `
        <div class="container">
            <h1>MaiQR.bio</h1>
            <p>To get started, visit <code>#/p/npub...</code> to see a profile, or enter an npub to create one.</p>
            <div class="npub-form-container">
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
    },
};

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

// QR Code Modal Toggle
function toggleQRModal() {
    const modal = document.getElementById('qr-modal');
    modal.classList.toggle('show');
    
    // Close modal when clicking outside
    if (modal.classList.contains('show')) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                toggleQRModal();
            }
        };
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
