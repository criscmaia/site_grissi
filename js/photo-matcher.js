/**
 * PhotoMatcher - Handles matching family member names to photo files
 * Provides normalized name matching and photo URL generation
 */

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
            const response = await fetch('./images/arvore/photo-manifest.json');
            if (!response.ok) {
                throw new Error(`Failed to load photo manifest: ${response.status}`);
            }
            
            const photos = await response.json();
            
            // Create a Map for O(1) lookups with normalized keys
            this.photoManifest = new Map();
            photos.forEach(photo => {
                const normalizedName = this.normalizePhotoName(photo);
                this.photoManifest.set(normalizedName, photo);
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
        
        // Direct match
        if (this.photoManifest.has(normalizedName)) {
            const photoFile = this.photoManifest.get(normalizedName);
            console.log(`✅ PhotoMatcher: Found direct match for "${personName}" -> "${photoFile}"`);
            return photoFile;
        }

        // Try partial matching (for cases where names might have slight differences)
        for (const [normalizedPhotoName, photoFile] of this.photoManifest) {
            if (this.isPartialMatch(normalizedName, normalizedPhotoName)) {
                console.log(`✅ PhotoMatcher: Found partial match for "${personName}" -> "${photoFile}"`);
                return photoFile;
            }
        }

        console.log(`❌ PhotoMatcher: No photo found for "${personName}"`);
        return null;
    }

    /**
     * Check if two names are a partial match
     */
    isPartialMatch(personName, photoName) {
        // Split names into words
        const personWords = personName.split(/\s+/).filter(word => word.length > 2);
        const photoWords = photoName.split(/\s+/).filter(word => word.length > 2);
        
        // Check if most words match (at least 70% match)
        let matchCount = 0;
        for (const personWord of personWords) {
            for (const photoWord of photoWords) {
                if (personWord === photoWord || 
                    personWord.includes(photoWord) || 
                    photoWord.includes(personWord)) {
                    matchCount++;
                    break;
                }
            }
        }
        
        const matchPercentage = matchCount / Math.max(personWords.length, photoWords.length);
        return matchPercentage >= 0.7; // 70% match threshold
    }

    /**
     * Get the photo URL for a person
     */
    getPhotoUrl(photoFileName) {
        return `./images/arvore/${encodeURIComponent(photoFileName)}`;
    }

    /**
     * Batch check multiple people for photos
     */
    async batchFindPhotos(familyMembers) {
        await this.init();
        
        console.log(`🔍 PhotoMatcher: Checking ${familyMembers.length} family members for photos...`);
        
        const results = [];
        for (const member of familyMembers) {
            const photoFile = await this.findPhotoForPerson(member.name);
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
