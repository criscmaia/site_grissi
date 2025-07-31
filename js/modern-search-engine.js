/**
 * ModernSearchEngine - Enhanced search functionality with better performance
 * Replaces the original ModernSearch with modern JavaScript features
 */
class ModernSearchEngine {
    constructor() {
        this.searchData = [];
        this.searchIndex = new Map();
        this.currentResults = [];
        this.selectedIndex = -1;
        this.isSearching = false;
        this.debounceTimer = null;
        
        // Modern search features
        this.searchCache = new Map();
        this.abortController = null;
        
        this.init();
    }

    /**
     * Initialize the search engine
     */
    init() {
        this.createSearchInterface();
        this.bindEvents();
        
        // Wait a bit for content to be loaded, then extract search data
        setTimeout(() => {
            this.extractSearchData();
        }, 1000);
    }

    /**
     * Re-extract search data when content is loaded
     */
    reExtractSearchData() {
        console.log('🔍 Re-extracting search data...');
        this.extractSearchData();
    }

    /**
     * Create modern search interface with better performance
     */
    createSearchInterface() {
        // Remove old search if exists
        document.getElementById('cool_find_div')?.remove();

        // Create search container with modern template
        const searchContainer = document.createElement('div');
        searchContainer.className = 'modern-search-container';
        searchContainer.innerHTML = this.getSearchTemplate();

        // Insert into page
        document.body.appendChild(searchContainer);

        // Cache DOM references for performance
        this.searchInput = searchContainer.querySelector('.modern-search-input');
        this.autocomplete = searchContainer.querySelector('.modern-search-autocomplete');
        this.searchIcon = searchContainer.querySelector('.modern-search-icon');
    }

    /**
     * Get the search interface template
     */
    getSearchTemplate() {
        return `
            <div style="position: relative;">
                <input type="text" 
                       class="modern-search-input" 
                       placeholder="Pesquisar membros da família..."
                       autocomplete="off"
                       aria-label="Pesquisar membros da família"
                       aria-describedby="search-instructions">
                <span class="modern-search-icon" aria-hidden="true">🔍</span>
                <div class="modern-search-autocomplete" role="listbox" aria-label="Resultados da busca"></div>
                <!--
                <div id="search-instructions" class="sr-only">
                    Digite para buscar membros da família. Use as setas para navegar e Enter para selecionar.
                </div>
                -->
            </div>
        `;
    }

    /**
     * Bind events with modern event handling
     */
    bindEvents() {
        // Store bound handlers for cleanup
        this.handleSearchInput = (e) => this.performSearchInput(e.target.value);
        this.handleKeydown = (e) => this.handleKeydownEvent(e);
        this.handleFocus = () => this.showAutocomplete();
        this.handleBlur = (e) => {
            // Delay hiding to allow click events on results
            setTimeout(() => {
                if (!e.relatedTarget?.closest('.modern-search-container')) {
                    this.hideAutocomplete();
                }
            }, 150);
        };
        this.handleGlobalClick = (e) => {
            if (!e.target.closest('.modern-search-container')) {
                this.hideAutocomplete();
            }
        };
        this.handleGlobalKeydown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
                this.searchInput.select();
            }
        };

        // Bind search input events
        this.searchInput.addEventListener('input', this.handleSearchInput);
        this.searchInput.addEventListener('keydown', this.handleKeydown);
        this.searchInput.addEventListener('focus', this.handleFocus);
        this.searchInput.addEventListener('blur', this.handleBlur);

        // Global click handler with better performance
        document.addEventListener('click', this.handleGlobalClick, { passive: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleGlobalKeydown);
    }

    /**
     * Extract search data with improved performance
     */
    extractSearchData() {
        const content = document.getElementById('arvore-content');
        if (!content) {
            console.warn('⚠️ Search: arvore-content not found');
            return;
        }

        const familyMembers = [];
        const seenNames = new Set();

        // Process header names efficiently
        this.processHeaderNames(content, familyMembers, seenNames);
        
        // Process biographical names
        this.processBiographicalNames(content, familyMembers, seenNames);

        this.searchData = familyMembers;
        this.buildSearchIndex();
        
        console.log(`🔍 Search index built: ${this.searchData.length} family members`);
    }

    /**
     * Process header names with better performance
     */
    processHeaderNames(content, familyMembers, seenNames) {
        const personNames = content.querySelectorAll('.person-name');
        
        personNames.forEach((element, index) => {
            const name = this.extractCleanName(element);
            if (!name || seenNames.has(name.toLowerCase())) return;
            
            seenNames.add(name.toLowerCase());
            
            const memberData = {
                name,
                generation: this.extractGeneration(element.textContent),
                birthInfo: this.extractBirthInfo(element),
                location: this.extractLocation(element),
                element,
                index,
                type: 'header'
            };
            
            familyMembers.push(memberData);
        });
    }

    /**
     * Process biographical names with improved filtering
     */
    processBiographicalNames(content, familyMembers, seenNames) {
        const personInfoSections = content.querySelectorAll('.person-info');
        
        personInfoSections.forEach((infoSection, sectionIndex) => {
            const strongElements = infoSection.querySelectorAll('strong');
            
            strongElements.forEach((strong) => {
                const name = strong.textContent?.trim();
                if (!this.isValidPersonName(name) || seenNames.has(name.toLowerCase())) return;
                
                seenNames.add(name.toLowerCase());
                
                const memberData = {
                    name,
                    generation: '',
                    birthInfo: this.extractBirthInfo(strong.parentElement),
                    location: this.extractLocation(strong.parentElement),
                    element: strong, // Store the strong element itself for better highlighting
                    index: sectionIndex + 1000, // Offset to avoid conflicts
                    type: 'biographical'
                };
                
                familyMembers.push(memberData);
            });
        });
    }

    /**
     * Extract clean name from DOM element (handles tooltip modifications)
     */
    extractCleanName(element) {
        let text = element.textContent?.trim() || '';
        
        // Handle tooltip-modified elements
        const tooltipElement = element.querySelector('.tooltip');
        if (tooltipElement) {
            const clonedTooltip = tooltipElement.cloneNode(true);
            clonedTooltip.querySelector('.foto')?.remove();
            text = clonedTooltip.textContent?.trim() || '';
        }
        
        // Clean the text
        return text
            .replace(/^\d+\.\d+(?:\.\d+)*\.\s*/, '') // Remove generation numbers
            .replace(/^[A-Z]{1,3}\s*-\s*/, '') // Remove prefixes
            .trim();
    }

    /**
     * Validate if text looks like a person name
     */
    isValidPersonName(name) {
        return name && 
               name.length > 3 && 
               name.split(' ').length >= 2 && 
               /^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ\s\.]+$/i.test(name);
    }

    /**
     * Extract generation info from text
     */
    extractGeneration(text) {
        const match = text?.match(/(\d+\.\d+(?:\.\d+)*)/);
        return match?.[1] || '';
    }

    /**
     * Extract birth information
     */
    extractBirthInfo(element) {
        const nextElement = element.parentNode?.nextElementSibling;
        const text = nextElement?.textContent || element.textContent;
        const match = text?.match(/Nascid[oa] em (.+?)(?:\.|,)/);
        return match?.[1] || '';
    }

    /**
     * Extract location information
     */
    extractLocation(element) {
        const nextElement = element.parentNode?.nextElementSibling;
        const text = nextElement?.textContent || element.textContent;
        const match = text?.match(/(?:em|na cidade de|na Província de) ([^,\.]+)/);
        return match?.[1] || '';
    }

    /**
     * Build optimized search index
     */
    buildSearchIndex() {
        this.searchIndex.clear();
        
        // Pre-compile regex patterns for better performance
        const generationPattern = /(\d+\.\d+(?:\.\d+)*)/;
        const birthPattern = /Nascid[oa] em (.+?)(?:\.|,)/;
        const locationPattern = /(?:em|na cidade de|na Província de) ([^,\.]+)/;
        
        this.searchData.forEach(member => {
            const searchTerms = [
                member.name.toLowerCase(),
                member.generation,
                member.birthInfo.toLowerCase(),
                member.location.toLowerCase(),
                ...member.name.toLowerCase().split(' ').filter(word => word.length > 2) // Filter out short words
            ].filter(Boolean).join(' ');
            
            this.searchIndex.set(member, searchTerms);
        });
    }

    /**
     * Handle search input with improved debouncing
     */
    performSearchInput(query) {
        // Cancel previous search if still pending
        if (this.abortController) {
            this.abortController.abort();
        }
        
        // Clear previous debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce the search
        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, 150); // Reduced from 300ms for snappier response
    }

    /**
     * Perform search with caching and better performance
     */
    async performSearch(query) {
        const trimmedQuery = query.trim();
        
        if (!trimmedQuery) {
            this.hideAutocomplete();
            return;
        }

        // Check cache first
        if (this.searchCache.has(trimmedQuery)) {
            const cachedResults = this.searchCache.get(trimmedQuery);
            this.displayResults(cachedResults, trimmedQuery);
            return;
        }

        // Create abort controller for this search
        this.abortController = new AbortController();
        
        try {
            this.isSearching = true;
            this.showLoading();

            // Perform fuzzy search
            const results = this.performFuzzySearch(trimmedQuery.toLowerCase());
            
            // Cache results
            this.searchCache.set(trimmedQuery, results);
            
            // Limit cache size
            if (this.searchCache.size > 50) {
                const firstKey = this.searchCache.keys().next().value;
                this.searchCache.delete(firstKey);
            }
            
            this.displayResults(results, trimmedQuery);
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search error:', error);
                this.showError();
            }
        } finally {
            this.isSearching = false;
            this.hideLoading();
        }
    }

    /**
     * Improved fuzzy search algorithm
     */
    performFuzzySearch(query) {
        const queryWords = query.split(' ').filter(word => word.length > 0);
        const results = [];

        for (const [member, searchTerms] of this.searchIndex) {
            let score = 0;
            let matches = 0;

            queryWords.forEach(word => {
                if (searchTerms.includes(word)) {
                    score += 10;
                    matches++;
                } else {
                    // Fuzzy matching with improved algorithm
                    const fuzzyScore = this.calculateFuzzyScore(word, searchTerms);
                    if (fuzzyScore > 0) {
                        score += fuzzyScore;
                        matches++;
                    }
                }
            });

            if (matches > 0) {
                results.push({ ...member, score, matches });
            }
        }

        // Sort by relevance
        return results
            .sort((a, b) => {
                if (a.matches !== b.matches) return b.matches - a.matches;
                if (a.score !== b.score) return b.score - a.score;
                return a.name.localeCompare(b.name);
            })
            .slice(0, 8); // Reduced from 10 for better UX
    }

    /**
     * Calculate fuzzy matching score
     */
    calculateFuzzyScore(word, searchTerms) {
        // Starts with match (highest priority)
        if (searchTerms.includes(word)) return 10;
        
        // Contains match
        const containsMatch = searchTerms.split(' ').some(term => 
            term.includes(word) || word.includes(term)
        );
        if (containsMatch) return 5;
        
        // Levenshtein distance for typos
        const distance = this.levenshteinDistance(word, searchTerms);
        if (distance <= 2) return Math.max(1, 3 - distance);
        
        return 0;
    }

    /**
     * Optimized Levenshtein distance calculation
     */
    levenshteinDistance(str1, str2) {
        // Early exit for identical strings
        if (str1 === str2) return 0;
        
        // Early exit for empty strings
        if (str1.length === 0) return str2.length;
        if (str2.length === 0) return str1.length;
        
        // Swap strings if str1 is longer (optimization)
        if (str1.length > str2.length) {
            [str1, str2] = [str2, str1];
        }
        
        let previousRow = Array.from({ length: str1.length + 1 }, (_, i) => i);
        
        for (let i = 0; i < str2.length; i++) {
            const currentRow = [i + 1];
            
            for (let j = 0; j < str1.length; j++) {
                const insertCost = currentRow[j] + 1;
                const deleteCost = previousRow[j + 1] + 1;
                const substituteCost = previousRow[j] + (str1[j] !== str2[i] ? 1 : 0);
                
                currentRow.push(Math.min(insertCost, deleteCost, substituteCost));
            }
            
            previousRow = currentRow;
        }
        
        return previousRow[str1.length];
    }

    /**
     * Display search results with better performance
     */
    displayResults(results, query) {
        this.currentResults = results;
        this.selectedIndex = -1;

        if (results.length === 0) {
            this.showNoResults();
            return;
        }

        // Use template strings for better performance
        const html = results.map((result, index) => `
            <div class="modern-search-item" 
                 data-index="${index}" 
                 role="option" 
                 aria-selected="false">
                <div>
                    <div class="modern-search-result-name">${this.highlightMatch(result.name, query)}</div>
                    <div class="modern-search-result-details">
                        ${result.generation ? `Geração: ${result.generation}` : ''}
                        ${result.location ? ` • ${result.location}` : ''}
                        ${result.type === 'biographical' ? ' • Mencionado' : ''}
                    </div>
                </div>
            </div>
        `).join('');

        this.autocomplete.innerHTML = html;
        this.autocomplete.classList.add('show');

        // Bind click events efficiently
        this.bindResultEvents();
    }

    /**
     * Bind result events efficiently
     */
    bindResultEvents() {
        // Use event delegation for better performance
        this.autocomplete.addEventListener('click', (e) => {
            const item = e.target.closest('.modern-search-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                this.selectResult(this.currentResults[index]);
            }
        });
    }

    /**
     * Highlight search matches
     */
    highlightMatch(text, query) {
        if (!query) return text;
        
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return text.replace(regex, '<span class="modern-search-match">$1</span>');
    }

    /**
     * Handle keyboard navigation
     */
    handleKeydownEvent(e) {
        const items = this.autocomplete.querySelectorAll('.modern-search-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    const index = parseInt(items[this.selectedIndex].dataset.index);
                    this.selectResult(this.currentResults[index]);
                }
                break;
                
            case 'Escape':
                this.hideAutocomplete();
                this.searchInput.blur();
                break;
        }
    }

    /**
     * Update visual selection
     */
    updateSelection(items) {
        items.forEach((item, index) => {
            const isSelected = index === this.selectedIndex;
            item.classList.toggle('selected', isSelected);
            item.setAttribute('aria-selected', isSelected.toString());
            
            if (isSelected) {
                this.scrollToItem(item);
            }
        });
    }

    /**
     * Scroll selected item into view
     */
    scrollToItem(selectedItem) {
        if (!selectedItem) return;
        
        const container = this.autocomplete;
        const itemTop = selectedItem.offsetTop;
        const itemBottom = itemTop + selectedItem.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        
        if (itemTop < containerTop) {
            container.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
            container.scrollTop = itemBottom - container.clientHeight;
        }
    }

    /**
     * Select a result and navigate to it
     */
    selectResult(result) {
        this.searchInput.value = result.name;
        this.hideAutocomplete();
        this.scrollToResult(result);
    }

    /**
     * Scroll to result with improved animation
     */
    scrollToResult(result) {
        if (!result?.element) return;
        
        // For biographical results, scroll to the parent paragraph for better visibility
        const scrollTarget = result.type === 'biographical' ? result.element.parentElement : result.element;
        
        scrollTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Highlight the parent container for better visibility
        let highlightTarget;
        if (result.type === 'header') {
            // For header names, highlight the person-header container
            highlightTarget = result.element.closest('.person-header') || result.element.parentElement;
        } else {
            // For biographical names, highlight the person-info container
            highlightTarget = result.element.closest('.person-info') || result.element.parentElement;
        }
        
        // Store original styles properly
        const originalBg = highlightTarget.style.backgroundColor || '';
        const originalColor = highlightTarget.style.color || '';
        
        // Create a beautiful animated highlight effect
        highlightTarget.style.backgroundColor = '#fff3cd';
        highlightTarget.style.color = '#856404';
        highlightTarget.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        highlightTarget.style.transform = 'scale(1.02)';
        highlightTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
        highlightTarget.style.borderRadius = '4px';
        
        // Add a subtle pulse effect
        setTimeout(() => {
            highlightTarget.style.transform = 'scale(1.01)';
            highlightTarget.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.2)';
        }, 200);
        
        // Simple and reliable animation: yellow for 1 second, then back to original
        setTimeout(() => {
            console.log('🔄 Resetting highlight for:', result.name);
            console.log('🎯 Target element:', highlightTarget);
            console.log('📝 Original bg:', originalBg, 'Original color:', originalColor);
            
            // Beautiful fade-out animation
            highlightTarget.style.backgroundColor = '';
            highlightTarget.style.color = '';
            highlightTarget.style.transform = 'scale(1)';
            highlightTarget.style.boxShadow = '';
            highlightTarget.style.borderRadius = '';
            
            // Clean up transition after animation
            setTimeout(() => {
                highlightTarget.style.transition = '';
            }, 400);
            
            console.log('✅ Styles reset complete');
        }, 1000);
    }

    /**
     * Show/hide autocomplete
     */
    showAutocomplete() {
        this.autocomplete.classList.add('show');
    }

    hideAutocomplete() {
        this.autocomplete.classList.remove('show');
        this.selectedIndex = -1;
    }

    /**
     * Loading states
     */
    showLoading() {
        this.autocomplete.innerHTML = `
            <div class="modern-search-item">
                <div class="modern-search-loading">🔍</div>
                <span>Pesquisando...</span>
            </div>
        `;
        this.autocomplete.classList.add('show');
    }

    hideLoading() {
        // Will be replaced by results or hidden
    }

    showNoResults() {
        this.autocomplete.innerHTML = `
            <div class="modern-search-item">
                <span>Nenhum resultado encontrado</span>
            </div>
        `;
        this.autocomplete.classList.add('show');
    }

    showError() {
        this.autocomplete.innerHTML = `
            <div class="modern-search-item">
                <span>⚠️ Erro na busca. Tente novamente.</span>
            </div>
        `;
        this.autocomplete.classList.add('show');
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.abortController?.abort();
        clearTimeout(this.debounceTimer);
        this.searchCache.clear();
        
        // Remove event listeners to prevent memory leaks
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.handleSearchInput);
            this.searchInput.removeEventListener('keydown', this.handleKeydown);
            this.searchInput.removeEventListener('focus', this.handleFocus);
            this.searchInput.removeEventListener('blur', this.handleBlur);
        }
        
        // Remove global event listeners
        document.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('keydown', this.handleGlobalKeydown);
        
        document.querySelector('.modern-search-container')?.remove();
    }
}

// Expose globally for backward compatibility
window.ModernSearchEngine = ModernSearchEngine;