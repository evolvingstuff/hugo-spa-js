/**
 * LightSPA - Lightweight Single Page Application for Hugo sites
 * 
 * A minimal SPA implementation that handles client-side navigation while preserving
 * state (search, scroll position) and maintaining browser history.
 * 
 * Features:
 * - Client-side navigation without page reloads
 * - Preserves search index and state between pages
 * - Maintains browser history and scroll positions
 * - Handles internal/external links appropriately
 * - Efficient content caching in history state
 * 
 * Usage:
 * 1. Add role="main" to your main content area:
 *    <main role="main">{{ .Content }}</main>
 * 
 * 2. Add data-spa-nav to navigation regions (optional):
 *    <nav data-spa-nav>...</nav>
 * 
 * 3. Initialize LightSPA:
 *    const spa = new LightSPA({
 *      mainContentSelector: 'main[role="main"]',  // Content area selector
 *      navigationSelector: '[data-spa-nav]'       // Navigation area selector
 *    });
 * 
 * Events:
 * - 'spaContentUpdated': Fired after content updates, with detail: { url, pushState }
 * 
 * State Management:
 * - Each state includes: url, title, content, scrollPosition, index
 * - Content is cached to avoid refetching
 * - Scroll positions are preserved during back/forward navigation
 */
class LightSPA {
    constructor(config = {}) {
        // Default configuration
        this.config = {
            mainContentSelector: 'main[role="main"]',
            navigationSelector: '[data-spa-nav]',
            ...config
        };

        // Store bound handler for proper removal
        this.boundHandleClick = this.handleClick.bind(this);
        this.init();
    }

    /**
     * Initialize the SPA
     * Sets up event listeners and saves initial state
     */
    init() {
        // Store references to key DOM elements
        this.mainContent = document.querySelector(this.config.mainContentSelector);
        this.navigationElements = document.querySelectorAll(this.config.navigationSelector);
        this.searchResults = document.getElementById('search-results');

        if (!this.mainContent) {
            return;
        }

        // Handle initial state and back/forward navigation
        window.addEventListener('popstate', (e) => this.handlePopState(e));

        // Handle all internal link clicks
        document.addEventListener('click', this.boundHandleClick);

        // Save initial state with a flag indicating it's the SPA session start
        const initialState = {
            url: window.location.href,
            title: document.title,
            content: this.mainContent.innerHTML,
            scrollPosition: { x: window.scrollX, y: window.scrollY },
            isInitialState: true,
            index: 0
        };
        history.replaceState(initialState, document.title, window.location.href);
        this.currentIndex = 0;
    }

    initializeEventListeners() {
        // Only handle search results since document handler covers everything else
        if (this.searchResults && !this.searchResults.dataset.spaInitialized) {
            this.searchResults.dataset.spaInitialized = 'true';
        }
    }

    /**
     * Handle internal link clicks
     * @param {Event} e - The click event
     */
    async handleClick(e) {
        const link = e.target.closest('a');
        if (!link) return;

        if (this.isInternalLink(link)) {
            e.preventDefault();
            await this.navigateTo(link.href);
        } else {
            // Ensure external links open in new tab
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
    }

    /**
     * Determines if a link points to a page on the same domain
     * @param {HTMLAnchorElement} link - The link element to check
     * @returns {boolean} True if the link's host matches the current page's host
     */
    isInternalLink(link) {
        return link.host === window.location.host;
    }

    /**
     * Navigate to a new URL using AJAX
     * @param {string} url - The URL to navigate to
     */
    async navigateTo(url, pushState = true) {
        // Prevent duplicate navigation to the same URL
        if (url === window.location.href && !pushState) {
            return;
        }

        try {
            // Show loading state
            this.mainContent.style.opacity = '0.5';
            
            // Fetch new page content
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();

            // Create a temporary element to parse the HTML
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const newContent = doc.querySelector(this.config.mainContentSelector);

            if (!newContent) {
                throw new Error('Could not find main content in new page');
            }

            // Update the page
            this.mainContent.innerHTML = newContent.innerHTML;
            document.title = doc.title;

            // Update browser history
            if (pushState) {
                const state = {
                    url: url,
                    title: document.title,
                    content: this.mainContent.innerHTML,
                    scrollPosition: { x: 0, y: 0 }, // Reset scroll for new pages
                    index: ++this.currentIndex
                };
                history.pushState(state, document.title, url);
                window.scrollTo(0, 0); // Scroll to top for new pages
            }

            // Restore opacity
            this.mainContent.style.opacity = '1';

            // Re-initialize only our SPA event listeners
            this.initializeEventListeners();

            // Dispatch a custom event for content update
            const event = new CustomEvent('spaContentUpdated', {
                detail: { url, pushState }
            });
            document.dispatchEvent(event);
        } catch (error) {
            this.mainContent.style.opacity = '1';
        }
    }

    /**
     * Handle browser back/forward navigation
     */
    handlePopState(event) {
        // If no state, use current URL
        if (!event.state) {
            this.navigateTo(window.location.href, false);
            return;
        }

        // Update our current index
        this.currentIndex = event.state.index;
        
        // Update content directly from state if available
        if (event.state.content) {
            this.mainContent.innerHTML = event.state.content;
            document.title = event.state.title;
            this.mainContent.style.opacity = '1';

            // Restore scroll position
            if (event.state.scrollPosition) {
                window.scrollTo(event.state.scrollPosition.x, event.state.scrollPosition.y);
            }
            return;
        }

        // Otherwise fetch the page
        this.navigateTo(event.state.url, false);
    }

    // Helper to get initial state
    getInitialState() {
        return {
            url: window.location.href,
            title: document.title,
            content: this.mainContent.innerHTML,
            scrollPosition: { x: window.scrollX, y: window.scrollY },
            isInitialState: true,
            index: 0
        };
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LightSPA;
} else {
    // Make available globally when not in module environment
    window.LightSPA = LightSPA;
}
