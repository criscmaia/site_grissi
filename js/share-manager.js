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
        // Remove any existing menu/overlay
        const existingOverlay = document.querySelector('.share-overlay');
        if (existingOverlay) existingOverlay.remove();
        const existingMenu = document.querySelector('.share-menu');
        if (existingMenu) existingMenu.remove();

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
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.149-.672.149-.198.297-.767.967-.94 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.496.099-.198.05-.372-.025-.521-.074-.149-.672-1.611-.921-2.207-.242-.579-.487-.5-.672-.51-.173-.009-.372-.011-.571-.011-.198 0-.521.074-.794.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.571-.347m-4.676 6.801h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.519-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.83 9.83 0 016.993 2.896 9.82 9.82 0 012.894 6.993c-.003 5.45-4.437 9.884-9.882 9.884m8.413-18.297A11.815 11.815 0 0012.796 0C5.735 0 .37 5.365.366 12.426c0 2.186.572 4.318 1.662 6.198L0 24l5.446-1.429a12.4 12.4 0 006.75 1.861h.005c7.06 0 12.426-5.365 12.429-12.426a12.34 12.34 0 00-3.652-8.815Z" />
                    </svg>
                    WhatsApp
                </button>
                <button class="share-option telegram" onclick="window.shareManager.shareTelegram('${memberId}', '${memberName}')">
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                        <path d="M23.954 4.569c-.27-.201-.621-.244-.931-.114L1.255 13.49c-.403.168-.66.567-.642 1.004.018.438.306.806.72.936l5.414 1.692 2.02 6.31c.129.4.484.68.9.7h.04c.393 0 .75-.229.906-.586l2.73-6.364 6.33 4.597c.168.122.369.185.57.185.159 0 .318-.038.463-.115.32-.169.545-.48.6-.836L24 5.377c.057-.371-.098-.744-.371-.978zM8.042 14.894l-3.62-1.131 12.674-5.292-9.054 6.423zm3.063 6.853l-1.533-4.79 7.163-6.15-5.63 10.94z" />
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

        const isMobile = (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) || (navigator.maxTouchPoints > 0);

        if (isMobile) {
            // Mobile: present as bottom sheet modal with overlay
            const overlay = document.createElement('div');
            overlay.className = 'share-overlay';
            menu.classList.add('mobile');
            overlay.appendChild(menu);
            document.body.appendChild(overlay);
            document.body.classList.add('no-scroll');

            // Close interactions
            const closeAll = () => {
                document.body.classList.remove('no-scroll');
                overlay.remove();
            };
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeAll();
            });
            const closeBtn = menu.querySelector('.close-btn');
            if (closeBtn) closeBtn.onclick = closeAll;
            // ESC key support
            const onKey = (e) => { if (e.key === 'Escape') { closeAll(); document.removeEventListener('keydown', onKey);} };
            document.addEventListener('keydown', onKey);
        } else {
            // Desktop: position near trigger, clamped to viewport to avoid horizontal scroll
            document.body.appendChild(menu);
            const rect = triggerElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            menu.style.position = 'absolute';
            menu.style.top = `${rect.bottom + scrollTop + 5}px`;
            // Clamp left within viewport (8px padding)
            const menuWidth = menu.offsetWidth || 220;
            const maxLeft = scrollLeft + window.innerWidth - menuWidth - 8;
            const minLeft = scrollLeft + 8;
            const rawLeft = rect.left + scrollLeft;
            const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));
            menu.style.left = `${clampedLeft}px`;
            menu.style.zIndex = '1000';

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
                // Close any open share UI
                document.querySelector('.share-overlay')?.remove();
                document.querySelector('.share-menu')?.remove();
                document.body.classList.remove('no-scroll');
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
    navigateToMember(memberId, options = { retries: 1 }) {
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
            // If the card is currently hidden due to filters, auto-adjust the generation filter
            const computedDisplay = window.getComputedStyle(memberCard).display;
            if (computedDisplay === 'none') {
                const previousActive = document.querySelector('.filter-buttons .filter-btn.active');
                const previousLabel = (previousActive?.textContent || '').trim();
                const targetGeneration = memberCard.getAttribute('data-generation');
                let targetButton = null;
                if (targetGeneration) {
                    const buttons = Array.from(document.querySelectorAll('.filter-buttons .filter-btn'));
                    targetButton = buttons.find(btn => (btn.textContent || '').trim().startsWith(`${targetGeneration}ª`));
                }

                // Fallback to "Todas as Gerações" if specific generation button not found
                if (!targetButton) {
                    targetButton = Array.from(document.querySelectorAll('.filter-buttons .filter-btn'))
                        .find(btn => (btn.textContent || '').includes('Todas')) || null;
                }

                if (targetButton && !targetButton.classList.contains('active')) {
                    targetButton.click();
                    const targetLabel = (targetButton.textContent || '').trim();
                    // Toast with Undo to restore previous filter
                    this.showActionToast(`Ajustei o filtro para ${targetLabel}.`, 'Desfazer', () => {
                        if (previousActive && !previousActive.classList.contains('active')) {
                            previousActive.click();
                        }
                    });
                }

                // Retry navigation after filters apply
                if ((options?.retries || 0) > 0) {
                    setTimeout(() => this.navigateToMember(memberId, { retries: (options.retries || 1) - 1 }), 60);
                }
                return;
            }

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

    /**
     * Show a toast with an action button (e.g., Undo)
     */
    showActionToast(message, actionLabel, onAction) {
        const notification = document.createElement('div');
        notification.className = 'share-notification';
        const text = document.createElement('span');
        text.textContent = message;
        const button = document.createElement('button');
        button.textContent = actionLabel || 'Desfazer';
        button.style.marginLeft = '12px';
        button.style.padding = '4px 8px';
        button.style.border = '1px solid rgba(255,255,255,.6)';
        button.style.background = 'transparent';
        button.style.color = 'inherit';
        button.style.borderRadius = '6px';
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            try { onAction && onAction(); } catch {}
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 250);
        });
        notification.appendChild(text);
        notification.appendChild(button);
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 50);
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 250);
        }, 4000);
    }
}

// Expose globally
window.ShareManager = ShareManager;
