console.log('🔧 GenealogyDataExtractor FIXED loaded at:', new Date().toISOString());

/**
 * Genealogy Data Extractor - FIXED VERSION
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
            
            // Store raw sections for parent lookup (but don't include in final output)
            this.rawSections = sections;
            
            // Process each section
            sections.forEach(section => {
                this.processSection(section);
            });
            
            // Build relationships and indexes
            this.buildRelationships();
            this.buildIndexes();
            
            // Update metadata
            this.updateMetadata();
            
            // Clean up - remove raw sections from final output
            const cleanFamilyData = {
                metadata: this.familyData.metadata,
                familyMembers: this.familyData.familyMembers
            };
            
            console.log(`✅ Extraction completed: ${this.familyData.familyMembers.length} members found`);
            
            return cleanFamilyData;
            
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

        // Filter sections and remove duplicates
        const seenIds = new Set();
        const filteredSections = sections.filter(section => {
            if (section.length < 5) return false;
            
            // Check if this section contains a unique ID
            const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
            if (idMatch) {
                const id = idMatch[1].replace(/\.$/, '');
                if (seenIds.has(id)) {
                    console.log(`🔍 Skipping duplicate section for ID: ${id}`);
                    return false;
                }
                seenIds.add(id);
            }
            return true;
        });
        
        console.log('🔍 Split sections:', filteredSections.length);
        console.log('🔍 All sections before filtering:', sections.length);
        console.log('🔍 Unique IDs found:', seenIds.size);
        
        return filteredSections;
    }

    /**
     * Process a section of text to extract person data
     */
    processSection(section) {
        // Extract person ID
        const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
        if (!idMatch) return;

        const personId = idMatch[1].replace(/\.$/, '');
        
        // Extract person name - improved regex to handle HTML tags and text content
        console.log('🔍 Raw section for name extraction:', section.substring(0, 200) + '...');
        
        // First try to extract name after the ID pattern
        let nameMatch = section.match(/(?:F\s*-\s*|N\s*-\s*|BN\s*-\s*|TN\s*-\s*|QN\s*-\s*|PN\s*-\s*)?\d+\.\d+(?:\.\d+)*\.\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$|<\/)/);
        
        let personName;
        if (nameMatch) {
            personName = nameMatch[1].trim();
            console.log('🔍 Name extracted via primary method:', personName);
        } else {
            // Fallback: try to extract name from the entire section
            const fallbackMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$|<\/)/);
            if (fallbackMatch) {
                personName = fallbackMatch[2].trim();
                console.log('🔍 Name extracted via fallback:', personName);
            } else {
                console.log('🔍 No name match found for section:', section.substring(0, 100) + '...');
                return;
            }
        }
        
        console.log(`🔍 Processing member: ${personName} (${personId})`);
        
        // Extract name information including legal name and changes
        const nameInfo = this.extractNameInfo(section, personName);
        
        // Extract generation and gender info
        const generationInfo = this.extractGenerationInfo(section);
        
        // Extract vital information
        const vitalInfo = this.extractVitalInfo(section);
        
        // Extract parent information
        const parents = this.extractParents(section);
        
        // Extract family information
        const familyInfo = this.extractFamilyInfo(section, personId);
        
        // Extract observations
        const observations = this.extractObservations(section);
        
        // Create family member object
        const familyMember = {
            id: personId,
            name: nameInfo.displayName,
            legalName: nameInfo.legalName,
            nameChanges: nameInfo.nameChanges,
            generation: generationInfo.generation,
            gender: generationInfo.gender,
            birthDate: vitalInfo.birthDate,
            birthLocation: vitalInfo.birthLocation,
            deathDate: vitalInfo.deathDate,
            deathLocation: vitalInfo.deathLocation,
            parents: parents,
            children: familyInfo.children,
            observations: observations,
            relationships: {
                siblings: [],
                ancestors: []
            }
        };
        
        // Add to family data
        this.familyData.familyMembers.push(familyMember);
        
        // Index the member
        this.memberIndex.set(personId, familyMember);
        
        // Update generation count
        const genKey = `gen_${generationInfo.generation}`;
        this.generationCounts.set(genKey, (this.generationCounts.get(genKey) || 0) + 1);
    }

    /**
     * Extract generation and gender information
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

        // Determine gender from birth description
        if (section.includes('Nascida ')) {
            gender = 'female';
        } else if (section.includes('Nascido ')) {
            gender = 'male';
        } else {
            // Fallback: check if name ends with 'A' (common for female names in Portuguese)
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
     * Extract vital information (birth, death) with separate date and location fields
     */
    extractVitalInfo(section) {
        let birthDate = null;
        let birthLocation = null;
        let deathDate = null;
        let deathLocation = null;

        // Extract birth information - multiple patterns to catch different formats
        let birthMatch = section.match(/Nascido? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i);
        
        if (!birthMatch) {
            // Try alternative format: "Nascido em [date], em [location]"
            birthMatch = section.match(/Nascido? em ([^,]+?),\s*em ([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!birthMatch) {
            // Try simple format: "Nascido em [date] em [location]"
            birthMatch = section.match(/Nascido? em ([^,\.\n]+?)\s+em ([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!birthMatch) {
            // Try very simple format: "Nascido em [date]"
            birthMatch = section.match(/Nascido? em ([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!birthMatch) {
            // Try format with "em" after date: "Nascido em [date] em [location]"
            birthMatch = section.match(/Nascido? em ([^,\.\n]+?)\s+em\s+([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!birthMatch) {
            // Try format with comma and "em": "Nascido em [date], em [location]"
            birthMatch = section.match(/Nascido? em ([^,]+?),\s*em\s+([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (birthMatch) {
            const birthData = birthMatch[1].trim();
            if (birthData && birthData.length > 3) {
                birthDate = birthData;
                console.log('🔍 Birth date extracted:', birthDate);
                
                if (birthMatch[2]) {
                    const locationData = birthMatch[2].trim();
                    if (locationData && locationData.length > 3) {
                        birthLocation = locationData;
                        console.log('🔍 Birth location extracted:', birthLocation);
                    }
                }
            } else {
                console.log('🔍 Invalid birth data captured:', birthData);
            }
        } else {
            console.log('🔍 No birth info found in section. Looking for patterns...');
            // Debug: show what we're looking at
            const nascidoMatch = section.match(/Nascido?/i);
            if (nascidoMatch) {
                console.log('🔍 Found "Nascido" but no match. Section excerpt:', section.substring(0, 200) + '...');
            }
        }

        // Extract death information - multiple patterns
        let deathMatch = section.match(/Faleceu? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i);
        
        if (!deathMatch) {
            // Try alternative format: "Faleceu em [date], em [location]"
            deathMatch = section.match(/Faleceu? em ([^,]+?),\s*em ([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!deathMatch) {
            // Try simple format: "Faleceu em [date]"
            deathMatch = section.match(/Faleceu? em ([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!deathMatch) {
            // Try format with "em" after date: "Faleceu em [date] em [location]"
            deathMatch = section.match(/Faleceu? em ([^,\.\n]+?)\s+em\s+([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!deathMatch) {
            // Try format with comma and "em": "Faleceu em [date], em [location]"
            deathMatch = section.match(/Faleceu? em ([^,]+?),\s*em\s+([^,\.\n]+?)(?:\.|$)/i);
        }
        
        if (!deathMatch) {
            // Try "Falecido" format
            deathMatch = section.match(/Falecido? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i);
        }
        
        if (!deathMatch) {
            // Try "Falecida" format
            deathMatch = section.match(/Falecida? em ([^,\.\n]+?)(?:, em ([^,\.\n]+?))?(?:\.|$)/i);
        }
        
        if (deathMatch) {
            const deathData = deathMatch[1].trim();
            if (deathData && deathData.length > 3) {
                deathDate = deathData;
                console.log('🔍 Death date extracted:', deathDate);
                
                if (deathMatch[2]) {
                    const locationData = deathMatch[2].trim();
                    if (locationData && locationData.length > 3) {
                        deathLocation = locationData;
                        console.log('🔍 Death location extracted:', deathLocation);
                    }
                }
            } else {
                console.log('🔍 Invalid death data captured:', deathData);
            }
        }

        return { birthDate, birthLocation, deathDate, deathLocation };
    }

    /**
     * Extract parent information with improved logic
     */
    extractParents(section) {
        console.log('🔍 Extracting parents for section:', section.substring(0, 100) + '...');
        
        const parents = {
            father: null,
            mother: null
        };

        // Extract person ID to find the parent (ID above)
        const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
        if (!idMatch) return parents;

        const personId = idMatch[1].replace(/\.$/, '');
        console.log('🔍 Person ID:', personId);
        
        // Find parent by looking for the ID just above this person
        const parentId = this.getParentId(personId);
        console.log('🔍 Found parent ID:', parentId);
        
        if (parentId) {
            // Look for the parent section in raw sections
            const parentSection = this.findMemberSection(parentId);
            console.log('🔍 Found parent section:', parentSection ? parentSection.substring(0, 100) + '...' : 'Not found');
            
            if (parentSection) {
                // Extract parent name and gender from the parent section
                const parentNameMatch = parentSection.match(/(?:F\s*-\s*|N\s*-\s*|BN\s*-\s*|TN\s*-\s*|QN\s*-\s*|PN\s*-\s*)?\d+\.\d+(?:\.\d+)*\.\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$)/);
                if (parentNameMatch) {
                    const parentName = parentNameMatch[1].trim();
                    console.log('🔍 Parent name:', parentName);
                    
                    // Determine parent gender from birth description
                    let parentGender = 'male'; // default
                    if (parentSection.includes('Nascida ')) {
                        parentGender = 'female';
                    }
                    console.log('🔍 Parent gender:', parentGender);
                    
                    // Assign to father or mother based on gender
                    if (parentGender === 'male') {
                        parents.father = parentName;
                        
                        // For male parent, try to find his spouse (mother) from his marriage info
                        console.log('🔍 Looking for spouse in parent section:', parentSection.substring(0, 200) + '...');
                        const spouseMatch = parentSection.match(/com\s+([^,]+?)(?:,|\.|$)/i);
                        console.log('🔍 Spouse match result:', spouseMatch);
                        if (spouseMatch) {
                            let spouseName = spouseMatch[1].trim();
                            console.log('🔍 Found spouse match:', spouseName);
                            
                            // Check if spouse changed their name after marriage
                            const nameChangeMatch = parentSection.match(/que passou a assinar ([^.]+?)(?:\.|$)/i);
                            if (nameChangeMatch) {
                                spouseName = nameChangeMatch[1].trim();
                                console.log('🔍 Name changed to:', spouseName);
                            }
                            
                            parents.mother = spouseName;
                        }
                    } else {
                        parents.mother = parentName;
                        
                        // For female parent, try to find her spouse (father) from her marriage info
                        const spouseMatch = parentSection.match(/com\s+([^,]+?)(?:,|\.|$)/i);
                        if (spouseMatch) {
                            let spouseName = spouseMatch[1].trim();
                            console.log('🔍 Found spouse match:', spouseName);
                            
                            // Check if spouse changed their name after marriage
                            const nameChangeMatch = parentSection.match(/que passou a assinar ([^.]+?)(?:\.|$)/i);
                            if (nameChangeMatch) {
                                spouseName = nameChangeMatch[1].trim();
                                console.log('🔍 Name changed to:', spouseName);
                            }
                            
                            parents.father = spouseName;
                        }
                    }
                }
            }
        }

        // If we still don't have both parents, try to extract from current person's marriage info
        // BUT only if we already have one parent (meaning we found the parent above)
        if ((parents.father && !parents.mother) || (parents.mother && !parents.father)) {
            const marriageMatch = section.match(/com\s+([^,]+?)(?:,|\.|$)/i);
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
                }
            }
        }

        // Fallback: Extract parents from the "Filho de" section if no marriage info found
        if (!parents.father && !parents.mother) {
            console.log('🔍 Looking for "Filho de" in section:', section.substring(0, 200) + '...');
            const parentMatch = section.match(/Filho? de ([^.]+?)(?:\.|$)/i);
            console.log('🔍 "Filho de" match:', parentMatch);
            
            if (parentMatch) {
                const parentText = parentMatch[1];
                console.log('🔍 Parent text from "Filho de":', parentText);
                
                // Extract the complete parent information from the "Filho de" section
                // This includes name, birth details, and grandparents when available
                const parentInfo = parentText.trim();
                console.log('🔍 Complete parent info from "Filho de":', parentInfo);
                
                // Check if it contains "e" (and) to separate father and mother
                if (parentInfo.includes(' e ')) {
                    const parts = parentInfo.split(' e ');
                    if (parts.length === 2) {
                        const fatherPart = parts[0].trim();
                        const motherPart = parts[1].trim();
                        
                        // Extract just the names, not the full descriptions
                        const fatherName = fatherPart.match(/^([^,]+?)(?:,|$)/);
                        const motherName = motherPart.match(/^([^,]+?)(?:,|$)/);
                        
                        if (fatherName) parents.father = fatherName[1].trim();
                        if (motherName) parents.mother = motherName[1].trim();
                        
                        console.log('🔍 Split parents - Father:', parents.father, 'Mother:', parents.mother);
                    }
                } else {
                    // Single parent mentioned
                    const nameMatch = parentInfo.match(/^([^,]+?)(?:,|$)/);
                    const parentName = nameMatch ? nameMatch[1].trim() : parentInfo;
                    
                    // Try to determine gender from the name or context
                    if (parentInfo.includes('nascido')) {
                        parents.father = parentName;
                    } else if (parentInfo.includes('nascida')) {
                        parents.mother = parentName;
                    } else {
                        // Default to father if we can't determine
                        parents.father = parentName;
                    }
                }
            }
        }

        console.log('🔍 Final parents:', parents);
        return parents;
    }

    /**
     * Find a member section by ID
     */
    findMemberSection(memberId) {
        if (!this.rawSections) return null;
        
        for (const section of this.rawSections) {
            const idMatch = section.match(/(\d+\.\d+(?:\.\d+)*\.)/);
            if (idMatch) {
                const sectionId = idMatch[1].replace(/\.$/, '');
                if (sectionId === memberId) {
                    return section;
                }
            }
        }
        return null;
    }

    /**
     * Extract family information (children, etc.)
     */
    extractFamilyInfo(section, personId) {
        const familyInfo = {
            children: []
        };

        // Extract children information - improved detection
        const childrenMatch = section.match(/Tem (\d+) filhos?:/i);
        if (childrenMatch) {
            const childCount = parseInt(childrenMatch[1]);
            console.log(`🔍 Found ${childCount} children mentioned for ${personId}`);
        }

        // Extract specific children if mentioned - improved regex
        const specificChildren = section.match(/(?:TN|QN|PN)\s*-\s*(\d+\.\d+(?:\.\d+)*\.)\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$|<\/)/g);
        if (specificChildren) {
            console.log(`🔍 Found ${specificChildren.length} specific children in section for ${personId}`);
            const seenChildIds = new Set();
            specificChildren.forEach(child => {
                const childMatch = child.match(/(?:TN|QN|PN)\s*-\s*(\d+\.\d+(?:\.\d+)*\.)\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+?)(?=\n|$|<\/)/);
                if (childMatch) {
                    const childId = childMatch[1].replace(/\.$/, '');
                    const childName = childMatch[2].trim();
                    
                    // Only add if not already seen
                    if (!seenChildIds.has(childId)) {
                        familyInfo.children.push(childId);
                        seenChildIds.add(childId);
                        console.log(`🔍 Added child: ${childName} (${childId})`);
                    } else {
                        console.log(`🔍 Skipping duplicate child: ${childName} (${childId})`);
                    }
                }
            });
        }

        // Also check for children mentioned in the "Tiveram X filhos:" section
        const tiveramMatch = section.match(/Tiveram (\d+) filhos?:/i);
        if (tiveramMatch) {
            const childCount = parseInt(tiveramMatch[1]);
            console.log(`🔍 Found "Tiveram ${childCount} filhos" for ${personId}`);
        }

        return familyInfo;
    }

    /**
     * Extract observations and additional notes
     */
    extractObservations(section) {
        const observations = [];

        // Extract other observations - improved filtering
        const otherObservations = section.match(/\.\s*([^.]+?)(?:\.|$)/g);
        if (otherObservations) {
            otherObservations.forEach(obs => {
                const cleanObs = obs.replace(/^\.\s*/, '').trim();
                // Filter out invalid observations and birth/death info
                if (cleanObs.length > 10 && 
                    !cleanObs.includes('Nascido') && 
                    !cleanObs.includes('Nascida') &&
                    !cleanObs.includes('Faleceu') &&
                    !cleanObs.includes('Falecido') &&
                    !cleanObs.includes('Falecida') &&
                    !cleanObs.includes('Casou-se') &&
                    !cleanObs.includes('F -') &&
                    !cleanObs.includes('N -') &&
                    !cleanObs.includes('BN -') &&
                    !cleanObs.includes('TN -') &&
                    !cleanObs.includes('QN -') &&
                    !cleanObs.includes('PN -') &&
                    !/^\d+\.\d+/.test(cleanObs) && // No ID patterns
                    !/^[A-Z\s]+$/.test(cleanObs) && // No all-caps names
                    !cleanObs.includes('Filho de') && // No parent info
                    !cleanObs.includes('Filha de') && // No parent info
                    cleanObs.length < 200) { // Reasonable length
                    observations.push(cleanObs);
                }
            });
        }

        return observations;
    }

    /**
     * Extract name information including legal name and name changes
     */
    extractNameInfo(section, displayName) {
        const nameInfo = {
            displayName: displayName,
            legalName: null,
            nameChanges: []
        };

        // Extract legal name from "Ela passou a assinar" pattern
        const legalNameMatch = section.match(/Ela passou a assinar\s+([^,\.\n]+)/i);
        if (legalNameMatch) {
            nameInfo.legalName = legalNameMatch[1].trim();
            console.log('🔍 Legal name extracted:', nameInfo.legalName);
            
            // Add name change record
            nameInfo.nameChanges.push({
                date: this.extractMarriageDate(section),
                from: displayName,
                to: nameInfo.legalName,
                reason: 'marriage',
                spouse: this.extractSpouseName(section)
            });
        }

        // Extract legal name from "Ele passou a assinar" pattern (for males)
        const legalNameMatchMale = section.match(/Ele passou a assinar\s+([^,\.\n]+)/i);
        if (legalNameMatchMale) {
            nameInfo.legalName = legalNameMatchMale[1].trim();
            console.log('🔍 Legal name extracted (male):', nameInfo.legalName);
            
            // Add name change record
            nameInfo.nameChanges.push({
                date: this.extractMarriageDate(section),
                from: displayName,
                to: nameInfo.legalName,
                reason: 'marriage',
                spouse: this.extractSpouseName(section)
            });
        }

        // If no legal name found, use display name as legal name
        if (!nameInfo.legalName) {
            nameInfo.legalName = displayName;
        }

        return nameInfo;
    }

    /**
     * Extract marriage date from section
     */
    extractMarriageDate(section) {
        const marriageMatch = section.match(/Casou-se\s+(?:em\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/i);
        return marriageMatch ? marriageMatch[1] : null;
    }

    /**
     * Extract spouse name from section
     */
    extractSpouseName(section) {
        const spouseMatch = section.match(/Casou-se[^,]*com\s+([^,\.\n]+)/i);
        return spouseMatch ? spouseMatch[1].trim() : null;
    }

    /**
     * Build relationships between family members
     */
    buildRelationships() {
        this.familyData.familyMembers.forEach(member => {
            // Find siblings
            member.relationships.siblings = this.findSiblings(member.id);
            
            // Remove ancestors as requested
            member.relationships.ancestors = [];
        });
    }

    /**
     * Find siblings for a given person
     */
    findSiblings(personId) {
        const siblings = [];
        const seenSiblings = new Set();
        
        // Get the base ID (all but the last digit)
        const baseId = personId.replace(/\.\d+$/, '');
        console.log(`🔍 Finding siblings for ${personId}, baseId: ${baseId}`);
        
        this.familyData.familyMembers.forEach(member => {
            console.log(`🔍 Checking member ${member.id} against ${personId}`);
            console.log(`🔍 - member.id !== personId: ${member.id !== personId}`);
            console.log(`🔍 - member.id.startsWith(baseId + '.'): ${member.id.startsWith(baseId + '.')}`);
            console.log(`🔍 - member.id.split('.').length === personId.split('.').length: ${member.id.split('.').length === personId.split('.').length}`);
            
            // Only include members with the same number of segments (same generation level)
            if (member.id !== personId && 
                member.id.startsWith(baseId + '.') && 
                member.id.split('.').length === personId.split('.').length) {
                
                // Only add if not already seen
                if (!seenSiblings.has(member.id)) {
                    siblings.push(member.id);
                    seenSiblings.add(member.id);
                    console.log(`🔍 ✅ Added ${member.id} as sibling`);
                } else {
                    console.log(`🔍 ⚠️ Skipping duplicate sibling: ${member.id}`);
                }
            }
        });
        
        console.log(`🔍 Final siblings for ${personId}:`, siblings);
        return siblings.sort();
    }

    /**
     * Get parent ID by removing the last segment
     */
    getParentId(personId) {
        const segments = personId.split('.');
        if (segments.length > 1) {
            segments.pop(); // Remove last segment
            return segments.join('.');
        }
        return null;
    }

    /**
     * Build indexes for quick lookup
     */
    buildIndexes() {
        this.familyData.familyMembers.forEach(member => {
            this.memberIndex.set(member.id, member);
        });
    }

    /**
     * Update metadata
     */
    updateMetadata() {
        this.familyData.metadata.totalMembers = this.familyData.familyMembers.length;
        this.familyData.metadata.generations = Math.max(...this.familyData.familyMembers.map(m => m.generation));
    }
}
