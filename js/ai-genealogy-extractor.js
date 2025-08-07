console.log('🤖 AI Genealogy Extractor v1.0 loaded');

class AIGenealogyExtractor {
    constructor() {
        this.familyData = {
            metadata: {
                extractionDate: new Date().toISOString(),
                sourceFile: 'arvore completa_20250806_v1.html',
                totalMembers: 0,
                generations: 0,
                extractionMethod: 'AI-Powered NLP'
            },
            familyMembers: []
        };
        
        this.memberIndex = new Map();
        this.generationCounts = new Map();
        this.rawSections = [];
    }

    /**
     * Main extraction method using AI-like natural language processing
     */
    async extractFromHTML(htmlContent) {
        console.log('🤖 Starting AI-powered extraction...');
        
        // Parse HTML and extract text content
        const textContent = this.parseHTML(htmlContent);
        
        // Split into individual family member sections
        const sections = this.splitIntoSections(textContent);
        
        console.log(`📊 Found ${sections.length} potential family member sections`);
        
        // Process each section using AI-like analysis
        sections.forEach((section, index) => {
            if (section.length > 10) {
                console.log(`🔍 Processing section ${index + 1}/${sections.length}`);
                this.processSectionWithAI(section);
            }
        });
        
        // Build relationships using AI-like inference
        this.buildRelationshipsWithAI();
        
        // Update metadata
        this.updateMetadata();
        
        console.log(`✅ AI extraction completed: ${this.familyData.familyMembers.length} members found`);
        
        return this.familyData;
    }

    /**
     * Parse HTML and extract clean text content
     */
    parseHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Extract text content, preserving structure
        let textContent = '';
        const paragraphs = doc.querySelectorAll('p');
        
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text.length > 0) {
                textContent += text + '\n\n';
            }
        });
        
        return textContent;
    }

    /**
     * Split text into individual family member sections using AI-like pattern recognition
     */
    splitIntoSections(textContent) {
        const sections = [];
        const lines = textContent.split('\n');
        let currentSection = '';
        let inMemberSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // AI-like pattern recognition for family member headers
            if (this.isFamilyMemberHeader(line)) {
                if (currentSection.trim()) {
                    sections.push(currentSection.trim());
                }
                currentSection = line + '\n';
                inMemberSection = true;
            } else if (inMemberSection && line.length > 0) {
                currentSection += line + '\n';
            } else if (inMemberSection && line.length === 0) {
                // Empty line might indicate end of section
                if (currentSection.trim()) {
                    currentSection += '\n';
                }
            }
        }
        
        // Add the last section
        if (currentSection.trim()) {
            sections.push(currentSection.trim());
        }
        
        return sections.filter(section => section.length > 20);
    }

    /**
     * AI-like pattern recognition for family member headers
     */
    isFamilyMemberHeader(line) {
        // Look for patterns like "F - 1.1.", "N - 1.1.3.", "BN - 1.1.3.8.", etc.
        const headerPatterns = [
            /^[A-Z]+\s*-\s*\d+\.\d+(?:\.\d+)*\.\s*[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+$/,
            /^\d+\.\d+(?:\.\d+)*\.\s*[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+$/
        ];
        
        return headerPatterns.some(pattern => pattern.test(line));
    }

    /**
     * Process a section using AI-like natural language understanding
     */
    processSectionWithAI(section) {
        try {
            // Extract basic information using AI-like analysis
            const memberInfo = this.extractMemberInfoWithAI(section);
            
            if (!memberInfo.id || !memberInfo.name) {
                console.log('⚠️ Skipping section - no valid member info found');
                return;
            }
            
            // Extract vital information using natural language understanding
            const vitalInfo = this.extractVitalInfoWithAI(section);
            
            // Extract family relationships using context understanding
            const familyInfo = this.extractFamilyInfoWithAI(section, memberInfo.id);
            
            // Extract additional information
            const additionalInfo = this.extractAdditionalInfoWithAI(section);
            
            // Create family member object
            const familyMember = {
                id: memberInfo.id,
                name: memberInfo.name,
                legalName: additionalInfo.legalName,
                nameChanges: additionalInfo.nameChanges,
                generation: memberInfo.generation,
                gender: memberInfo.gender,
                birthDate: vitalInfo.birthDate,
                birthLocation: vitalInfo.birthLocation,
                deathDate: vitalInfo.deathDate,
                deathLocation: vitalInfo.deathLocation,
                parents: familyInfo.parents,
                children: familyInfo.children,
                observations: additionalInfo.observations,
                relationships: {
                    siblings: [],
                    ancestors: []
                }
            };
            
            // Add to family data
            this.familyData.familyMembers.push(familyMember);
            this.memberIndex.set(memberInfo.id, familyMember);
            
            // Update generation count
            const genKey = `gen_${memberInfo.generation}`;
            this.generationCounts.set(genKey, (this.generationCounts.get(genKey) || 0) + 1);
            
            console.log(`✅ Processed: ${memberInfo.name} (${memberInfo.id})`);
            
        } catch (error) {
            console.error('❌ Error processing section:', error);
        }
    }

    /**
     * Extract basic member information using AI-like analysis
     */
    extractMemberInfoWithAI(section) {
        const lines = section.split('\n');
        let id = null;
        let name = null;
        let generation = 1;
        let gender = 'unknown';
        
        // Find the header line with ID and name
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for ID pattern
            const idMatch = trimmedLine.match(/(\d+\.\d+(?:\.\d+)*\.)/);
            if (idMatch) {
                id = idMatch[1].replace(/\.$/, '');
                generation = id.split('.').length - 1;
                
                // Extract name after the ID
                const nameMatch = trimmedLine.match(/\d+\.\d+(?:\.\d+)*\.\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+)/);
                if (nameMatch) {
                    name = nameMatch[1].trim();
                }
                
                // Determine gender from context
                if (section.includes('Nascida ')) {
                    gender = 'female';
                } else if (section.includes('Nascido ')) {
                    gender = 'male';
                }
                
                break;
            }
        }
        
        return { id, name, generation, gender };
    }

    /**
     * Extract vital information using natural language understanding
     */
    extractVitalInfoWithAI(section) {
        let birthDate = null;
        let birthLocation = null;
        let deathDate = null;
        let deathLocation = null;
        
        // AI-like analysis: Look for birth information patterns
        const birthPatterns = [
            /Nascido? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i,
            /Nascido? em ([^,]+?),\s*em ([^,\.\n]+?)(?:\.|$)/i,
            /Nascido? em ([^,\.\n]+?)\s+em ([^,\.\n]+?)(?:\.|$)/i,
            /Nascido? em ([^,\.\n]+?)(?:\.|$)/i
        ];
        
        for (const pattern of birthPatterns) {
            const match = section.match(pattern);
            if (match) {
                birthDate = match[1].trim();
                if (match[2]) {
                    birthLocation = match[2].trim();
                }
                console.log(`🔍 Birth info: ${birthDate}${birthLocation ? ' in ' + birthLocation : ''}`);
                break;
            }
        }
        
        // AI-like analysis: Look for death information patterns
        const deathPatterns = [
            /Faleceu? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i,
            /Falecido? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i,
            /Falecida? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i
        ];
        
        for (const pattern of deathPatterns) {
            const match = section.match(pattern);
            if (match) {
                deathDate = match[1].trim();
                if (match[2]) {
                    deathLocation = match[2].trim();
                }
                console.log(`🔍 Death info: ${deathDate}${deathLocation ? ' in ' + deathLocation : ''}`);
                break;
            }
        }
        
        return { birthDate, birthLocation, deathDate, deathLocation };
    }

    /**
     * Extract family information using context understanding
     */
    extractFamilyInfoWithAI(section, personId) {
        const parents = { father: null, mother: null };
        const children = [];
        
        // AI-like analysis: Extract parent information
        const parentMatch = section.match(/Filho de ([^.]+?)(?:\.|$)/i);
        if (parentMatch) {
            const parentInfo = parentMatch[1].trim();
            
            // AI-like logic: Split combined parent names
            if (parentInfo.includes(' e ')) {
                const parts = parentInfo.split(' e ');
                if (parts.length >= 2) {
                    parents.father = parts[0].trim();
                    parents.mother = parts[1].trim();
                }
            } else {
                // Single parent - determine gender from context
                if (section.includes('Nascido ')) {
                    parents.father = parentInfo;
                } else if (section.includes('Nascida ')) {
                    parents.mother = parentInfo;
                }
            }
        }
        
        // AI-like analysis: Find children by looking for next generation IDs
        const childrenPattern = new RegExp(`(${personId}\\.\\d+)\\.`, 'g');
        let childMatch;
        while ((childMatch = childrenPattern.exec(section)) !== null) {
            children.push(childMatch[1]);
        }
        
        return { parents, children };
    }

    /**
     * Extract additional information using natural language understanding
     */
    extractAdditionalInfoWithAI(section) {
        let legalName = null;
        let nameChanges = [];
        let observations = [];
        
        // AI-like analysis: Look for legal name changes
        const legalNameMatch = section.match(/passou a assinar ([^.]+?)(?:\.|$)/i);
        if (legalNameMatch) {
            legalName = legalNameMatch[1].trim();
            nameChanges.push(legalName);
        }
        
        // AI-like analysis: Extract observations (clean text without vital info)
        const lines = section.split('\n');
        for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.length > 10 && 
                !cleanLine.includes('Nascido') && 
                !cleanLine.includes('Nascida') && 
                !cleanLine.includes('Faleceu') && 
                !cleanLine.includes('Falecido') && 
                !cleanLine.includes('Falecida') && 
                !cleanLine.includes('Casou-se') && 
                !cleanLine.includes('Filho de') && 
                !cleanLine.includes('Filha de') && 
                !/^\d+\.\d+/.test(cleanLine) && 
                !/^[A-Z\s]+$/.test(cleanLine)) {
                observations.push(cleanLine);
            }
        }
        
        return { legalName, nameChanges, observations };
    }

    /**
     * Build relationships using AI-like inference
     */
    buildRelationshipsWithAI() {
        console.log('🤖 Building family relationships with AI-like inference...');
        
        this.familyData.familyMembers.forEach(member => {
            // Find siblings (same generation, same parent)
            const siblings = this.findSiblingsWithAI(member.id);
            member.relationships.siblings = siblings;
            
            // Find children (next generation)
            const children = this.findChildrenWithAI(member.id);
            member.children = children;
        });
    }

    /**
     * Find siblings using AI-like logic
     */
    findSiblingsWithAI(personId) {
        const siblings = [];
        const personGeneration = personId.split('.').length;
        const parentId = this.getParentId(personId);
        
        this.familyData.familyMembers.forEach(member => {
            if (member.id !== personId && 
                member.id.split('.').length === personGeneration &&
                this.getParentId(member.id) === parentId) {
                siblings.push(member.id);
            }
        });
        
        return siblings;
    }

    /**
     * Find children using AI-like logic
     */
    findChildrenWithAI(personId) {
        const children = [];
        
        this.familyData.familyMembers.forEach(member => {
            if (member.id.startsWith(personId + '.') && 
                member.id.split('.').length === personId.split('.').length + 1) {
                children.push(member.id);
            }
        });
        
        return children;
    }

    /**
     * Get parent ID using AI-like logic
     */
    getParentId(personId) {
        const parts = personId.split('.');
        if (parts.length > 1) {
            parts.pop();
            return parts.join('.');
        }
        return null;
    }

    /**
     * Update metadata with AI-extracted information
     */
    updateMetadata() {
        this.familyData.metadata.totalMembers = this.familyData.familyMembers.length;
        
        // Find maximum generation
        let maxGeneration = 0;
        this.familyData.familyMembers.forEach(member => {
            if (member.generation > maxGeneration) {
                maxGeneration = member.generation;
            }
        });
        
        this.familyData.metadata.generations = maxGeneration;
        
        console.log(`📊 Metadata updated: ${this.familyData.metadata.totalMembers} members, ${maxGeneration} generations`);
    }
}

// Export for use in other files
window.AIGenealogyExtractor = AIGenealogyExtractor;
