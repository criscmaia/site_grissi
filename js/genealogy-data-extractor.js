console.log('🔧 GenealogyDataExtractor v7 loaded at:', new Date().toISOString());

/**
 * Genealogy Data Extractor
 * Automatically extracts structured genealogical data from HTML format
 */

class GenealogyDataExtractor {
    constructor() {
        this.familyData = { 
            metadata: {
                version: "2.0",
                lastUpdated: new Date().toISOString().split('T')[0],
                dataSource: "arvore completa_20250806_v1.html",
                totalMembers: 0,
                generations: 0
            },
            familyMembers: []
        };
        this.currentMember = null;
        this.generationMap = {
            'ROOT': 1, 'F': 2, 'N': 3, 'BN': 4, 'TN': 5, 'QN': 6, 'PN': 7
        };
        this.memberIndex = new Map();
        this.generationCounts = new Map();
    }

    /**
     * Extract data from HTML content
     */
    async extractFromHTML(htmlContent) {
        try {
            console.log('🔍 Starting data extraction from HTML...');
            
            // Parse HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // Extract all text content
            const textContent = doc.body.textContent;
            
            // Split into sections and process
            const sections = this.splitIntoSections(textContent);
            
            // Store raw sections for parent lookup
            this.familyData.rawSections = sections;
            
            // Process each section
            sections.forEach(section => {
                this.processSection(section);
            });
            
            // Build relationships and indexes
            this.buildRelationships();
            this.buildIndexes();
            
            // Update metadata
            this.updateMetadata();
            
            console.log(`✅ Extraction completed: ${this.familyData.familyMembers.length} members found`);
            
            return this.familyData;
            
        } catch (error) {
            console.error('❌ Extraction failed:', error);
            throw error;
        }
    }

    /**
     * Split HTML content into manageable sections
     */
    splitIntoSections(textContent) {
        // Split by person identifiers (e.g., "1.1.", "1.1.2.", etc.)
        const personPattern = /(\d+\.\d+(?:\.\d+)*\.)/g;
        const sections = [];
        let lastIndex = 0;
        let match;

        while ((match = personPattern.exec(textContent)) !== null) {
            if (lastIndex < match.index) {
                sections.push(textContent.substring(lastIndex, match.index).trim());
            }
            lastIndex = match.index;
        }

        // Add remaining content
        if (lastIndex < textContent.length) {
            sections.push(textContent.substring(lastIndex).trim());
        }

        return sections.filter(section => section.length > 10);
    }

    /**
     * Process a section of text to extract person data
     */
    processSection(section) {
        // Extract person ID
        const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
        if (!idMatch) return;

        const personId = idMatch[1].replace(/\.$/, '');
        
        // Extract person name
        const nameMatch = section.match(/(?:F\s*-\s*|N\s*-\s*|BN\s*-\s*|TN\s*-\s*|QN\s*-\s*|PN\s*-\s*)?\d+\.\d+(?:\.\d+)*\.\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$)/);
        if (!nameMatch) return;

        const personName = nameMatch[1].trim();
        
        // Determine generation and gender
        const generationInfo = this.extractGenerationInfo(section);
        
        // Extract vital information
        const vitalInfo = this.extractVitalInfo(section);
        
        // Extract family information
        const families = this.extractFamilyInfo(section, personId);
        
        // Create person object
        const person = {
            id: personId,
            name: personName,
            generation: generationInfo.generation,
            gender: generationInfo.gender,
            vitalInfo: vitalInfo,
            parents: this.extractParents(section),
            families: families,
            observations: this.extractObservations(section),
            photos: {
                hasPhoto: false,
                photoPath: null
            }
        };

        // Add to family data
        this.familyData.familyMembers.push(person);
        this.memberIndex.set(personId, person);
        
        // Update generation count
        const gen = generationInfo.generation;
        this.generationCounts.set(gen, (this.generationCounts.get(gen) || 0) + 1);
    }

    /**
     * Extract generation information and gender
     */
    extractGenerationInfo(section) {
        // Calculate generation based on ID structure: (amount of digits) - 1
        const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
        let generation = 1; // Default
        let gender = 'male'; // Default

        if (idMatch) {
            const personId = idMatch[1].replace(/\.$/, '');
            const digitCount = personId.split('.').length;
            generation = digitCount - 1; // Correct formula: digits - 1
        }

        // Determine gender from birth description ("Nascido" vs "Nascida")
        if (section.includes('Nascido ')) {
            gender = 'male';
        } else if (section.includes('Nascida ')) {
            gender = 'female';
        } else {
            // Fallback: Determine gender from name patterns (Portuguese names ending in 'a' are typically female)
        const nameMatch = section.match(/(?:F\s*-\s*|N\s*-\s*|BN\s*-\s*|TN\s*-\s*|QN\s*-\s*|PN\s*-\s*)?\d+\.\d+(?:\.\d+)*\.\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$)/);
        if (nameMatch) {
            const name = nameMatch[1].trim();
            if (name.endsWith('A') || name.endsWith('A')) {
                gender = 'female';
                }
            }
        }

        return { generation, gender };
    }

    /**
     * Extract vital information (birth, death)
     */
    extractVitalInfo(section) {
        const vitalInfo = {
            birth: {
                date: null,
                location: null,
                formattedDate: "Data não registrada"
            },
            death: {
                date: null,
                location: null,
                age: null,
                formattedDate: "Data não registrada"
            }
        };

        // Clean HTML tags from section for better pattern matching
        const cleanSection = section.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        // Extract birth information - improved pattern to handle "Nascido em [location] em [date]"
        const birthMatch = cleanSection.match(/Nascido? em ([^,]+?)(?:, ([^,]+?))? em ([^,]+?)(?:\.|$)/i);
        if (birthMatch) {
            const location = birthMatch[1].trim();
            const country = birthMatch[2] ? birthMatch[2].trim() : null;
            const dateStr = birthMatch[3].trim();
            
            // Set location (combine location and country if both exist)
            vitalInfo.birth.location = country ? `${location}, ${country}` : location;
            vitalInfo.birth.formattedDate = dateStr;
            
            // Try to parse date
            const parsedDate = this.parseDate(dateStr);
            if (parsedDate) {
                vitalInfo.birth.date = parsedDate;
            }
        } else {
            // Fallback to original pattern for other formats
            const fallbackMatch = cleanSection.match(/Nascido? em ([^,]+)(?:, em ([^.]+))?/i);
            if (fallbackMatch) {
                const birthDate = fallbackMatch[1].trim();
                vitalInfo.birth.formattedDate = birthDate;
            
            // Extract location from the birth date string if it contains location info
            const locationMatch = birthDate.match(/^([^,]+?)(?:\s+em\s+([^.]+))?$/);
            if (locationMatch) {
                vitalInfo.birth.formattedDate = locationMatch[1].trim();
                if (locationMatch[2]) {
                    vitalInfo.birth.location = locationMatch[2].trim();
                }
            }
            
            // Try to parse date
            const parsedDate = this.parseDate(locationMatch ? locationMatch[1].trim() : birthDate);
            if (parsedDate) {
                vitalInfo.birth.date = parsedDate;
                }
            }
        }

        // Extract death information - handle both HTML and plain text
        const deathMatch = cleanSection.match(/Falecido? em ([^,]+)(?:, com (\d+) anos)?(?: na cidade de ([^.]+))?/i);
        if (deathMatch) {
            const deathDate = deathMatch[1].trim();
            vitalInfo.death.formattedDate = deathDate;
            
            // Extract age and location from the death string
            const deathDetailsMatch = deathDate.match(/^([^,]+?)(?:\s+com\s+(\d+)\s+anos)?(?:\s+na\s+cidade\s+de\s+([^.]+))?$/);
            if (deathDetailsMatch) {
                vitalInfo.death.formattedDate = deathDetailsMatch[1].trim();
                if (deathDetailsMatch[2]) {
                    vitalInfo.death.age = parseInt(deathDetailsMatch[2]);
                }
                if (deathDetailsMatch[3]) {
                    vitalInfo.death.location = deathDetailsMatch[3].trim();
                }
            }
            
            // Try to parse date
            const parsedDate = this.parseDate(deathDetailsMatch ? deathDetailsMatch[1].trim() : deathDate);
            if (parsedDate) {
                vitalInfo.death.date = parsedDate;
            }
        }

        return vitalInfo;
    }

    /**
     * Parse date string to ISO format
     */
    parseDate(dateStr) {
        if (!dateStr || dateStr === "Data não registrada") return null;
        
        // Handle various date formats
        const patterns = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
            /(\d{4})/, // YYYY
            /~(\d{4})/ // ~YYYY
        ];

        for (const pattern of patterns) {
            const match = dateStr.match(pattern);
            if (match) {
                if (match.length === 4) {
                    // DD/MM/YYYY format
                    const [_, day, month, year] = match;
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                } else if (match.length === 2) {
                    // YYYY or ~YYYY format
                    const year = match[1];
                    return `${year}-01-01`;
                }
            }
        }

        return null;
    }

    /**
     * Extract parent information
     */
    extractParents(section) {
        const parents = {
            father: null,
            mother: null
        };

        // Extract person ID to find the parent (ID above)
        const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
        if (!idMatch) return parents;

        const personId = idMatch[1].replace(/\.$/, '');
        
        // Debug logging
        console.log(`🔍 Extracting parents for ${personId}:`, section.substring(0, 100) + '...');
        
        // Find parent by looking for the ID just above this person
        const parentId = this.getParentId(personId);
        if (parentId) {
            console.log(`🔍 Found parent ID: ${parentId}`);
            
            // Look for the parent section in raw sections
            const parentSection = this.findMemberSection(parentId);
            if (parentSection) {
                console.log(`🔍 Found parent section:`, parentSection.substring(0, 100) + '...');
                
                // Extract parent name and gender from the parent section
                const parentNameMatch = parentSection.match(/(?:F\s*-\s*|N\s*-\s*|BN\s*-\s*|TN\s*-\s*|QN\s*-\s*|PN\s*-\s*)?\d+\.\d+(?:\.\d+)*\.\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$)/);
                if (parentNameMatch) {
                    const parentName = parentNameMatch[1].trim();
                    console.log(`🔍 Parent name: ${parentName}`);
                    
                    // Determine parent gender from birth description
                    let parentGender = 'male'; // default
                    if (parentSection.includes('Nascida ')) {
                        parentGender = 'female';
                    }
                    console.log(`🔍 Parent gender: ${parentGender}`);
                    
                    // Assign to father or mother based on gender
                    if (parentGender === 'male') {
                        parents.father = parentName;
                        
                        // For male parent, try to find his spouse (mother) from his marriage info
                        const spouseMatch = parentSection.match(/Casou-se[^,]*com ([^.]+?)(?:, nascido? em [^,]+? em [^,]+?)?(?:, filho? de ([^,]+?) e ([^,]+?))?/i);
                        if (spouseMatch) {
                            let spouseName = spouseMatch[1].trim();
                            console.log(`🔍 Found spouse match: ${spouseName}`);
                            
                            // Check if spouse changed their name after marriage
                            const nameChangeMatch = parentSection.match(/que passou a assinar ([^.]+?)(?:\.|$)/i);
                            if (nameChangeMatch) {
                                spouseName = nameChangeMatch[1].trim();
                                console.log(`🔍 Name changed to: ${spouseName}`);
                            }
                            
                            parents.mother = spouseName;
                        } else {
                            console.log(`🔍 No spouse match found in parent section`);
                        }
                    } else {
                        parents.mother = parentName;
                        
                        // For female parent, try to find her spouse (father) from her marriage info
                        const spouseMatch = parentSection.match(/Casou-se[^,]*com ([^.]+?)(?:, nascido? em [^,]+? em [^,]+?)?(?:, filho? de ([^,]+?) e ([^,]+?))?/i);
                        if (spouseMatch) {
                            let spouseName = spouseMatch[1].trim();
                            
                            // Check if spouse changed their name after marriage
                            const nameChangeMatch = parentSection.match(/que passou a assinar ([^.]+?)(?:\.|$)/i);
                            if (nameChangeMatch) {
                                spouseName = nameChangeMatch[1].trim();
                            }
                            
                            parents.father = spouseName;
                        }
                    }
                }
            } else {
                console.log(`🔍 Parent section not found for ID: ${parentId}`);
            }
        }

        // If we still don't have both parents, try to extract from current person's marriage info
        if (!parents.father || !parents.mother) {
            const marriageMatch = section.match(/Casou-se[^,]*com ([^.]+?)(?:, nascido? em [^,]+? em [^,]+?)?(?:, filho? de ([^,]+?) e ([^,]+?))?/i);
            if (marriageMatch) {
                const spouseName = marriageMatch[1].trim();
                const paternalGrandfather = marriageMatch[2] ? marriageMatch[2].trim() : null;
                const paternalGrandmother = marriageMatch[3] ? marriageMatch[3].trim() : null;
                
                // Determine if this is the father or mother based on the parent we already found
                if (parents.father && !parents.mother) {
                    // If we already have a father, this must be the mother
                    parents.mother = spouseName;
                    if (paternalGrandfather && paternalGrandmother) {
                        parents.mother += `, filha de ${paternalGrandfather} e ${paternalGrandmother}`;
                    }
                } else if (parents.mother && !parents.father) {
                    // If we already have a mother, this must be the father
                    parents.father = spouseName;
                    if (paternalGrandfather && paternalGrandmother) {
                        parents.father += `, filho de ${paternalGrandfather} e ${paternalGrandmother}`;
                    }
                } else if (!parents.father && !parents.mother) {
                    // If we don't have a parent yet, try to determine gender from the name
                    if (spouseName.endsWith('A') || spouseName.endsWith('A')) {
                        parents.mother = spouseName;
                        if (paternalGrandfather && paternalGrandmother) {
                            parents.mother += `, filha de ${paternalGrandfather} e ${paternalGrandmother}`;
                        }
                    } else {
                        parents.father = spouseName;
                        if (paternalGrandfather && paternalGrandmother) {
                            parents.father += `, filho de ${paternalGrandfather} e ${paternalGrandmother}`;
                        }
                    }
                }
            }
        }

        // Fallback: Extract spouse from the "Filho de" section if no marriage info found
        if (!parents.father && !parents.mother) {
            const parentMatch = section.match(/Filho? de ([^.]+?)(?:\.|$)/i);
        if (parentMatch) {
            const parentText = parentMatch[1];
                
                // Look for spouse information in the same section
                const spouseMatch = parentText.match(/^([^,]+?)(?:, nascido? em [^,]+? em [^,]+?)?(?:, filho? de ([^,]+?) e ([^,]+?))?$/i);
                
                if (spouseMatch) {
                    const spouseName = spouseMatch[1].trim();
                    const paternalGrandfather = spouseMatch[2] ? spouseMatch[2].trim() : null;
                    const paternalGrandmother = spouseMatch[3] ? spouseMatch[3].trim() : null;
                    
                    // Determine if this is the father or mother based on the parent we already found
                    if (parents.father && !parents.mother) {
                        parents.mother = spouseName;
                        if (paternalGrandfather && paternalGrandmother) {
                            parents.mother += `, filha de ${paternalGrandfather} e ${paternalGrandmother}`;
                        }
                    } else if (parents.mother && !parents.father) {
                        parents.father = spouseName;
                        if (paternalGrandfather && paternalGrandmother) {
                            parents.father += `, filho de ${paternalGrandfather} e ${paternalGrandmother}`;
                        }
                    } else if (!parents.father && !parents.mother) {
                        // If we don't have a parent yet, try to determine gender from the name
                        if (spouseName.endsWith('A') || spouseName.endsWith('A')) {
                            parents.mother = spouseName;
                            if (paternalGrandfather && paternalGrandmother) {
                                parents.mother += `, filha de ${paternalGrandfather} e ${paternalGrandmother}`;
                            }
                        } else {
                            parents.father = spouseName;
                            if (paternalGrandfather && paternalGrandmother) {
                                parents.father += `, filho de ${paternalGrandfather} e ${paternalGrandmother}`;
                            }
                        }
                    }
                } else {
                    // Fallback: try to extract spouse name from the parent text
                    const spouseName = parentText.trim();
                    
                    // Determine if this is the father or mother based on the parent we already found
                    if (parents.father && !parents.mother) {
                        parents.mother = spouseName;
                    } else if (parents.mother && !parents.father) {
                        parents.father = spouseName;
                    } else if (!parents.father && !parents.mother) {
                        // If we don't have a parent yet, try to determine gender from the name
                        if (spouseName.endsWith('A') || spouseName.endsWith('A')) {
                            parents.mother = spouseName;
                        } else {
                            parents.father = spouseName;
                        }
                    }
                }
            }
        }

        return parents;
    }

    findMemberSection(memberId) {
        // Find the HTML section for a specific member ID
        const sections = this.familyData.rawSections || [];
        for (const section of sections) {
            const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
            if (idMatch && idMatch[1].replace(/\.$/, '') === memberId) {
                return section;
            }
        }
        return null;
    }

    /**
     * Extract family information (spouses, children)
     */
    extractFamilyInfo(section, personId) {
        const families = [];
        
        // Extract spouse information
        const spouseMatches = section.matchAll(/Casou-se (?:em [^,]+)? com ([^.]+?)(?:, nascido? em ([^.]+))?/gi);
        
        let unionNumber = 1;
        for (const match of spouseMatches) {
            const spouseName = match[1].trim();
            const spouseBirthLocation = match[2] ? match[2].trim() : null;
            
            const family = {
                unionNumber: unionNumber++,
                spouse: {
                    name: spouseName,
                    vitalInfo: {
                        birth: {
                            date: null,
                            location: spouseBirthLocation,
                            formattedDate: "Data não registrada"
                        },
                        death: {
                            date: null,
                            location: null,
                            age: null,
                            formattedDate: "Data não registrada"
                        }
                    },
                    parents: {
                        father: null,
                        mother: null
                    }
                },
                marriage: {
                    date: null,
                    formattedDate: "Data não registrada",
                    location: null
                },
                endDate: null,
                children: []
            };

            // Extract spouse death information
            const spouseDeathMatch = section.match(new RegExp(`${spouseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*falecido? em ([^,]+)(?:, com (\\d+) anos)?`, 'i'));
            if (spouseDeathMatch) {
                family.spouse.vitalInfo.death.formattedDate = spouseDeathMatch[1].trim();
                if (spouseDeathMatch[2]) {
                    family.spouse.vitalInfo.death.age = parseInt(spouseDeathMatch[2]);
                }
            }

            // Extract children
            const children = this.extractChildren(section, personId);
            family.children = children;

            families.push(family);
        }

        return families;
    }

    /**
     * Extract children information
     */
    extractChildren(section, parentId) {
        const children = [];
        
        // Look for child patterns
        const childPattern = new RegExp(`(\\d+\\.\\d+(?:\\.\\d+)*\\.)\\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\s]+?)(?=\\n|$)`, 'g');
        let match;
        
        while ((match = childPattern.exec(section)) !== null) {
            const childId = match[1].replace(/\.$/, '');
            const childName = match[2].trim();
            
            // Only include direct children (one level deeper)
            if (this.isDirectChild(parentId, childId)) {
                children.push({
                    id: childId,
                    name: childName,
                    birthYear: this.extractBirthYear(section, childName)
                });
            }
        }

        return children;
    }

    /**
     * Check if childId is a direct child of parentId
     */
    isDirectChild(parentId, childId) {
        const parentParts = parentId.split('.');
        const childParts = childId.split('.');
        
        return childParts.length === parentParts.length + 1 && 
               childId.startsWith(parentId + '.');
    }

    /**
     * Extract birth year for a child
     */
    extractBirthYear(section, childName) {
        const yearMatch = section.match(new RegExp(`${childName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.]*nascido? em (\\d{4})`, 'i'));
        return yearMatch ? parseInt(yearMatch[1]) : "Data não registrada";
    }

    /**
     * Extract observations
     */
    extractObservations(section) {
        const observations = [];
        
        // Look for observation patterns
        const obsMatch = section.match(/Obs:([^.]+)/i);
        if (obsMatch) {
            observations.push(obsMatch[1].trim());
        }

        return observations;
    }

    /**
     * Build relationships between family members
     */
    buildRelationships() {
        this.familyData.familyMembers.forEach(member => {
            member.relationships = {
                siblings: this.findSiblings(member.id)
            };
        });
    }

    /**
     * Find siblings of a person
     */
    findSiblings(personId) {
        // Extract the base ID structure (everything except the last digit)
        const parts = personId.split('.');
        if (parts.length <= 1) return [];

        const baseStructure = parts.slice(0, -1).join('.') + '.';
        
        // Find all members with the same base structure but different last digit
        return this.familyData.familyMembers
            .filter(member => {
                const memberParts = member.id.split('.');
                const memberBaseStructure = memberParts.slice(0, -1).join('.') + '.';
                return memberBaseStructure === baseStructure && member.id !== personId;
            })
            .map(member => member.id)
            .sort(); // Sort for consistent ordering
    }

    /**
     * Find ancestors of a person
     */
    findAncestors(personId) {
        const ancestors = [];
        let currentId = personId;
        
        while (currentId) {
            const parentId = this.getParentId(currentId);
            if (parentId) {
                ancestors.push(parentId);
                currentId = parentId;
            } else {
                break;
            }
        }

        return ancestors;
    }



    /**
     * Get parent ID from person ID
     */
    getParentId(personId) {
        const parts = personId.split('.');
        if (parts.length <= 1) return null;
        
        parts.pop();
        return parts.join('.');
    }

    /**
     * Build search indexes for performance
     */
    buildIndexes() {
        this.familyData.indexes = {
            byName: new Map(),
            byGeneration: new Map(),
            byLocation: new Map(),
            byDateRange: new Map()
        };

        this.familyData.familyMembers.forEach(member => {
            // Name index
            this.familyData.indexes.byName.set(member.name.toLowerCase(), member.id);
            
            // Generation index
            if (!this.familyData.indexes.byGeneration.has(member.generation)) {
                this.familyData.indexes.byGeneration.set(member.generation, []);
            }
            this.familyData.indexes.byGeneration.get(member.generation).push(member.id);
            
            // Location index
            if (member.vitalInfo.birth.location) {
                const location = member.vitalInfo.birth.location.toLowerCase();
                if (!this.familyData.indexes.byLocation.has(location)) {
                    this.familyData.indexes.byLocation.set(location, []);
                }
                this.familyData.indexes.byLocation.get(location).push(member.id);
            }
        });
    }

    /**
     * Update metadata with final counts
     */
    updateMetadata() {
        this.familyData.metadata.totalMembers = this.familyData.familyMembers.length;
        this.familyData.metadata.generations = Math.max(...this.familyData.familyMembers.map(m => m.generation));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenealogyDataExtractor;
}
