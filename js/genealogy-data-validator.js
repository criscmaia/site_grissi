/**
 * Genealogy Data Validator
 * Validates extracted genealogical data for completeness and structure
 */

class GenealogyDataValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validationResults = {
            isValid: true,
            errors: [],
            warnings: [],
            statistics: {
                totalMembers: 0,
                validMembers: 0,
                missingData: 0,
                incompleteRecords: 0
            }
        };
    }

    /**
     * Validate the complete data structure
     */
    validateDataStructure(data) {
        this.resetValidation();
        
        try {
            console.log('🔍 Starting data validation...');
            
            // Validate top-level structure
            this.validateTopLevelStructure(data);
            
            // Validate metadata
            this.validateMetadata(data.metadata);
            
            // Validate each family member
            this.validateFamilyMembers(data.familyMembers);
            
            // Validate indexes if present
            if (data.indexes) {
                this.validateIndexes(data.indexes, data.familyMembers);
            }
            
            // Validate relationships
            this.validateAllRelationships(data.familyMembers);
            
            // Update validation results
            this.updateValidationResults();
            
            console.log(`✅ Validation completed: ${this.validationResults.statistics.validMembers}/${this.validationResults.statistics.totalMembers} members valid`);
            
            return this.validationResults;
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
            this.addError('Validation process failed', error.message);
            return this.validationResults;
        }
    }

    /**
     * Reset validation state
     */
    resetValidation() {
        this.errors = [];
        this.warnings = [];
        this.validationResults = {
            isValid: true,
            errors: [],
            warnings: [],
            statistics: {
                totalMembers: 0,
                validMembers: 0,
                missingData: 0,
                incompleteRecords: 0
            }
        };
    }

    /**
     * Validate top-level structure
     */
    validateTopLevelStructure(data) {
        const requiredFields = ['metadata', 'familyMembers'];
        
        requiredFields.forEach(field => {
            if (!data[field]) {
                this.addError(`Missing required top-level field: ${field}`);
            }
        });

        if (!Array.isArray(data.familyMembers)) {
            this.addError('familyMembers must be an array');
        }
    }

    /**
     * Validate metadata
     */
    validateMetadata(metadata) {
        if (!metadata) {
            this.addError('Metadata is required');
            return;
        }

        const requiredMetadataFields = ['version', 'lastUpdated', 'totalMembers', 'generations'];
        
        requiredMetadataFields.forEach(field => {
            if (!metadata[field]) {
                this.addWarning(`Missing metadata field: ${field}`);
            }
        });

        // Validate version format
        if (metadata.version && !/^\d+\.\d+$/.test(metadata.version)) {
            this.addWarning('Invalid version format, expected format: X.Y');
        }

        // Validate date format
        if (metadata.lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.lastUpdated)) {
            this.addWarning('Invalid date format in lastUpdated, expected YYYY-MM-DD');
        }
    }

    /**
     * Validate all family members
     */
    validateFamilyMembers(members) {
        if (!Array.isArray(members)) {
            this.addError('familyMembers must be an array');
            return;
        }

        this.validationResults.statistics.totalMembers = members.length;
        
        members.forEach((member, index) => {
            this.validateFamilyMember(member, index);
        });
    }

    /**
     * Validate a single family member
     */
    validateFamilyMember(member, index) {
        const requiredFields = ['id', 'name', 'generation', 'gender'];
        
        // Check required fields
        requiredFields.forEach(field => {
            if (!member[field]) {
                this.addError(`Member ${index} (${member.id || 'unknown'}) missing required field: ${field}`);
            }
        });

        // Validate ID format
        if (member.id && !this.isValidId(member.id)) {
            this.addError(`Member ${index} has invalid ID format: ${member.id}`);
        }

        // Validate generation
        if (member.generation && (typeof member.generation !== 'number' || member.generation < 1)) {
            this.addError(`Member ${index} (${member.id}) has invalid generation: ${member.generation}`);
        }

        // Validate gender
        if (member.gender && !['male', 'female'].includes(member.gender)) {
            this.addError(`Member ${index} (${member.id}) has invalid gender: ${member.gender}`);
        }

        // Validate vital information
        if (member.vitalInfo) {
            this.validateVitalInfo(member.vitalInfo, member.id);
        } else {
            this.addWarning(`Member ${member.id} missing vitalInfo`);
        }

        // Validate parents
        if (member.parents) {
            this.validateParents(member.parents, member.id);
        } else {
            this.addWarning(`Member ${member.id} missing parents information`);
        }

        // Validate families
        if (member.families) {
            this.validateFamilies(member.families, member.id);
        } else {
            this.addWarning(`Member ${member.id} missing families information`);
        }

        // Validate relationships
        if (member.relationships) {
            this.validateRelationships(member.relationships, member.id);
        }

        // Count valid members
        if (this.isMemberValid(member)) {
            this.validationResults.statistics.validMembers++;
        } else {
            this.validationResults.statistics.incompleteRecords++;
        }
    }

    /**
     * Validate vital information
     */
    validateVitalInfo(vitalInfo, memberId) {
        if (!vitalInfo.birth || !vitalInfo.death) {
            this.addWarning(`Member ${memberId} missing birth or death information`);
            return;
        }

        // Validate birth information
        if (vitalInfo.birth) {
            if (!vitalInfo.birth.formattedDate) {
                this.addWarning(`Member ${memberId} missing birth date`);
            }
        }

        // Validate death information
        if (vitalInfo.death) {
            if (!vitalInfo.death.formattedDate) {
                this.addWarning(`Member ${memberId} missing death date`);
            }
        }
    }

    /**
     * Validate parents information
     */
    validateParents(parents, memberId) {
        if (!parents.father && !parents.mother) {
            this.addWarning(`Member ${memberId} has no parent information`);
        }
    }

    /**
     * Validate families information
     */
    validateFamilies(families, memberId) {
        if (!Array.isArray(families)) {
            this.addError(`Member ${memberId} families must be an array`);
            return;
        }

        families.forEach((family, index) => {
            this.validateFamily(family, memberId, index);
        });
    }

    /**
     * Validate a single family
     */
    validateFamily(family, memberId, familyIndex) {
        const requiredFamilyFields = ['unionNumber', 'spouse', 'children'];
        
        requiredFamilyFields.forEach(field => {
            if (!family[field]) {
                this.addError(`Member ${memberId} family ${familyIndex} missing required field: ${field}`);
            }
        });

        // Validate spouse
        if (family.spouse) {
            this.validateSpouse(family.spouse, memberId, familyIndex);
        }

        // Validate children
        if (family.children && Array.isArray(family.children)) {
            family.children.forEach((child, childIndex) => {
                this.validateChild(child, memberId, familyIndex, childIndex);
            });
        }
    }

    /**
     * Validate spouse information
     */
    validateSpouse(spouse, memberId, familyIndex) {
        if (!spouse.name) {
            this.addWarning(`Member ${memberId} family ${familyIndex} spouse missing name`);
        }

        if (spouse.vitalInfo) {
            this.validateVitalInfo(spouse.vitalInfo, `${memberId}-spouse-${familyIndex}`);
        }
    }

    /**
     * Validate child information
     */
    validateChild(child, memberId, familyIndex, childIndex) {
        if (!child.id) {
            this.addError(`Member ${memberId} family ${familyIndex} child ${childIndex} missing ID`);
        }

        if (!child.name) {
            this.addError(`Member ${memberId} family ${familyIndex} child ${childIndex} missing name`);
        }

        if (child.id && !this.isValidId(child.id)) {
            this.addError(`Member ${memberId} family ${familyIndex} child ${childIndex} has invalid ID: ${child.id}`);
        }
    }

    /**
     * Validate relationships
     */
    validateRelationships(relationships, memberId) {
        if (!relationships.siblings || !relationships.ancestors) {
            this.addWarning(`Member ${memberId} missing complete relationship information`);
        }
    }

    /**
     * Validate indexes
     */
    validateIndexes(indexes, members) {
        // Validate name index
        if (indexes.byName) {
            const nameIndexSize = indexes.byName.size;
            const expectedSize = members.length;
            
            if (nameIndexSize !== expectedSize) {
                this.addWarning(`Name index size mismatch: expected ${expectedSize}, got ${nameIndexSize}`);
            }
        }

        // Validate generation index
        if (indexes.byGeneration) {
            const generationIndexSize = indexes.byGeneration.size;
            const expectedGenerations = Math.max(...members.map(m => m.generation));
            
            if (generationIndexSize !== expectedGenerations) {
                this.addWarning(`Generation index size mismatch: expected ${expectedGenerations}, got ${generationIndexSize}`);
            }
        }
    }

    /**
     * Validate relationships between family members
     */
    validateAllRelationships(members) {
        const memberIds = new Set(members.map(m => m.id));
        
        members.forEach(member => {
            // Validate that referenced IDs exist
            if (member.relationships) {
                member.relationships.siblings?.forEach(siblingId => {
                    if (!memberIds.has(siblingId)) {
                        this.addWarning(`Member ${member.id} references non-existent sibling: ${siblingId}`);
                    }
                });

                member.relationships.ancestors?.forEach(ancestorId => {
                    if (!memberIds.has(ancestorId)) {
                        this.addWarning(`Member ${member.id} references non-existent ancestor: ${ancestorId}`);
                    }
                });


            }
        });
    }

    /**
     * Check if ID format is valid
     */
    isValidId(id) {
        if (!id || typeof id !== 'string') return false;
        
        // Validate hierarchical ID format (e.g., "1.1", "1.1.2.3")
        return /^\d+(\.\d+)*$/.test(id);
    }

    /**
     * Check if a member is valid
     */
    isMemberValid(member) {
        const requiredFields = ['id', 'name', 'generation', 'gender'];
        const hasRequiredFields = requiredFields.every(field => member[field]) && this.isValidId(member.id);
        
        // Also check for vital information
        const hasVitalInfo = member.vitalInfo && 
            (member.vitalInfo.birth?.formattedDate !== "Data não registrada" || 
             member.vitalInfo.death?.formattedDate !== "Data não registrada");
        
        return hasRequiredFields && hasVitalInfo;
    }

    /**
     * Add an error
     */
    addError(message, details = null) {
        const error = { message, details };
        this.errors.push(error);
        this.validationResults.errors.push(error);
        this.validationResults.isValid = false;
    }

    /**
     * Add a warning
     */
    addWarning(message, details = null) {
        const warning = { message, details };
        this.warnings.push(warning);
        this.validationResults.warnings.push(warning);
    }

    /**
     * Update validation results
     */
    updateValidationResults() {
        this.validationResults.statistics.missingData = this.warnings.length;
        
        // Calculate completeness percentage
        const totalMembers = this.validationResults.statistics.totalMembers;
        const validMembers = this.validationResults.statistics.validMembers;
        
        if (totalMembers > 0) {
            const completenessPercentage = (validMembers / totalMembers) * 100;
            this.validationResults.statistics.completenessPercentage = completenessPercentage;
        }
    }

    /**
     * Get validation summary
     */
    getValidationSummary() {
        const stats = this.validationResults.statistics;
        return {
            isValid: this.validationResults.isValid,
            totalMembers: stats.totalMembers,
            validMembers: stats.validMembers,
            errorCount: this.errors.length,
            warningCount: this.warnings.length,
            completenessPercentage: stats.completenessPercentage || 0
        };
    }

    /**
     * Generate validation report
     */
    generateValidationReport() {
        const summary = this.getValidationSummary();
        
        return {
            summary,
            errors: this.errors,
            warnings: this.warnings,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.errors.length > 0) {
            recommendations.push('Fix critical errors before proceeding with data migration');
        }
        
        if (this.warnings.length > 0) {
            recommendations.push('Review and address warnings to improve data quality');
        }
        
        if (this.validationResults.statistics.completenessPercentage < 80) {
            recommendations.push('Consider improving data completeness for better user experience');
        }
        
        return recommendations;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenealogyDataValidator;
}
