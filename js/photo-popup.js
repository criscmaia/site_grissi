/**
 * PhotoPopup - Handles photo popup functionality
 * Shows larger photos on hover with smooth animations
 */

class PhotoPopup {
    constructor() {
        this.currentPopup = null;
        this.isEnabled = true;
        this.suppressUntil = 0; // prevent immediate reopen after close
        this.init();
    }

    /**
     * Get the appropriate display name for a person
     * Children in unions always show their birth name (name)
     * All other contexts show legal name if available, otherwise birth name
     */
    getDisplayName(person) {
        if (!person) return '';
        return person.legalName || person.name;
    }

    /**
     * Initialize the popup system
     */
    init() {
        // Create global popup container
        this.createPopupContainer();
        
        // Add global click handler to close popups
        document.addEventListener('click', (e) => {
            const isOverlay = e.target.classList?.contains('photo-popup-overlay');
            const isClose = e.target.closest?.('.photo-popup .close-btn');
            if (isOverlay || isClose) {
                this.hidePopup();
            }
        });

        // Add escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentPopup) {
                this.hidePopup();
            }
        });

        console.log('📸 PhotoPopup: Initialized');
    }

    /**
     * Create the global popup container
     */
    createPopupContainer() {
        // Remove existing container if any
        const existing = document.getElementById('photo-popup-container');
        if (existing) {
            existing.remove();
        }

        // Create new container
        const container = document.createElement('div');
        container.id = 'photo-popup-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            pointer-events: none; /* will be turned on when popup is visible */
        `;
        
        document.body.appendChild(container);
        this.container = container;
    }

    /**
     * Show popup for a photo
     */
    showPopup(photoUrl, personName, triggerElement) {
        if (!this.isEnabled || !photoUrl) return;
        if (Date.now() < this.suppressUntil) return;
        if (this.currentPopup) return; // already open

        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.className = 'photo-popup-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            pointer-events: auto;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Create popup content
        const popup = document.createElement('div');
        popup.className = 'photo-popup';
        popup.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 90vw;
            max-height: 90vh;
            position: relative;
            transform: scale(0.8);
            transition: transform 0.3s ease;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;

        // Create photo image
        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = personName || 'Profile photo';
        img.loading = 'eager'; // Load immediately for popup
        img.decoding = 'async';
        img.style.cssText = `
            max-width: 100%;
            max-height: 70vh;
            border-radius: 8px;
            display: block;
            object-fit: contain;
        `;

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
        `;
        // Close button interactions (support desktop and mobile simulators)
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.suppressUntil = Date.now() + 400; this.hidePopup(); });
        closeBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
        closeBtn.addEventListener('pointerup', (e) => { e.stopPropagation(); this.suppressUntil = Date.now() + 400; this.hidePopup(); });
        closeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); this.suppressUntil = Date.now() + 400; this.hidePopup(); }, { passive: false });
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.5)';
        });

        // Add person name if provided
        let nameElement = null;
        if (personName) {
            nameElement = document.createElement('div');
            nameElement.textContent = personName;
            nameElement.style.cssText = `
                margin-top: 12px;
                text-align: center;
                font-weight: 600;
                color: #333;
                font-size: 16px;
            `;
        }

        // Assemble popup
        popup.appendChild(closeBtn);
        popup.appendChild(img);
        if (nameElement) {
            popup.appendChild(nameElement);
        }

        overlay.appendChild(popup);
        this.container.appendChild(overlay);
        // Enable pointer events while popup is present
        this.container.style.pointerEvents = 'auto';

        // Close when clicking outside popup (overlay area)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.suppressUntil = Date.now() + 400;
                this.hidePopup();
            }
        });

        // Store reference
        this.currentPopup = overlay;

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            popup.style.transform = 'scale(1)';
        });

        console.log(`📸 PhotoPopup: Showing popup for "${personName}"`);
    }

    /**
     * Hide the current popup
     */
    hidePopup() {
        if (!this.currentPopup) return;

        const overlay = this.currentPopup;
        const popup = overlay.querySelector('.photo-popup');

        // Animate out
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.8)';

        // Remove after animation
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
            this.currentPopup = null;
            // Disable pointer events again when no popup
            if (this.container) this.container.style.pointerEvents = 'none';
        }, 300);

        console.log('📸 PhotoPopup: Hiding popup');
    }

    /**
     * Enable or disable popup functionality
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.hidePopup();
        }
    }

    /**
     * Create hover event handlers for a profile photo
     */
    createHoverHandlers(photoElement, photoUrl, personName) {
        let popupTimeout = null;

        const showPopup = () => {
            if (popupTimeout) {
                clearTimeout(popupTimeout);
            }
            popupTimeout = setTimeout(() => {
                this.showPopup(photoUrl, personName, photoElement);
            }, 300); // 300ms delay before showing popup
        };

        const hidePopup = () => {
            if (popupTimeout) {
                clearTimeout(popupTimeout);
                popupTimeout = null;
            }
            // Don't hide immediately - let user move to popup
        };

        // Add hover events (desktop only)
        const supportsHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;
        if (supportsHover) {
            photoElement.addEventListener('mouseenter', showPopup);
            photoElement.addEventListener('mouseleave', hidePopup);
        }

        // Add click handler (mobile and desktop)
        photoElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (Date.now() < this.suppressUntil) return;
            this.showPopup(photoUrl, personName, photoElement);
        });

        return {
            showPopup,
            hidePopup
        };
    }
}

// Expose globally
window.PhotoPopup = PhotoPopup;
