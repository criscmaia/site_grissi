/**
 * Final Implementation Validation Script
 * Tests the complete genealogy implementation
 */

const fs = require('fs');
const path = require('path');

class FinalImplementationValidator {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    logResult(testName, passed, details = '') {
        this.results.total++;
        if (passed) {
            this.results.passed++;
            console.log(`✅ ${testName}: PASSED`);
        } else {
            this.results.failed++;
            console.log(`❌ ${testName}: FAILED`);
        }
        if (details) {
            console.log(`   Details: ${details}`);
            this.results.details.push({ test: testName, passed, details });
        }
    }

    async validateFileStructure() {
        console.log('\n🔍 Testing File Structure...');
        
        const requiredFiles = [
            'arvore-genealogica-final.html',
            'js/final-family-renderer.js',
            'genealogy.json',
            'arvore.css',
            'index.css'
        ];

        for (const file of requiredFiles) {
            const exists = fs.existsSync(file);
            this.logResult(`File exists: ${file}`, exists, exists ? 'Found' : 'Missing');
        }
    }

    async validateGenealogyJson() {
        console.log('\n📊 Testing Genealogy JSON...');
        
        try {
            const jsonContent = fs.readFileSync('genealogy.json', 'utf8');
            const data = JSON.parse(jsonContent);
            
            // Test metadata
            const hasMetadata = data.metadata && data.metadata.totalMembers && data.metadata.generations;
            this.logResult('Has metadata', hasMetadata, hasMetadata ? `Members: ${data.metadata.totalMembers}, Generations: ${data.metadata.generations}` : 'Missing metadata');
            
            // Test family members
            const hasFamilyMembers = data.familyMembers && Array.isArray(data.familyMembers);
            this.logResult('Has family members array', hasFamilyMembers, hasFamilyMembers ? `Count: ${data.familyMembers.length}` : 'Missing family members');
            
            // Test specific counts
            if (hasFamilyMembers) {
                const correctCount = data.familyMembers.length === 440;
                this.logResult('Correct member count (440)', correctCount, `Found: ${data.familyMembers.length}`);
                
                const correctGenerations = data.metadata.generations === 7;
                this.logResult('Correct generations (7)', correctGenerations, `Found: ${data.metadata.generations}`);
            }
            
            // Test data structure
            if (hasFamilyMembers && data.familyMembers.length > 0) {
                const firstMember = data.familyMembers[0];
                const hasRequiredFields = firstMember.id && firstMember.name && firstMember.generation;
                this.logResult('First member has required fields', hasRequiredFields, hasRequiredFields ? `ID: ${firstMember.id}, Name: ${firstMember.name}` : 'Missing required fields');
            }
            
        } catch (error) {
            this.logResult('JSON parsing', false, `Error: ${error.message}`);
        }
    }

    async validateHtmlStructure() {
        console.log('\n🎨 Testing HTML Structure...');
        
        try {
            const htmlContent = fs.readFileSync('arvore-genealogica-final.html', 'utf8');
            
            // Test required elements
            const hasDoctype = htmlContent.includes('<!DOCTYPE html>');
            this.logResult('Has DOCTYPE', hasDoctype);
            
            const hasMetaCharset = htmlContent.includes('<meta charset="utf-8">');
            this.logResult('Has meta charset', hasMetaCharset);
            
            const hasTitle = htmlContent.includes('Árvore Genealógica - Família Grizzo');
            this.logResult('Has correct title', hasTitle);
            
            const hasHeader = htmlContent.includes('sticky top-0 z-50 w-full border-b');
            this.logResult('Has header navigation', hasHeader);
            
            const hasSearchSection = htmlContent.includes('search-filter-section');
            this.logResult('Has search section', hasSearchSection);
            
            const hasFamilyMembers = htmlContent.includes('family-members');
            this.logResult('Has family members container', hasFamilyMembers);
            
            const hasFooter = htmlContent.includes('Cristiano Maia');
            this.logResult('Has footer', hasFooter);
            
            const hasFinalRenderer = htmlContent.includes('final-family-renderer.js');
            this.logResult('Has final family renderer script', hasFinalRenderer);
            
            const hasCssLinks = htmlContent.includes('arvore.css') && htmlContent.includes('index.css');
            this.logResult('Has CSS links', hasCssLinks);
            
        } catch (error) {
            this.logResult('HTML file reading', false, `Error: ${error.message}`);
        }
    }

    async validateJavaScriptRenderer() {
        console.log('\n🚀 Testing JavaScript Renderer...');
        
        try {
            const jsContent = fs.readFileSync('js/final-family-renderer.js', 'utf8');
            
            // Test class structure
            const hasClass = jsContent.includes('class FinalFamilyRenderer');
            this.logResult('Has FinalFamilyRenderer class', hasClass);
            
            const hasConstructor = jsContent.includes('constructor()');
            this.logResult('Has constructor', hasConstructor);
            
            const hasInitialize = jsContent.includes('async initialize()');
            this.logResult('Has initialize method', hasInitialize);
            
            const hasLoadData = jsContent.includes('loadFamilyData()');
            this.logResult('Has loadFamilyData method', hasLoadData);
            
            const hasRenderMembers = jsContent.includes('renderFamilyMembers()');
            this.logResult('Has renderFamilyMembers method', hasRenderMembers);
            
            const hasGenealogyJson = jsContent.includes('genealogy.json');
            this.logResult('References genealogy.json', hasGenealogyJson);
            
            const hasGlobalExport = jsContent.includes('window.FinalFamilyRenderer');
            this.logResult('Exports to global scope', hasGlobalExport);
            
        } catch (error) {
            this.logResult('JavaScript file reading', false, `Error: ${error.message}`);
        }
    }

    async validateCssStyling() {
        console.log('\n🎨 Testing CSS Styling...');
        
        try {
            const cssContent = fs.readFileSync('arvore.css', 'utf8');
            
            // Test required CSS classes
            const hasGenealogyContainer = cssContent.includes('.genealogy-container');
            this.logResult('Has genealogy container styles', hasGenealogyContainer);
            
            const hasPersonCard = cssContent.includes('.person-card');
            this.logResult('Has person card styles', hasPersonCard);
            
            const hasSearchSection = cssContent.includes('.search-filter-section');
            this.logResult('Has search section styles', hasSearchSection);
            
            const hasFamilyMembers = cssContent.includes('.family-members');
            this.logResult('Has family members styles', hasFamilyMembers);
            
            const hasLoadingSpinner = cssContent.includes('.loading-spinner');
            this.logResult('Has loading spinner styles', hasLoadingSpinner);
            
        } catch (error) {
            this.logResult('CSS file reading', false, `Error: ${error.message}`);
        }
    }

    async validateDataContent() {
        console.log('\n📋 Testing Data Content...');
        
        try {
            const jsonContent = fs.readFileSync('genealogy.json', 'utf8');
            const data = JSON.parse(jsonContent);
            
            if (data.familyMembers && data.familyMembers.length > 0) {
                // Test first member structure
                const firstMember = data.familyMembers[0];
                
                const hasId = firstMember.id;
                this.logResult('First member has ID', hasId, hasId ? `ID: ${firstMember.id}` : 'Missing ID');
                
                const hasName = firstMember.name;
                this.logResult('First member has name', hasName, hasName ? `Name: ${firstMember.name}` : 'Missing name');
                
                const hasGeneration = firstMember.generation;
                this.logResult('First member has generation', hasGeneration, hasGeneration ? `Generation: ${firstMember.generation}` : 'Missing generation');
                
                const hasGender = firstMember.gender !== undefined;
                this.logResult('First member has gender field', hasGender, hasGender ? `Gender: ${firstMember.gender}` : 'Missing gender');
                
                const hasParents = firstMember.parents;
                this.logResult('First member has parents', hasParents, hasParents ? `Parents: ${JSON.stringify(firstMember.parents)}` : 'Missing parents');
                
                const hasUnions = firstMember.unions;
                this.logResult('First member has unions', hasUnions, hasUnions ? `Unions: ${firstMember.unions.length}` : 'Missing unions');
            }
            
        } catch (error) {
            this.logResult('Data content validation', false, `Error: ${error.message}`);
        }
    }

    async runAllTests() {
        console.log('🧪 Starting Final Implementation Validation...\n');
        
        await this.validateFileStructure();
        await this.validateGenealogyJson();
        await this.validateHtmlStructure();
        await this.validateJavaScriptRenderer();
        await this.validateCssStyling();
        await this.validateDataContent();
        
        this.printSummary();
    }

    printSummary() {
        console.log('\n📊 VALIDATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Implementation is ready.');
        } else {
            console.log('\n❌ Some tests failed. Please review the details above.');
        }
        
        console.log('\n📋 DETAILED RESULTS:');
        this.results.details.forEach(detail => {
            const status = detail.passed ? '✅' : '❌';
            console.log(`${status} ${detail.test}: ${detail.details}`);
        });
    }
}

// Run validation
const validator = new FinalImplementationValidator();
validator.runAllTests().catch(console.error);
