/**
 * ShareManager - Handles sharing functionality
 * Provides shareable links and social media sharing
 */

class ShareManager {
    constructor() {
        this.currentMemberId = null;
        this.baseUrl = window.location.origin + window.location.pathname;
    }

    /**
     * Initialize the share manager
     */
    init() {
        this.setupShareButtons();
        this.handleHashNavigation();
        console.log('📤 ShareManager: Initialized');
    }

    /**
     * Setup share buttons for each family member card
     */
    setupShareButtons() {
        // Add share buttons to existing cards
        document.querySelectorAll('.person-card').forEach(card => {
            this.addShareButton(card);
        });

        // Watch for new cards being added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList?.contains('person-card')) {
                            this.addShareButton(node);
                        }
                        node.querySelectorAll('.person-card').forEach(card => {
                            this.addShareButton(card);
                        });
                    }
                });
            });
        });

        observer.observe(document.querySelector('.family-members'), {
            childList: true,
            subtree: true
        });
    }

    /**
     * Add share button to a person card
     */
    addShareButton(card) {
        if (card.querySelector('.share-btn')) return; // Already has share button

        const memberId = card.getAttribute('data-id');
        const memberName = card.querySelector('.person-name')?.textContent || 'Membro da família';

        // Create share button
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
        `;
        shareBtn.title = 'Compartilhar';
        shareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showShareMenu(memberId, memberName, shareBtn);
        });

        // Add to card header
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.appendChild(shareBtn);
        }
    }

    /**
     * Show share menu for a member
     */
    showShareMenu(memberId, memberName, triggerElement) {
        // Remove existing menu
        const existingMenu = document.querySelector('.share-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create share menu
        const menu = document.createElement('div');
        menu.className = 'share-menu';
        menu.innerHTML = `
            <div class="share-menu-header">
                <h4>Compartilhar ${memberName}</h4>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="share-options">
                <button class="share-option" onclick="window.shareManager.copyLink('${memberId}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    Copiar Link
                </button>
                <button class="share-option whatsapp" onclick="window.shareManager.shareWhatsApp('${memberId}', '${memberName}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    WhatsApp
                </button>
                <button class="share-option telegram" onclick="window.shareManager.shareTelegram('${memberId}', '${memberName}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Telegram
                </button>
                <button class="share-option email" onclick="window.shareManager.shareEmail('${memberId}', '${memberName}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                    Email
                </button>
            </div>
        `;

        // Position menu near trigger element
        const rect = triggerElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        menu.style.position = 'absolute';
        menu.style.top = `${rect.bottom + scrollTop + 5}px`;
        menu.style.left = `${rect.left + scrollLeft}px`;
        menu.style.zIndex = '1000';

        document.body.appendChild(menu);

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !triggerElement.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    /**
     * Copy direct link to clipboard
     */
    copyLink(memberId) {
        const encodedMemberId = encodeURIComponent(memberId);
        const url = `${this.baseUrl}#${encodedMemberId}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Link copiado!');
            }).catch(() => {
                this.fallbackCopy(url);
            });
        } else {
            this.fallbackCopy(url);
        }
    }

    /**
     * Fallback copy method
     */
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showNotification('Link copiado!');
    }

    /**
     * Share via WhatsApp
     */
    shareWhatsApp(memberId, memberName) {
        const encodedMemberId = encodeURIComponent(memberId);
        const url = `${this.baseUrl}#${encodedMemberId}`;
        const text = `Confira ${memberName} na árvore genealógica da Família Grissi: ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }

    /**
     * Share via Telegram
     */
    shareTelegram(memberId, memberName) {
        const encodedMemberId = encodeURIComponent(memberId);
        const url = `${this.baseUrl}#${encodedMemberId}`;
        const text = `Confira ${memberName} na árvore genealógica da Família Grissi: ${url}`;
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(telegramUrl, '_blank');
    }

    /**
     * Share via Email
     */
    shareEmail(memberId, memberName) {
        const encodedMemberId = encodeURIComponent(memberId);
        const url = `${this.baseUrl}#${encodedMemberId}`;
        const subject = `Árvore Genealógica - ${memberName}`;
        const body = `Olá!\n\nConfira ${memberName} na árvore genealógica da Família Grissi:\n${url}\n\nAtenciosamente,\nFamília Grissi`;
        
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl);
    }

    /**
     * Handle hash navigation
     */
    handleHashNavigation() {
        // Check for hash on page load
        if (window.location.hash) {
            this.navigateToMember(window.location.hash.substring(1));
        }

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const memberId = window.location.hash.substring(1);
            this.navigateToMember(memberId);
        });
    }

    /**
     * Navigate to specific member
     */
    navigateToMember(memberId) {
        if (!memberId) return;

        // Decode the member ID from URL
        const decodedMemberId = decodeURIComponent(memberId);
        
        // Try to find the member card by data-id (limit to actual person cards)
        let memberCard = document.querySelector(`.person-card[data-id="${decodedMemberId}"]`);
        
        // If not found, try with the original encoded version
        if (!memberCard) {
            memberCard = document.querySelector(`.person-card[data-id="${memberId}"]`);
        }
        
        // If still not found, try a more flexible search
        if (!memberCard) {
            // Try to find by exact match with different encodings (scan only real person cards)
            const allCards = document.querySelectorAll('.person-card');
            memberCard = Array.from(allCards).find(card => {
                const cardId = card.getAttribute('data-id');
                
                // Try exact matches first
                if (cardId === decodedMemberId || cardId === memberId) {
                    return true;
                }
                
                // Try with different URL encodings
                const doubleDecoded = decodeURIComponent(decodedMemberId);
                if (cardId === doubleDecoded) {
                    return true;
                }
                
                // Try with normalized spaces - but only if they're exactly the same length
                const normalizedCardId = cardId.replace(/\s+/g, '');
                const normalizedDecoded = decodedMemberId.replace(/\s+/g, '');
                const normalizedOriginal = memberId.replace(/\s+/g, '');
                
                // Only match if the normalized strings are exactly the same length
                // This prevents partial matches like "TN-1.1.3.8.1.2" matching "QN-1.1.3.8.1.2.2"
                if ((normalizedCardId === normalizedDecoded && cardId.length === decodedMemberId.length) || 
                    (normalizedCardId === normalizedOriginal && cardId.length === memberId.length)) {
                    return true;
                }
                
                return false;
            });
        }
        
        if (memberCard) {
            // Calculate header height for proper positioning
            const header = document.querySelector('header');
            const headerHeight = header ? header.offsetHeight : 80; // Default fallback
            
            // Get the element's position relative to the document
            const rect = memberCard.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calculate viewport height for centering
            const viewportHeight = window.innerHeight;
            const cardHeight = memberCard.offsetHeight;
            
            // Position card in the center of the viewport (accounting for header)
            const availableHeight = viewportHeight - headerHeight;
            const centerPosition = scrollTop + rect.top - headerHeight - (availableHeight - cardHeight) / 2;
            
            // Ensure we don't scroll past the top
            const targetScrollTop = Math.max(0, centerPosition);
            
            // Smooth scroll to the target position
            window.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
            
            // Highlight member temporarily
            memberCard.classList.add('highlighted');
            setTimeout(() => {
                memberCard.classList.remove('highlighted');
            }, 3000);

            // Trigger search spotlight if search controller is available
            if (window.searchEngine) {
                const member = window.searchEngine.state.members.find(m => {
                    // Try exact matches first
                    if (m.id === decodedMemberId || m.id === memberId) {
                        return true;
                    }
                    
                    // Try with different URL encodings
                    const doubleDecoded = decodeURIComponent(decodedMemberId);
                    if (m.id === doubleDecoded) {
                        return true;
                    }
                    
                    // Try with normalized spaces - but only if they're exactly the same length
                    const normalizedMemberId = m.id.replace(/\s+/g, '');
                    const normalizedDecoded = decodedMemberId.replace(/\s+/g, '');
                    const normalizedOriginal = memberId.replace(/\s+/g, '');
                    
                    // Only match if the normalized strings are exactly the same length
                    // This prevents partial matches like "TN-1.1.3.8.1.2" matching "QN-1.1.3.8.1.2.2"
                    if ((normalizedMemberId === normalizedDecoded && m.id.length === decodedMemberId.length) || 
                        (normalizedMemberId === normalizedOriginal && m.id.length === memberId.length)) {
                        return true;
                    }
                    
                    return false;
                });
                if (member) {
                    window.searchEngine.runSpotlight(member);
                }
            }
            
            console.log(`✅ Navigated to member: ${decodedMemberId}`);
        } else {
            console.warn(`⚠️ Member not found: ${decodedMemberId} (original: ${memberId})`);
        }
    }

    /**
     * Show notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'share-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
}

// Expose globally
window.ShareManager = ShareManager;
