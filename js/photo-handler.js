/**
 * PhotoHandler - Modern ES6 module for handling genealogy tree photos
 * Eliminates 120+ HTTP requests by using a photo manifest system
 */
class PhotoHandler {
    constructor() {
        this.photoManifest = null;
        this.photoCache = new Map();
        this.loadingPromise = null;
    }

    /**
     * Initialize the photo handler by loading the manifest
     */
    async init() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.loadPhotoManifest();
        return this.loadingPromise;
    }

    /**
     * Load the photo manifest from the server (single HTTP request)
     */
    async loadPhotoManifest() {
        try {
            console.log('📸 Attempting to load photo manifest...');
            const response = await fetch('./images/arvore/photo-manifest.json');
            if (!response.ok) {
                throw new Error(`Failed to load photo manifest: ${response.status}`);
            }
            
            const photos = await response.json();
            
            // Create a Set for O(1) lookups instead of O(n) array searches
            this.photoManifest = new Set(photos.map(photo => photo.toLowerCase()));
            
            console.log(`📸 Photo manifest loaded: ${this.photoManifest.size} photos available`);
            console.log(`📸 Photo manifest contents (first 10):`, Array.from(this.photoManifest).slice(0, 10));
            return true;
        } catch (error) {
            console.warn('⚠️ Photo manifest failed to load, falling back to individual requests:', error);
            this.photoManifest = null;
            // Still return true to continue with fallback method
            return true;
        }
    }

    /**
     * Check if a photo exists for a given person name
     * Uses manifest for instant lookup or falls back to HTTP request
     */
    async hasPhoto(personName) {
        // Ensure manifest is loaded
        await this.init();
        
        const photoFileName = `${personName}.jpg`.toLowerCase();
        
        // Use manifest for instant lookup if available
        if (this.photoManifest) {
            return this.photoManifest.has(photoFileName);
        }
        
        // Fallback to individual HTTP request with caching
        if (this.photoCache.has(photoFileName)) {
            return this.photoCache.get(photoFileName);
        }
        
        const exists = await this.checkPhotoExists(personName);
        this.photoCache.set(photoFileName, exists);
        return exists;
    }

    /**
     * Fallback method for checking photo existence via HTTP
     */
    async checkPhotoExists(personName) {
        return new Promise((resolve) => {
            const img = new Image();
            const photoUrl = `./images/arvore/${encodeURIComponent(personName)}.jpg`;
            
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = photoUrl;
        });
    }

    /**
     * Get the photo URL for a person
     */
    getPhotoUrl(personName) {
        return `./images/arvore/${encodeURIComponent(personName)}.jpg`;
    }

    /**
     * Batch check multiple names for photos (parallel processing)
     */
    async batchCheckPhotos(personNames) {
        await this.init();
        
        console.log(`🔍 PhotoHandler: Checking ${personNames.length} names for photos...`);
        console.log(`📸 PhotoHandler: Photo manifest available: ${this.photoManifest ? 'YES' : 'NO'}`);
        
        if (this.photoManifest) {
            // Instant batch lookup using manifest
            const results = personNames.map(name => {
                const photoFileName = `${name}.jpg`.toLowerCase();
                const hasPhoto = this.photoManifest.has(photoFileName);
                if (hasPhoto) {
                    console.log(`✅ PhotoHandler: Found photo for "${name}" -> "${photoFileName}"`);
                } else {
                    console.log(`🔍 PhotoHandler: Checking "${name}" -> "${photoFileName}" (NOT FOUND)`);
                }
                return { name, hasPhoto };
            });
            
            const photoCount = results.filter(r => r.hasPhoto).length;
            console.log(`📷 PhotoHandler: Found ${photoCount} photos using manifest`);
            return results;
        }
        
        console.log(`⚠️ PhotoHandler: Using fallback HTTP requests`);
        // Fallback to parallel HTTP requests
        const checks = personNames.map(async (name) => ({
            name,
            hasPhoto: await this.hasPhoto(name)
        }));
        
        return Promise.all(checks);
    }

    /**
     * Create optimized camera icon and tooltip structure
     */
    createPhotoTooltip(personName) {
        const photoUrl = this.getPhotoUrl(personName);
        
        console.log(`📷 PhotoHandler: Creating tooltip for "${personName}" with photo URL: ${photoUrl}`);
        
        // Create camera icon
        const cameraIcon = document.createElement('img');
        cameraIcon.src = './images/arvore/camera.jpg';
        cameraIcon.alt = 'camera';
        cameraIcon.className = 'camera-icon';
        
        // Create tooltip wrapper
        const tooltipWrapper = document.createElement('span');
        tooltipWrapper.className = 'tooltip';
        
        // Create photo span
        const photoSpan = document.createElement('span');
        photoSpan.className = 'foto';
        
        // Create the photo image with optimized loading
        const photoImg = document.createElement('img');
        photoImg.src = photoUrl;
        photoImg.alt = personName;
        photoImg.loading = 'lazy'; // Modern lazy loading
        photoImg.onerror = function() {
            console.warn(`⚠️ Photo failed to load: ${photoUrl}`);
            this.style.display = 'none';
        };
        
        // Assemble the structure
        photoSpan.appendChild(photoImg);
        tooltipWrapper.appendChild(cameraIcon);
        tooltipWrapper.appendChild(document.createTextNode(personName));
        tooltipWrapper.appendChild(photoSpan);
        
        return tooltipWrapper;
    }

    /**
     * Process DOM elements and add photo tooltips efficiently
     */
    async processElements(elements) {
        if (!elements || elements.length === 0) return;
        
        console.log(`🔍 PhotoHandler: Processing ${elements.length} elements for photos...`);
        
        // Extract all person names first
        const personNames = [];
        const elementMap = new Map();
        
        elements.forEach(element => {
            const personName = this.extractPersonName(element);
            if (personName && personName.length > 2) {
                personNames.push(personName);
                elementMap.set(personName, element);
            }
        });
        
        console.log(`📝 PhotoHandler: Found ${personNames.length} valid person names to check:`, personNames.slice(0, 5));
        console.log(`📝 PhotoHandler: Sample names being checked:`, personNames.slice(0, 10).map(name => `${name} -> ${name}.jpg`));
        
        // Batch check all photos at once
        const photoResults = await this.batchCheckPhotos(personNames);
        
        // Use DocumentFragment for efficient DOM manipulation
        const updates = [];
        
        photoResults.forEach(({ name, hasPhoto }) => {
            if (hasPhoto) {
                const element = elementMap.get(name);
                const tooltipWrapper = this.createPhotoTooltip(name);
                updates.push({ element, tooltipWrapper });
            }
        });
        
        // Apply all DOM updates in a batch
        updates.forEach(({ element, tooltipWrapper }) => {
            element.innerHTML = '';
            element.appendChild(tooltipWrapper);
        });
        
        console.log(`📷 PhotoHandler: Processed ${updates.length} photo tooltips out of ${personNames.length} names`);
    }

    /**
     * Extract clean person name from DOM element
     */
    extractPersonName(element) {
        let text = element.textContent?.trim() || '';
        
        // Handle elements modified by previous tooltip logic
        const tooltipElement = element.querySelector('.tooltip');
        if (tooltipElement) {
            const photoElement = tooltipElement.querySelector('.foto');
            if (photoElement) {
                const clonedTooltip = tooltipElement.cloneNode(true);
                const clonedPhoto = clonedTooltip.querySelector('.foto');
                clonedPhoto?.remove();
                text = clonedTooltip.textContent?.trim() || '';
            }
        }
        
        // Clean up the text (remove generation numbers, prefixes, etc.)
        return text
            .replace(/^\d+\.\d+(?:\.\d+)*\.\s*/, '') // Remove generation numbers
            .replace(/^[A-Z]{1,3}\s*-\s*/, '') // Remove prefixes like "QN -"
            .trim();
    }
}

// Expose globally for backward compatibility
window.PhotoHandler = PhotoHandler;