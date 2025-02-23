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
        window.plausible('Theme Toggle', { props: { theme: newTheme } });
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

                <!-- user profile based content -->                        
                <div class="profile-content loading">
                    <div class="profile-header" style="display: flex; align-items: flex-start;">
                        <div class="profile-image-container" style="padding-top: 2dvh; margin-bottom: -4dvh;">
                            <img src="assets/imgs/default-avatar.svg" alt="Profile" class="profile-image" />
                        </div>
                       
                    </div>
                    <div class="profile-details">
                        <div class="profile-info" style="flex: 1; padding-top: 2dvh;">
                            <h1 class="profile-name">Loading...</h1>
                            <p class="profile-bio">Loading profile information...</p>

                            <div class="website-section" style="margin-top: 2dvh; display: none;">Website: 
                                <a href="#" target="_blank" rel="noopener noreferrer" class="website-link" style="font-size: 1.2em; text-decoration: none;"></a>
                            </div>
                        </div>

                        <!-- nostr based content -->                        
                        <hr style="margin-bottom: 2dvh; margin-top: 2dvh;">
                        <div class="detail-group">
                            <div style="margin-bottom: 1dvh;">
                                <label>Nostr Address</label>
                                <div style="display: flex; align-items: center; gap: 4dvw;">
                                <textarea class="npub-textarea" readonly onclick="this.select()" style="height: 38px; resize: none; vertical-align: middle; padding-top: 8px;">${npub}</textarea>
                                <button onclick="copyNpub()" class="copy-npub-button" style="white-space: nowrap; height: 38px; vertical-align: middle; display: flex; align-items: center;">
                            <i class="fas fa-copy"></i> Copy nPub
                        </button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="qr-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="qr-title">
                <div class="modal-content">
                    <button class="modal-close" onclick="toggleQRModal()" aria-label="Close QR code" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-body" style="flex-direction: column;">
                        <div id="qr-modal-content"></div>
                        <div style="display: flex; align-items: center; gap: 4dvw; max-width: 18rem; margin-top: 2dvh; text-align: center;">
                        <p>Scan with your camera to visit this profile on a light-weight web app.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lists section -->
            <div id="nostr-lists" class="info-section" style="margin: 4dvh auto 0; padding: 2dvh; background: var(--bg-secondary); border-radius: 8px; max-width: 800px; width: calc(100% - 4dvh);">
                <h3 style="margin-bottom: 2dvh; color: var(--text-primary);">Lists</h3>
                <div id="lists-container" style="display: grid; gap: 2dvh;">
                    <!-- Lists will be dynamically inserted here -->
                </div>
            </div>

            <!-- about nostr verification -->
            <div class="info-section" style="margin: 4dvh auto 0; padding: 2dvh; background: var(--bg-secondary); border-radius: 8px; font-size: 0.9em; color: var(--text-secondary); max-width: 800px; width: calc(100% - 4dvh);">
                <h3 style="margin-bottom: 1dvh;">About Nostr Verification</h3>
                <p>A "<a href="https://github.com/nostr-protocol/nips/blob/master/05.md" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">Verified As</a>" address (NIP-05) on Nostr is similar to how email works - the same username can exist on different platforms. For example, "user@platform1.com" and "user@platform2.com" are different verifications.</p>
                <p style="margin-top: 1dvh;">This means that while someone may be verified as "username@domain", they could potentially have different verifications on other domains. Always check the full verification address to confirm the specific platform where the verification was performed.</p>
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
                const profileName = document.querySelector('.profile-name');
                const verifiedBadge = profile.nip05 ? '<i class="fas fa-check-circle" style="color: #3498db; margin-left: 0.5dvh;"></i>' : '';
                profileName.innerHTML = 
                    `${profile.displayName}${verifiedBadge} ${profile.name ? `• @${profile.name}` : ''}`;
                document.querySelector('.profile-bio').textContent = 
                    profile.about || 'No bio available';
                
                // Add additional profile details if available
                const detailsContainer = document.querySelector('.profile-details');
                
                if (profile.website) {
                    const websiteSection = document.querySelector('.website-section');
                    const websiteLink = document.querySelector('.website-link');
                    websiteSection.style.display = 'block';
                    websiteLink.href = profile.website;
                    const displayUrl = profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    websiteLink.textContent = displayUrl;
                }

                // Create flex container for verification and lightning
                detailsContainer.insertAdjacentHTML('beforeend', '<div class="flex-container" style="display: flex; gap: 2dvh; margin-top: 2dvh;"></div>');
                const flexContainer = document.querySelector('.flex-container');

                if (profile.nip05) {
                    flexContainer.insertAdjacentHTML('beforeend', `
                        <div class="detail-group" style="flex: 1;">
                            <label>Verified As: </label>
                            <code>${profile.nip05}</code>
                        </div>
                    `);
                }
                
                if (profile.lightning) {
                    flexContainer.insertAdjacentHTML('beforeend', `
                        <div class="detail-group" style="flex: 1;">
                            <label>Lightning Address: </label>
                            <code>${profile.lightning}</code>
                        </div>
                    `);
                }

                // Add QR and Copy buttons after the flex container
                detailsContainer.insertAdjacentHTML('beforeend', `
                    <div id="qr-container" style="margin-top: 2dvh; display: flex; gap: 1dvh; flex-wrap: wrap;">
                        <style>
                            @media (max-width: 768px) {
                                #qr-container {
                                    justify-content: center;
                                }
                            }
                        </style>
                        <button onclick="toggleQRModal()" class="qr-button">
                            <i class="fas fa-qrcode"></i> Show QR Code
                        </button>
                        <button onclick="copyProfileUrl()" class="copy-button">
                            <i class="fas fa-copy"></i> Copy URL
                        </button>
                    </div>
                `);
                
                // Remove loading state
                document.querySelector('.profile-content').classList.remove('loading');
                
                // Initialize textarea
                initializeTextarea();
                
                // Fetch and display lists if profile has npub
                if (profile.npub) {
                    try {
                        const listsResponse = await fetch(`/api/profile/${profile.npub}/lists`);
                        const lists = await listsResponse.json();
                        displayLists(lists);
                    } catch (error) {
                        console.warn('Failed to fetch lists:', error);
                    }
                }
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

function initializeTextarea() {
    const textarea = document.querySelector('.npub-textarea');
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        
        // Add click handler to select all text
        textarea.addEventListener('click', function() {
            this.select();
        });
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
    const copyButton = document.querySelector('.copy-button');
    const originalText = copyButton.innerHTML;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
        } else {
            // Fallback for non-HTTPS or when Clipboard API is not available
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Failed to copy using execCommand:', err);
                throw err;
            } finally {
                textArea.remove();
            }
        }
        
        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
        window.plausible('Copy Profile URL');
    } catch (err) {
        console.error('Failed to copy URL:', err);
        copyButton.innerHTML = '<i class="fas fa-times"></i> Failed to copy';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    }
}

// Copy npub to clipboard
async function copyNpub() {
    const npub = window.location.hash.split('/').pop();
    const copyNpubButton = document.querySelector('.copy-npub-button');
    const originalText = copyNpubButton.innerHTML;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(npub);
        } else {
            // Fallback for non-HTTPS or when Clipboard API is not available
            const textArea = document.createElement('textarea');
            textArea.value = npub;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Failed to copy using execCommand:', err);
                throw err;
            } finally {
                textArea.remove();
            }
        }

        copyNpubButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyNpubButton.innerHTML = originalText;
        }, 2000);
        window.plausible('Copy Npub');
    } catch (err) {
        console.error('Failed to copy npub:', err);
        copyNpubButton.innerHTML = '<i class="fas fa-times"></i> Failed to copy';
        setTimeout(() => {
            copyNpubButton.innerHTML = originalText;
        }, 2000);
    }
}

// QR Code Modal Toggle
function toggleQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        const isShowing = !modal.classList.contains('show');
        if (isShowing) {
            modal.classList.add('show');
            // Focus the close button for keyboard accessibility
            const closeButton = modal.querySelector('.modal-close');
            if (closeButton) {
                closeButton.focus();
            }
            // Add click event listener to close when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    toggleQRModal();
                }
            });
            // Add escape key listener
            document.addEventListener('keydown', handleEscapeKey);
            window.plausible('View QR Code');
        } else {
            modal.classList.remove('show');
            // Remove event listeners
            modal.removeEventListener('click', toggleQRModal);
            document.removeEventListener('keydown', handleEscapeKey);
        }
    }
}

// Handle escape key press for modal
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        toggleQRModal();
    }
}

// Display lists
function displayLists(lists) {
    const container = document.getElementById('lists-container');
    const listsSection = document.getElementById('nostr-lists');
    
    if (!lists || Object.keys(lists).length === 0) {
        listsSection.style.display = 'none';
        return;
    }

    listsSection.style.display = 'block';
    container.innerHTML = Object.values(lists).map(list => `
        <div class="list-card" style="background: var(--bg-primary); padding: 2dvh; border-radius: 8px; border: 1px solid var(--border-color);">
            <h4 style="margin: 0 0 1dvh; color: var(--text-primary);">${escapeHtml(list.title)}</h4>
            ${list.description ? `<p style="margin: 0 0 1.5dvh; color: var(--text-secondary); font-size: 0.9em;">${escapeHtml(list.description)}</p>` : ''}
            <div class="list-items" style="display: grid; gap: 1dvh;">
                ${list.items.map(item => {
                    if (item.type === 'l') {
                        return `<a href="${escapeHtml(item.value)}" target="_blank" rel="noopener noreferrer" 
                                  style="color: var(--text-primary); text-decoration: none; display: flex; align-items: center; gap: 0.5dvh;">
                                  <span style="color: var(--text-secondary);">🔗</span>
                                  ${escapeHtml(item.title || item.value)}
                               </a>`;
                    } else if (item.type === 'e') {
                        return `<a href="https://njump.me/${item.value}" target="_blank" rel="noopener noreferrer" 
                                  style="color: var(--text-primary); text-decoration: none; display: flex; align-items: center; gap: 0.5dvh;">
                                  <span style="color: var(--text-secondary);">📝</span>
                                  Note
                               </a>`;
                    } else if (item.type === 'p') {
                        return `<a href="https://njump.me/${item.value}" target="_blank" rel="noopener noreferrer" 
                                  style="color: var(--text-primary); text-decoration: none; display: flex; align-items: center; gap: 0.5dvh;">
                                  <span style="color: var(--text-secondary);">👤</span>
                                  Profile
                               </a>`;
                    }
                    return '';
                }).join('')}
            </div>
            <div style="margin-top: 1.5dvh; font-size: 0.8em; color: var(--text-secondary);">
                ${new Date(list.created_at * 1000).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

// Escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Make functions available globally
window.handleNpubSubmit = handleNpubSubmit;
window.copyProfileUrl = copyProfileUrl;
window.copyNpub = copyNpub;
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
