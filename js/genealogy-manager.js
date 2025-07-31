/**
 * GenealogyManager - Main orchestrator for the genealogy tree functionality
 * Coordinates photo handling, search, and DOM management
 */
class GenealogyManager {
    constructor() {
        this.photoHandler = null;
        this.searchEngine = null;
        this.contentElement = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the genealogy manager
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Initialize photo handler
            this.photoHandler = new (window.PhotoHandler || PhotoHandler)();
            await this.photoHandler.init();
            
            // Cache DOM reference
            this.contentElement = document.getElementById('arvore-content');
            
            this.isInitialized = true;
            console.log('🌳 GenealogyManager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize GenealogyManager:', error);
            throw error;
        }
    }

    /**
     * Load and process the genealogy tree content
     */
    async loadGenealogyTree() {
        try {
            // Ensure manager is initialized
            await this.init();
            
            // Load the raw genealogy content
            const response = await fetch('./arvore.html');
            if (!response.ok) {
                throw new Error(`Failed to load genealogy content: ${response.status}`);
            }
            
            const data = await response.text();
            this.contentElement.innerHTML = data;
            
            console.log('📄 Genealogy content loaded');
            
            // Process photos in parallel for both header names and biographical text
            await Promise.all([
                this.processHeaderNames(),
                this.processBiographicalNames()
            ]);
            
            console.log('✅ Genealogy tree processing completed');
            
        } catch (error) {
            console.error('❌ Error loading genealogy tree:', error);
            this.contentElement.innerHTML = '<p>Erro ao carregar a árvore genealógica.</p>';
            throw error;
        }
    }

    /**
     * Process person names in headers (.person-name elements)
     */
    async processHeaderNames() {
        const personNameElements = this.contentElement?.querySelectorAll('.person-name') || [];
        
        if (personNameElements.length === 0) {
            console.warn('⚠️ No .person-name elements found');
            return;
        }
        
        console.log(`🔍 Processing ${personNameElements.length} header names`);
        await this.photoHandler.processElements(Array.from(personNameElements));
    }

    /**
     * Process names mentioned in biographical information (.person-info strong elements)
     */
    async processBiographicalNames() {
        const personInfoSections = this.contentElement?.querySelectorAll('.person-info') || [];
        
        if (personInfoSections.length === 0) {
            console.warn('⚠️ No .person-info sections found');
            return;
        }
        
        // Collect all strong elements from biographical sections
        const strongElements = [];
        
        personInfoSections.forEach(infoSection => {
            const paragraphs = infoSection.querySelectorAll('p');
            paragraphs.forEach(paragraph => {
                const strongs = paragraph.querySelectorAll('strong');
                strongs.forEach(strong => {
                    const text = strong.textContent?.trim() || '';
                    // Filter for valid person names (multiple words, reasonable length)
                    if (text.length >= 3 && text.split(' ').length >= 2) {
                        strongElements.push(strong);
                    }
                });
            });
        });
        
        console.log(`🔍 Processing ${strongElements.length} biographical names`);
        await this.photoHandler.processElements(strongElements);
    }

    /**
     * Initialize search functionality after content is loaded
     */
    initializeSearch() {
        if (window.ModernSearchEngine) {
            try {
                this.searchEngine = new window.ModernSearchEngine();
                console.log('🔎 Search engine initialized');
                
                // Re-extract search data after content is loaded
                setTimeout(() => {
                    if (this.searchEngine && this.searchEngine.reExtractSearchData) {
                        this.searchEngine.reExtractSearchData();
                    }
                }, 500);
                
            } catch (error) {
                console.error('❌ Failed to initialize search:', error);
            }
        } else {
            console.warn('⚠️ ModernSearchEngine not available');
        }
    }

    /**
     * Get statistics about the current genealogy tree
     */
    getStatistics() {
        if (!this.contentElement) return null;
        
        const personNames = this.contentElement.querySelectorAll('.person-name').length;
        const personInfos = this.contentElement.querySelectorAll('.person-info').length;
        const tooltips = this.contentElement.querySelectorAll('.tooltip').length;
        
        return {
            personNames,
            personInfos,
            photosWithTooltips: tooltips,
            availablePhotos: this.photoHandler?.photoManifest?.size || 0
        };
    }
}

// Expose globally for backward compatibility
window.GenealogyManager = GenealogyManager;