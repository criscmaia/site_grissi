/**
 * Final Family Data Renderer - Dynamic Genealogy Display
 * Renders family members from genealogy.json with beautiful card-based layout
 */

class FinalFamilyRenderer {
    constructor() {
        this.familyData = null;
        this.container = null;
        this.loadingElement = null;
    }

    /**
     * Initialize the family renderer
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Final Family Renderer');
            
            // Get the container
            this.container = document.querySelector('.family-members');
            if (!this.container) {
                throw new Error('Family members container not found');
            }

            // Create loading element
            this.createLoadingElement();
            
            // Load family data from genealogy.json
            await this.loadFamilyData();
            
            // Render all family members
            this.renderFamilyMembers();
            
            // Update results counter
            this.updateResultsCounter();

            // Notify listeners that data is ready
            try {
                const members = Array.isArray(this.familyData?.familyMembers) ? this.familyData.familyMembers : [];
                window.dispatchEvent(new CustomEvent('familyDataLoaded', { detail: members }));
            } catch (e) {
                console.warn('Could not dispatch familyDataLoaded event:', e);
            }
            
            console.log('✅ Final Family Renderer initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Final Family Renderer:', error);
            this.showError('Erro ao carregar dados da família');
        }
    }

    /**
     * Create loading element
     */
    createLoadingElement() {
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'loading-container';
        this.loadingElement.innerHTML = `
            <div class="loading-spinner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                    </circle>
                </svg>
                <p>Carregando dados da família...</p>
            </div>
        `;
        this.container.appendChild(this.loadingElement);
    }

    /**
     * Load family data from genealogy.json file
     */
    async loadFamilyData() {
        try {
            const response = await fetch('genealogy.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawData = await response.json();
            console.log(`📊 Loaded ${rawData.familyMembers.length} family members from genealogy.json`);
            
            // Use the data directly from genealogy.json
            this.familyData = rawData;
            console.log(`📊 Using ${this.familyData.familyMembers.length} family members from final JSON`);
        } catch (error) {
            console.error('❌ Failed to load family data:', error);
            throw error;
        }
    }

    /**
     * Render all family members
     */
    renderFamilyMembers() {
        // Remove loading element
        if (this.loadingElement) {
            this.loadingElement.remove();
        }

        // Clear container
        this.container.innerHTML = '';

        // Render each family member
        this.familyData.familyMembers.forEach(member => {
            const memberCard = this.createMemberCard(member);
            this.container.appendChild(memberCard);
        });
    }

    /**
     * Create a member card
     */
    createMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'person-card';
        card.setAttribute('data-id', member.id);
        card.setAttribute('data-generation', member.generation);

        card.innerHTML = `
            <div class="card-header">
                <div class="profile-icon ${member.gender || 'unknown'}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="person-info">
                    <h3 class="person-name">${member.name}</h3>
                    <div class="person-id">${member.id}</div>
                    ${member.gender ? `<span class="gender-tag ${member.gender}">${member.gender === 'male' ? 'Masculino' : 'Feminino'}</span>` : ''}
                </div>
            </div>
            <div class="card-content">
                ${this.createDetailsSection(member)}
                ${this.createParentsSection(member)}
                ${this.createFamiliesSection(member)}
                ${this.createObservationsSection(member)}
            </div>
        `;

        return card;
    }

    /**
     * Create details section
     */
    createDetailsSection(member) {
        const details = [];
        
        if (member.birthDate || member.birthLocation) {
            details.push(`
                <div class="info-row">
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                    </svg>
                    <span><strong>Nascimento:</strong> ${member.birthDate || 'Não informado'}${member.birthLocation ? ` em ${member.birthLocation}` : ''}</span>
                </div>
            `);
        }
        
        if (member.deathDate || member.deathLocation) {
            details.push(`
                <div class="info-row">
                    <svg class="info-icon death" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span><strong>Falecimento:</strong> ${member.deathDate || 'Não informado'}${member.deathLocation ? ` em ${member.deathLocation}` : ''}</span>
                </div>
            `);
        }

        if (details.length === 0) {
            return '';
        }

        return `
            <div class="details-section">
                <div class="info-section">
                    <h4 class="section-header">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Informações Pessoais
                    </h4>
                    <div class="section-content">
                        ${details.join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create parents section
     */
    createParentsSection(member) {
        if (!member.parents || (!member.parents.father && !member.parents.mother)) {
            return '';
        }

        const parents = [];
        if (member.parents.father) {
            parents.push(`<strong>Pai:</strong> ${member.parents.father}`);
        }
        if (member.parents.mother) {
            parents.push(`<strong>Mãe:</strong> ${member.parents.mother}`);
        }

        return `
            <div class="details-section">
                <div class="info-section">
                    <h4 class="section-header">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Pais
                    </h4>
                    <div class="section-content">
                        <div class="info-row">
                            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            </svg>
                            <span>${parents.join(' | ')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create families section
     */
    createFamiliesSection(member) {
        if (!member.unions || member.unions.length === 0) {
            return '';
        }

        const families = member.unions.map((family, index) => this.createFamilyUnit(family, index + 1));
        
        return `
            <div class="details-section">
                <div class="info-section">
                    <h4 class="section-header">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Família
                    </h4>
                    <div class="section-content">
                        ${families.join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create family unit
     */
    createFamilyUnit(family, unionNumber) {
        const spouseInfo = this.createSpouseDetails(family.partner);
        const childrenInfo = this.createChildrenSection(family.children);
        const unionDates = this.formatUnionDates(family);

        return `
            <div class="family-unit">
                <div class="union-header">
                    <span class="union-number">União ${unionNumber}</span>
                    ${unionDates ? `<span class="union-dates">${unionDates}</span>` : ''}
                </div>
                ${spouseInfo}
                ${childrenInfo}
            </div>
        `;
    }

    /**
     * Format union dates
     */
    formatUnionDates(family) {
        const dates = [];
        if (family.partner.marriageDate) {
            dates.push(`Casamento: ${family.partner.marriageDate}`);
        }
        return dates.join(' | ');
    }

    /**
     * Create spouse details
     */
    createSpouseDetails(spouse) {
        if (!spouse) return '';

        const details = [];
        
        if (spouse.name) {
            details.push(`<strong>${spouse.name}</strong>`);
        }
        
        if (spouse.birthDate || spouse.birthLocation) {
            const birthInfo = [];
            if (spouse.birthDate) birthInfo.push(spouse.birthDate);
            if (spouse.birthLocation) birthInfo.push(spouse.birthLocation);
            details.push(`Nascimento: ${birthInfo.join(' em ')}`);
        }
        
        if (spouse.deathDate || spouse.deathLocation) {
            const deathInfo = [];
            if (spouse.deathDate) deathInfo.push(spouse.deathDate);
            if (spouse.deathLocation) deathInfo.push(spouse.deathLocation);
            details.push(`Falecimento: ${deathInfo.join(' em ')}`);
        }

        if (spouse.parents && (spouse.parents.father || spouse.parents.mother)) {
            const parents = [];
            if (spouse.parents.father) parents.push(`Pai: ${spouse.parents.father}`);
            if (spouse.parents.mother) parents.push(`Mãe: ${spouse.parents.mother}`);
            details.push(`Pais: ${parents.join(' | ')}`);
        }

        return `
            <div class="spouse-info">
                <div class="spouse-name">${details[0] || 'Cônjuge'}</div>
                ${details.length > 1 ? `<div class="spouse-details">${details.slice(1).join(' | ')}</div>` : ''}
            </div>
        `;
    }

    /**
     * Create children section
     */
    createChildrenSection(children) {
        if (!children || children.length === 0) {
            return '';
        }

        const childrenList = children.map(child => 
            `<span class="child-tag" data-id="${child.id}">${child.name}</span>`
        ).join('');

        return `
            <div class="children-section">
                <div class="children-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Filhos (${children.length})
                </div>
                <div class="children-list">
                    ${childrenList}
                </div>
            </div>
        `;
    }

    /**
     * Create observations section
     */
    createObservationsSection(member) {
        if (!member.observations) {
            return '';
        }

        return `
            <div class="details-section">
                <div class="info-section">
                    <h4 class="section-header">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                        </svg>
                        Observações
                    </h4>
                    <div class="section-content">
                        <div class="info-row">
                            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10,9 9,9 8,9"></polyline>
                            </svg>
                            <span>${member.observations}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update results counter
     */
    updateResultsCounter() {
        const counter = document.querySelector('.results-counter span');
        if (counter) {
            const totalMembers = this.familyData.familyMembers.length;
            const generations = this.familyData.metadata.generations;
            counter.textContent = `${totalMembers} membros da família encontrados (${generations} gerações)`;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.loadingElement) {
            this.loadingElement.remove();
        }

        this.container.innerHTML = `
            <div class="error-container">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p>${message}</p>
                <button onclick="location.reload()">Tentar novamente</button>
            </div>
        `;
    }
}

// Make the class available globally
window.FinalFamilyRenderer = FinalFamilyRenderer;
