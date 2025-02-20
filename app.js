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
        
        // Generate QR code after the view is rendered
        setTimeout(() => {
            const qrContainer = document.getElementById('qr-modal-content');
            if (qrContainer && window.QRCode) {
                qrContainer.innerHTML = ''; // Clear existing content
                new QRCode(qrContainer, {
                    text: `nostr:${npub}`,
                    width: 256,
                    height: 256,
                    colorDark: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
                    colorLight: getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim(),
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }, 0);

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
                        <div class="action-buttons">
                            <button class="qr-code-btn" onclick="toggleQRModal()">
                                <i class="fas fa-qrcode"></i>
                                <span>Show QR Code</span>
                            </button>
                            <button class="copy-url-btn" onclick="copyProfileUrl()">
                                <i class="fas fa-copy"></i>
                                <span class="copy-text">Copy maiqr.bio Profile URL</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- QR Code Modal -->
            <div id="qr-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Scan QR Code</h2>
                        <button onclick="toggleQRModal()" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="qr-modal-content" class="modal-body"></div>
                    <div class="modal-footer">
                        <p class="modal-note">Scan to view profile in a Nostr client</p>
                    </div>
                </div>
            </div>
        `;
    }
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
