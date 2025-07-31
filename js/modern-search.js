// Modern Search Functionality - Phase 1
class ModernSearch {
    constructor() {
        this.searchData = [];
        this.searchIndex = [];
        this.currentResults = [];
        this.selectedIndex = -1;
        this.isSearching = false;
        this.debounceTimer = null;
        
        this.init();
    }

    init() {
        this.createSearchInterface();
        this.bindEvents();
        this.extractSearchData();
    }

    createSearchInterface() {
        // Remove old search if exists
        const oldSearch = document.getElementById('cool_find_div');
        if (oldSearch) {
            oldSearch.remove();
        }

        // Create modern search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'modern-search-container';
        searchContainer.innerHTML = `
            <div style="position: relative;">
                <input type="text" 
                       class="modern-search-input" 
                       placeholder="Pesquisar membros da família..."
                       autocomplete="off"
                       aria-label="Pesquisar membros da família">
                <span class="modern-search-icon">🔍</span>
                <div class="modern-search-autocomplete"></div>
            </div>
        `;

        // Insert into page
        document.body.appendChild(searchContainer);

        // Store references
        this.searchInput = searchContainer.querySelector('.modern-search-input');
        this.autocomplete = searchContainer.querySelector('.modern-search-autocomplete');
    }

    bindEvents() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        this.searchInput.addEventListener('focus', () => {
            this.showAutocomplete();
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.modern-search-container')) {
                this.hideAutocomplete();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
            }
        });
    }

    extractSearchData() {
        // Extract family member data from the loaded content
        const content = document.getElementById('arvore-content');
        if (!content) return;

        const paragraphs = content.querySelectorAll('p');
        const familyMembers = [];

        paragraphs.forEach((p, index) => {
            const text = p.textContent.trim();
            if (!text) return;

            // Look for family member patterns
            const nameMatch = text.match(/([A-Z][A-Z\s]+(?:GRIZZO|GRIS|GRISSI|GRICE|CANTON|BERTOLIN|CARDOSO|MAIA|MABILLOT|BORGO|CANDIAN|PIMENTA|LAGARES|TIMÓTEO|BRAGA|ALVARENGA|SOEIRO|CARVALHO|PRESOTTI|MORAS|PUPPI|TOFFOLO|SFREDO|PICININ|MINARO|CASA GRANDE|FABRI|ROMAN|ROSSETI|BERTOLIN|ALMEIDA|PINTO|ESTEVES|GONÇALVES|MORAIS|GAVA|LUCAS|VIDAL|SILVA|NÓBREGA|MENDES|DRUMOND|MOREIRA|BERGAMINI|PETINELLI|CASTRO|CECILIO|RIBEIRO|ZONZIN|ESTEVES))/);
            
            if (nameMatch) {
                const name = nameMatch[1].trim();
                const generationMatch = text.match(/(\d+\.\d+(?:\.\d+)*)/);
                const generation = generationMatch ? generationMatch[1] : '';
                
                // Extract additional info
                const infoMatch = text.match(/Nascido em (.+?)(?:\.|,)/);
                const birthInfo = infoMatch ? infoMatch[1] : '';
                
                const locationMatch = text.match(/(?:em|na cidade de|na Província de) ([^,\.]+)/);
                const location = locationMatch ? locationMatch[1] : '';

                familyMembers.push({
                    name: name,
                    generation: generation,
                    birthInfo: birthInfo,
                    location: location,
                    fullText: text,
                    element: p,
                    index: index
                });
            }
        });

        this.searchData = familyMembers;
        this.buildSearchIndex();
    }

    buildSearchIndex() {
        this.searchIndex = this.searchData.map(member => ({
            ...member,
            searchTerms: this.generateSearchTerms(member)
        }));
    }

    generateSearchTerms(member) {
        const terms = [
            member.name.toLowerCase(),
            member.generation,
            member.birthInfo.toLowerCase(),
            member.location.toLowerCase()
        ].filter(term => term);

        // Add variations
        const nameParts = member.name.toLowerCase().split(' ');
        terms.push(...nameParts);
        
        return terms.join(' ');
    }

    handleSearchInput(query) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    performSearch(query) {
        if (!query.trim()) {
            this.hideAutocomplete();
            return;
        }

        this.isSearching = true;
        this.showLoading();

        // Fuzzy search
        const results = this.fuzzySearch(query.toLowerCase());
        
        this.currentResults = results;
        this.selectedIndex = -1;

        if (results.length > 0) {
            this.showAutocomplete(results);
        } else {
            this.hideAutocomplete();
            this.showNoResults();
        }

        this.isSearching = false;
        this.hideLoading();
    }

    fuzzySearch(query) {
        const results = [];
        const queryWords = query.split(' ').filter(word => word.length > 0);

        this.searchIndex.forEach(member => {
            let score = 0;
            let matches = 0;

            queryWords.forEach(word => {
                if (member.searchTerms.includes(word)) {
                    score += 10;
                    matches++;
                } else {
                    // Fuzzy matching
                    const distance = this.levenshteinDistance(word, member.searchTerms);
                    if (distance <= 2) {
                        score += 5;
                        matches++;
                    }
                }
            });

            if (matches > 0) {
                results.push({
                    ...member,
                    score: score,
                    matches: matches
                });
            }
        });

        // Sort by score and relevance
        return results
            .sort((a, b) => {
                if (a.matches !== b.matches) {
                    return b.matches - a.matches;
                }
                return b.score - a.score;
            })
            .slice(0, 10); // Limit to top 10 results
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + 1
                    );
                }
            }
        }

        return matrix[len1][len2];
    }

    showAutocomplete(results = []) {
        if (results.length === 0) {
            this.hideAutocomplete();
            return;
        }

        const html = results.map((result, index) => `
            <div class="modern-search-item" data-index="${index}">
                <div>
                    <div class="modern-search-result-name">${this.highlightMatch(result.name, this.searchInput.value)}</div>
                    <div class="modern-search-result-details">
                        ${result.generation ? `Geração: ${result.generation}` : ''}
                        ${result.location ? ` • ${result.location}` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        this.autocomplete.innerHTML = html;
        this.autocomplete.classList.add('show');

        // Bind click events
        this.autocomplete.querySelectorAll('.modern-search-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.selectResult(results[index]);
            });
        });
    }

    hideAutocomplete() {
        this.autocomplete.classList.remove('show');
    }

    // Ensure only one interface is shown at a time
    hideAll() {
        this.hideAutocomplete();
    }

    selectResult(result) {
        this.searchInput.value = result.name;
        this.hideAutocomplete();
        this.scrollToResult(result);
    }

    scrollToResult(result) {
        if (result.element) {
            result.element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Highlight the element temporarily
            result.element.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
                result.element.style.backgroundColor = '';
            }, 2000);
        }
    }

    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="modern-search-match">$1</span>');
    }

    handleKeydown(e) {
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
                    items[this.selectedIndex].click();
                }
                // If no item is selected, just ignore Enter
                break;
                
            case 'Escape':
                this.hideAll();
                this.searchInput.blur();
                break;
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                // Scroll the selected item into view
                this.scrollToItem(item);
            } else {
                item.classList.remove('selected');
            }
        });
    }

    scrollToItem(selectedItem) {
        if (!selectedItem) return;
        
        const container = this.autocomplete;
        const itemTop = selectedItem.offsetTop;
        const itemBottom = itemTop + selectedItem.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        
        // If item is above the visible area
        if (itemTop < containerTop) {
            container.scrollTop = itemTop;
        }
        // If item is below the visible area
        else if (itemBottom > containerBottom) {
            container.scrollTop = itemBottom - container.clientHeight;
        }
    }

    showLoading() {
        this.autocomplete.innerHTML = `
            <div class="modern-search-item">
                <div class="modern-search-loading"></div>
                <span>Pesquisando...</span>
            </div>
        `;
        this.autocomplete.classList.add('show');
    }

    hideLoading() {
        // Loading will be replaced by results or hidden
    }

    showNoResults() {
        this.autocomplete.innerHTML = `
            <div class="modern-search-item">
                <span>Nenhum resultado encontrado</span>
            </div>
        `;
        this.autocomplete.classList.add('show');
    }
}

// Initialize modern search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for genealogy tree to load
    setTimeout(() => {
        new ModernSearch();
    }, 1000);
}); 