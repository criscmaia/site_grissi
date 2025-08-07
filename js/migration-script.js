/**
 * Genealogy Migration Script
 * Orchestrates the complete migration from HTML to enhanced JSON format
 */

class GenealogyMigrationScript {
    constructor() {
        this.extractor = new GenealogyDataExtractor();
        this.validator = new GenealogyDataValidator();
        this.migrationResults = {
            success: false,
            startTime: null,
            endTime: null,
            duration: null,
            extractedData: null,
            validationResults: null,
            errors: [],
            warnings: []
        };
    }

    /**
     * Run the complete migration process
     */
    async runMigration() {
        try {
            console.log('🚀 Starting genealogy data migration...');
            this.migrationResults.startTime = new Date();
            
            // Step 1: Load HTML content
            const htmlContent = await this.loadHTMLContent();
            
            // Step 2: Extract structured data
            const extractedData = await this.extractData(htmlContent);
            
            // Step 3: Validate extracted data
            const validationResults = await this.validateData(extractedData);
            
            // Step 4: Generate enhanced JSON
            const enhancedData = await this.generateEnhancedJSON(extractedData, validationResults);
            
            // Step 5: Save the new JSON file
            await this.saveJSONFile(enhancedData);
            
            // Step 6: Generate migration report
            const report = this.generateMigrationReport(enhancedData, validationResults);
            
            // Update migration results
            this.migrationResults.success = true;
            this.migrationResults.endTime = new Date();
            this.migrationResults.duration = this.migrationResults.endTime - this.migrationResults.startTime;
            this.migrationResults.extractedData = extractedData;
            this.migrationResults.validationResults = validationResults;
            
            console.log('✅ Migration completed successfully!');
            console.log(`📊 Migration Report:`, report);
            
            return {
                success: true,
                data: enhancedData,
                report: report
            };
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            this.migrationResults.success = false;
            this.migrationResults.errors.push(error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load HTML content from file
     */
    async loadHTMLContent() {
        try {
            console.log('📖 Loading HTML content...');
            
            const response = await fetch('arvore completa_20250806_v1.html');
            if (!response.ok) {
                throw new Error(`Failed to load HTML file: ${response.status} ${response.statusText}`);
            }
            
            const htmlContent = await response.text();
            console.log(`✅ HTML content loaded: ${htmlContent.length} characters`);
            
            return htmlContent;
            
        } catch (error) {
            console.error('❌ Failed to load HTML content:', error);
            throw error;
        }
    }

    /**
     * Extract structured data from HTML
     */
    async extractData(htmlContent) {
        try {
            console.log('🔍 Extracting structured data...');
            
            const extractedData = await this.extractor.extractFromHTML(htmlContent);
            
            console.log(`✅ Data extraction completed: ${extractedData.familyMembers.length} members extracted`);
            
            return extractedData;
            
        } catch (error) {
            console.error('❌ Data extraction failed:', error);
            throw error;
        }
    }

    /**
     * Validate extracted data
     */
    async validateData(extractedData) {
        try {
            console.log('🔍 Validating extracted data...');
            
            const validationResults = this.validator.validateDataStructure(extractedData);
            
            console.log(`✅ Data validation completed: ${validationResults.statistics.validMembers}/${validationResults.statistics.totalMembers} members valid`);
            
            return validationResults;
            
        } catch (error) {
            console.error('❌ Data validation failed:', error);
            throw error;
        }
    }

    /**
     * Generate enhanced JSON with additional features
     */
    async generateEnhancedJSON(extractedData, validationResults) {
        try {
            console.log('🔧 Generating enhanced JSON...');
            
            // Create enhanced data structure
            const enhancedData = {
                metadata: {
                    ...extractedData.metadata,
                    migrationInfo: {
                        sourceFile: 'arvore completa_20250806_v1.html',
                        migrationDate: new Date().toISOString(),
                        migrationVersion: '2.0',
                        validationResults: this.validator.getValidationSummary()
                    },
                    performance: {
                        totalMembers: extractedData.familyMembers.length,
                        generations: Math.max(...extractedData.familyMembers.map(m => m.generation)),
                        averageChildrenPerFamily: this.calculateAverageChildren(extractedData.familyMembers),
                        dataCompleteness: validationResults.statistics.completenessPercentage
                    }
                },
                familyMembers: extractedData.familyMembers.map(member => this.enhanceMember(member)),
                indexes: extractedData.indexes || this.buildDefaultIndexes(extractedData.familyMembers),
                statistics: this.generateStatistics(extractedData.familyMembers),
                search: {
                    enabled: true,
                    fields: ['name', 'location', 'generation'],
                    filters: ['gender', 'generation', 'location']
                }
            };
            
            console.log('✅ Enhanced JSON generated');
            
            return enhancedData;
            
        } catch (error) {
            console.error('❌ Enhanced JSON generation failed:', error);
            throw error;
        }
    }

    /**
     * Enhance a family member with additional computed fields
     */
    enhanceMember(member) {
        return {
            ...member,
            computed: {
                age: this.calculateAge(member),
                isAlive: this.isPersonAlive(member),
                hasChildren: member.families?.some(f => f.children?.length > 0) || false,
                hasSpouse: member.families?.length > 0 || false,
                totalChildren: this.countTotalChildren(member),
                generationLabel: this.getGenerationLabel(member.generation)
            },
            display: {
                shortName: this.generateShortName(member.name),
                fullName: member.name,
                displayId: member.id,
                searchableText: this.generateSearchableText(member)
            }
        };
    }

    /**
     * Calculate age for a person
     */
    calculateAge(member) {
        if (!member.vitalInfo?.birth?.date) return null;
        
        const birthDate = new Date(member.vitalInfo.birth.date);
        const deathDate = member.vitalInfo?.death?.date ? new Date(member.vitalInfo.death.date) : new Date();
        
        const age = deathDate.getFullYear() - birthDate.getFullYear();
        return age > 0 ? age : null;
    }

    /**
     * Check if person is alive
     */
    isPersonAlive(member) {
        return !member.vitalInfo?.death?.date;
    }

    /**
     * Count total children for a person
     */
    countTotalChildren(member) {
        if (!member.families) return 0;
        
        return member.families.reduce((total, family) => {
            return total + (family.children?.length || 0);
        }, 0);
    }

    /**
     * Get generation label
     */
    getGenerationLabel(generation) {
        const labels = {
            1: 'ROOT',
            2: 'F',
            3: 'N', 
            4: 'BN',
            5: 'TN',
            6: 'QN',
            7: 'PN'
        };
        return labels[generation] || `G${generation}`;
    }

    /**
     * Generate short name
     */
    generateShortName(fullName) {
        const parts = fullName.split(' ');
        if (parts.length <= 2) return fullName;
        
        return `${parts[0]} ${parts[parts.length - 1]}`;
    }

    /**
     * Generate searchable text
     */
    generateSearchableText(member) {
        const texts = [
            member.name,
            member.vitalInfo?.birth?.location,
            member.vitalInfo?.death?.location,
            ...member.families?.map(f => f.spouse?.name).filter(Boolean) || []
        ];
        
        return texts.join(' ').toLowerCase();
    }

    /**
     * Calculate average children per family
     */
    calculateAverageChildren(members) {
        const familiesWithChildren = members.filter(m => 
            m.families?.some(f => f.children?.length > 0)
        );
        
        if (familiesWithChildren.length === 0) return 0;
        
        const totalChildren = familiesWithChildren.reduce((total, member) => {
            return total + this.countTotalChildren(member);
        }, 0);
        
        return Math.round((totalChildren / familiesWithChildren.length) * 100) / 100;
    }

    /**
     * Build default indexes if not present
     */
    buildDefaultIndexes(members) {
        const indexes = {
            byName: new Map(),
            byGeneration: new Map(),
            byLocation: new Map(),
            byDateRange: new Map()
        };

        members.forEach(member => {
            // Name index
            indexes.byName.set(member.name.toLowerCase(), member.id);
            
            // Generation index
            if (!indexes.byGeneration.has(member.generation)) {
                indexes.byGeneration.set(member.generation, []);
            }
            indexes.byGeneration.get(member.generation).push(member.id);
            
            // Location index
            if (member.vitalInfo?.birth?.location) {
                const location = member.vitalInfo.birth.location.toLowerCase();
                if (!indexes.byLocation.has(location)) {
                    indexes.byLocation.set(location, []);
                }
                indexes.byLocation.get(location).push(member.id);
            }
        });

        return indexes;
    }

    /**
     * Generate comprehensive statistics
     */
    generateStatistics(members) {
        const stats = {
            totalMembers: members.length,
            generations: Math.max(...members.map(m => m.generation)),
            genderDistribution: {
                male: members.filter(m => m.gender === 'male').length,
                female: members.filter(m => m.gender === 'female').length
            },
            locationStats: this.generateLocationStats(members),
            dateStats: this.generateDateStats(members),
            familyStats: this.generateFamilyStats(members)
        };

        return stats;
    }

    /**
     * Generate location statistics
     */
    generateLocationStats(members) {
        const locations = new Map();
        
        members.forEach(member => {
            const location = member.vitalInfo?.birth?.location;
            if (location) {
                locations.set(location, (locations.get(location) || 0) + 1);
            }
        });

        return Array.from(locations.entries())
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Generate date statistics
     */
    generateDateStats(members) {
        const birthYears = members
            .map(m => m.vitalInfo?.birth?.date)
            .filter(date => date)
            .map(date => new Date(date).getFullYear());

        return {
            earliestBirth: Math.min(...birthYears),
            latestBirth: Math.max(...birthYears),
            averageBirthYear: Math.round(birthYears.reduce((a, b) => a + b, 0) / birthYears.length)
        };
    }

    /**
     * Generate family statistics
     */
    generateFamilyStats(members) {
        const families = members.filter(m => m.families?.length > 0);
        const totalFamilies = families.reduce((total, m) => total + m.families.length, 0);
        const totalChildren = families.reduce((total, m) => total + this.countTotalChildren(m), 0);

        return {
            membersWithFamilies: families.length,
            totalFamilies: totalFamilies,
            totalChildren: totalChildren,
            averageChildrenPerFamily: totalFamilies > 0 ? Math.round((totalChildren / totalFamilies) * 100) / 100 : 0
        };
    }

    /**
     * Save JSON file
     */
    async saveJSONFile(data) {
        try {
            console.log('💾 Saving enhanced JSON file...');
            
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'family-data-v2.json';
            downloadLink.click();
            
            console.log('✅ JSON file saved successfully');
            
        } catch (error) {
            console.error('❌ Failed to save JSON file:', error);
            throw error;
        }
    }

    /**
     * Generate comprehensive migration report
     */
    generateMigrationReport(data, validationResults) {
        const summary = this.validator.getValidationSummary();
        
        return {
            migration: {
                success: this.migrationResults.success,
                duration: this.migrationResults.duration,
                startTime: this.migrationResults.startTime,
                endTime: this.migrationResults.endTime
            },
            data: {
                totalMembers: data.metadata.totalMembers,
                generations: data.metadata.generations,
                completeness: summary.completenessPercentage,
                errors: summary.errorCount,
                warnings: summary.warningCount
            },
            performance: data.metadata.performance,
            statistics: data.statistics,
            recommendations: this.validator.generateRecommendations()
        };
    }

    /**
     * Get migration status
     */
    getMigrationStatus() {
        return {
            success: this.migrationResults.success,
            duration: this.migrationResults.duration,
            errors: this.migrationResults.errors,
            warnings: this.migrationResults.warnings
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenealogyMigrationScript;
}
