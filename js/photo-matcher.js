/**
 * PhotoMatcher - Matches family members with their profile photos
 * Uses fuzzy matching to find photos based on names
 */

/**
 * Get the appropriate display name for a person
 * Children in unions always show their birth name (name)
 * All other contexts show legal name if available, otherwise birth name
 */
function getDisplayName(person, context = 'default') {
    if (!person) return '';
    
    // Children contexts always show birth name
    if (context === 'children') {
        return person.name || '';
    }
    
    // All other contexts show legal name with fallback to birth name
    return person.legalName || person.name;
}

class PhotoMatcher {
    constructor() {
        this.photoManifest = null;
        this.photoCache = new Map();
        this.loadingPromise = null;
    }

    /**
     * Initialize the photo matcher by loading the manifest
     */
    async init() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.loadPhotoManifest();
        return this.loadingPromise;
    }

    /**
     * Load the photo manifest from the server
     */
    async loadPhotoManifest() {
        try {
            console.log('📸 PhotoMatcher: Loading photo manifest...');
            const timestamp = Date.now();
            const response = await fetch(`./images/arvore/photo-manifest.json?v=${timestamp}`);
            if (!response.ok) {
                throw new Error(`Failed to load photo manifest: ${response.status}`);
            }
            
            const photos = await response.json();
            
            // Create a Map for O(1) lookups with normalized keys
            this.photoManifest = new Map();
            photos.forEach(photo => {
                const normalizedName = this.normalizePhotoName(photo);
                // Only store photos WITHOUT timestamp (active photos)
                if (!/_\d{8}_\d{6}\./.test(photo)) {
                    this.photoManifest.set(normalizedName, photo);
                }
            });
            
            console.log(`📸 PhotoMatcher: Loaded ${this.photoManifest.size} photos`);
            return true;
        } catch (error) {
            console.warn('⚠️ PhotoMatcher: Failed to load photo manifest:', error);
            this.photoManifest = null;
            return false;
        }
    }

    /**
     * Normalize a photo filename to a searchable name
     */
    normalizePhotoName(photoFileName) {
        return photoFileName
            .replace(/\.(jpg|jpeg|png|gif)$/i, '') // Remove extension
            .toLowerCase()
            .trim();
    }

    /**
     * Normalize a person name for photo matching
     */
    normalizePersonName(personName) {
        return personName
            .toLowerCase()
            .trim();
    }

    /**
     * Check if a person has a photo and return the photo filename
     */
    async findPhotoForPerson(personName) {
        await this.init();
        
        if (!this.photoManifest) {
            console.warn('⚠️ PhotoMatcher: No photo manifest available');
            return null;
        }

        const normalizedName = this.normalizePersonName(personName);
        
        // Exact match only (active photos without timestamp)
        if (this.photoManifest.has(normalizedName)) {
            const photoFile = this.photoManifest.get(normalizedName);
            console.log(`✅ PhotoMatcher: Found exact match for "${personName}" -> "${photoFile}"`);
            return photoFile;
        }

        console.log(`❌ PhotoMatcher: No exact photo match found for "${personName}"`);
        return null;
    }

    /**
     * Get the photo URL for a person with cache-busting
     */
    getPhotoUrl(photoFileName) {
        const timestamp = Date.now();
        return `./images/arvore/${encodeURIComponent(photoFileName)}?v=${timestamp}`;
    }

    /**
     * Batch check multiple people for photos
     */
    async batchFindPhotos(familyMembers) {
        await this.init();
        
        console.log(`🔍 PhotoMatcher: Checking ${familyMembers.length} family members for photos...`);
        
        const results = [];
        for (const member of familyMembers) {
            // Try main name first, then legal name if different
            let photoFile = await this.findPhotoForPerson(member.name);
            
            // If no photo found and legal name exists and is different, try legal name
            if (!photoFile && member.legalName && member.legalName !== member.name) {
                photoFile = await this.findPhotoForPerson(member.legalName);
                if (photoFile) {
                    console.log(`✅ PhotoMatcher: Found photo using legal name for "${getDisplayName(member)}" -> "${photoFile}"`);
                }
            }
            
            results.push({
                member,
                photoFile,
                hasPhoto: !!photoFile,
                photoUrl: photoFile ? this.getPhotoUrl(photoFile) : null
            });
        }
        
        const photoCount = results.filter(r => r.hasPhoto).length;
        console.log(`📷 PhotoMatcher: Found ${photoCount} photos out of ${familyMembers.length} members`);
        
        return results;
    }

    /**
     * Get all available photo files
     */
    async getAllPhotoFiles() {
        await this.init();
        return this.photoManifest ? Array.from(this.photoManifest.values()) : [];
    }

    /**
     * Get statistics about photo coverage
     */
    async getPhotoStats(familyMembers) {
        const photoResults = await this.batchFindPhotos(familyMembers);
        const totalMembers = familyMembers.length;
        const membersWithPhotos = photoResults.filter(r => r.hasPhoto).length;
        
        return {
            totalMembers,
            membersWithPhotos,
            coveragePercentage: Math.round((membersWithPhotos / totalMembers) * 100),
            photoResults
        };
    }
}

// Expose globally
window.PhotoMatcher = PhotoMatcher;
