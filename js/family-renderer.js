/**
 * Family Data Renderer - Dynamic Genealogy Display
 * Renders family members from JSON data with beautiful card-based layout
 */

class FamilyRenderer {
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
            console.log('🚀 Initializing Family Renderer');
            
            // Get the container
            this.container = document.querySelector('.family-members');
            if (!this.container) {
                throw new Error('Family members container not found');
            }

            // Create loading element
            this.createLoadingElement();
            
            // Load family data
            await this.loadFamilyData();
            
            // Render all family members
            this.renderFamilyMembers();
            
            // Update results counter
            this.updateResultsCounter();
            
            console.log('✅ Family Renderer initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Family Renderer:', error);
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
     * Load family data from JSON file
     */
    async loadFamilyData() {
        try {
            const response = await fetch('family-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.familyData = await response.json();
            console.log(`📊 Loaded ${this.familyData.familyMembers.length} family members`);
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
     * Create a member card element
     */
    createMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'person-card';
        card.setAttribute('data-generation', member.generation);
        card.setAttribute('data-id', member.id);

        card.innerHTML = `
            <div class="card-header">
                <div class="profile-icon ${member.gender}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="person-info">
                    <h3 class="person-name">${member.name}</h3>
                    <div class="person-id">ID: ${member.id} • ${member.generation}ª Geração</div>
                </div>
                <div class="gender-tag ${member.gender}">${member.gender === 'male' ? 'Masculino' : 'Feminino'}</div>
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
     * Create details section (birth/death info)
     */
    createDetailsSection(member) {
        const hasDeathInfo = member.death && member.death.date && member.death.date !== 'Data não registrada';
        
        return `
            <div class="details-section">
                <div class="details-column">
                    <div class="info-row">
                        <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Nascimento: ${member.birth.date}</span>
                    </div>
                    
                    <div class="info-row">
                        <svg class="info-icon location" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>Local de nascimento: ${member.birth.location}</span>
                    </div>
                </div>
                
                <div class="details-column">
                    ${hasDeathInfo ? `
                        <div class="info-row">
                            <svg class="info-icon death" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>Falecimento: ${member.death.date}${member.death.age && member.death.age !== 'Data não registrada' ? ` (${member.death.age} anos)` : ''}</span>
                        </div>
                        ${member.death.location && member.death.location !== 'Data não registrada' ? `
                            <div class="info-row">
                                <svg class="info-icon location" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>Local de falecimento: ${member.death.location}</span>
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create parents section
     */
    createParentsSection(member) {
        return `
            <div class="info-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="m22 21-2-2"></path>
                        <path d="M16 16.28A13.84 13.84 0 0 1 22 18"></path>
                    </svg>
                    <span>Pais</span>
                </div>
                <div class="section-content">
                    <div>Pai: ${member.parents.father}</div>
                    <div>Mãe: ${member.parents.mother}</div>
                </div>
            </div>
        `;
    }

    /**
     * Create families section with unions
     */
    createFamiliesSection(member) {
        if (!member.families || member.families.length === 0) {
            return `
                <div class="info-section">
                    <div class="section-header">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>Famílias</span>
                    </div>
                    <div class="section-content">
                        <div>Nenhuma união registrada</div>
                    </div>
                </div>
            `;
        }

        const familiesHtml = member.families.map(family => this.createFamilyUnit(family)).join('');

        return `
            <div class="info-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>Famílias</span>
                </div>
                ${familiesHtml}
            </div>
        `;
    }

    /**
     * Create a family unit (union)
     */
    createFamilyUnit(family) {
        const unionDates = this.formatUnionDates(family);
        const spouseDetails = this.createSpouseDetails(family.spouse);
        const childrenSection = this.createChildrenSection(family.children);

        return `
            <div class="family-unit">
                <div class="union-header">
                    <span class="union-number">${family.unionNumber === 1 ? 'União' : `${family.unionNumber}ª União`}</span>
                    <span class="union-dates">${unionDates}</span>
                </div>
                <div class="spouse-info">
                    <div class="spouse-name">💑 ${family.spouse.name}</div>
                    <div class="spouse-details">
                        ${spouseDetails}
                    </div>
                </div>
                ${childrenSection}
            </div>
        `;
    }

    /**
     * Format union dates
     */
    formatUnionDates(family) {
        const marriageDate = family.marriageDate || 'Data não registrada';
        const endDate = family.endDate || 'Data não registrada';
        
        if (marriageDate === 'Data não registrada' && endDate === 'Data não registrada') {
            return 'Data não registrada';
        }
        
        if (marriageDate === endDate) {
            return marriageDate;
        }
        
        return `${marriageDate} - ${endDate}`;
    }

    /**
     * Create spouse details
     */
    createSpouseDetails(spouse) {
        const details = [];
        
        // Birth info
        if (spouse.birth && spouse.birth.date && spouse.birth.date !== 'Data não registrada') {
            details.push(`<span>📍 Nascido${spouse.gender === 'female' ? 'a' : ''} em ${spouse.birth.date}${spouse.birth.location && spouse.birth.location !== 'Data não registrada' ? ` em ${spouse.birth.location}` : ''}</span>`);
        } else if (spouse.birth && spouse.birth.location && spouse.birth.location !== 'Data não registrada') {
            details.push(`<span>📍 Nascido${spouse.gender === 'female' ? 'a' : ''} em ${spouse.birth.location}</span>`);
        }
        
        // Parents info
        if (spouse.parents && spouse.parents.father && spouse.parents.father !== 'Data não registrada') {
            details.push(`<span>👥 Filho${spouse.gender === 'female' ? 'a' : ''} de ${spouse.parents.father}${spouse.parents.mother && spouse.parents.mother !== 'Data não registrada' ? ` e ${spouse.parents.mother}` : ''}</span>`);
        }
        
        // Death info
        if (spouse.death && spouse.death.date && spouse.death.date !== 'Data não registrada') {
            const deathInfo = `💀 Falecido${spouse.gender === 'female' ? 'a' : ''} em ${spouse.death.date}`;
            const ageInfo = spouse.death.age && spouse.death.age !== 'Data não registrada' ? ` (${spouse.death.age} anos)` : '';
            const locationInfo = spouse.death.location && spouse.death.location !== 'Data não registrada' ? ` na ${spouse.death.location}` : '';
            details.push(`<span>${deathInfo}${ageInfo}${locationInfo}</span>`);
        }
        
        // If no details available
        if (details.length === 0) {
            details.push('<span>📍 Informações não disponíveis</span>');
        }
        
        return details.join('');
    }

    /**
     * Create children section
     */
    createChildrenSection(children) {
        if (!children || children.length === 0) {
            return `
                <div class="children-section">
                    <div class="children-header">👶 Filhos: Nenhum filho registrado</div>
                </div>
            `;
        }

        const childrenList = children.map(child => {
            const birthYear = child.birthYear && child.birthYear !== 'Data não registrada' ? ` (${child.birthYear})` : '';
            return `<span class="child-tag">${child.name}${birthYear}</span>`;
        }).join('');

        return `
            <div class="children-section">
                <div class="children-header">👶 Filhos (${children.length}):</div>
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
        if (!member.observations || member.observations.length === 0) {
            return '';
        }

        const observationsHtml = member.observations.map(obs => `<div>${obs}</div>`).join('');

        return `
            <div class="info-section">
                <div class="section-header">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                    </svg>
                    <span>Observações</span>
                </div>
                <div class="section-content">
                    ${observationsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Update results counter
     */
    updateResultsCounter() {
        const counter = document.querySelector('.results-counter');
        if (counter && this.familyData) {
            const count = this.familyData.familyMembers.length;
            counter.textContent = `${count} membro${count !== 1 ? 's' : ''} da família encontrado${count !== 1 ? 's' : ''}`;
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

// Export for global use
window.FamilyRenderer = FamilyRenderer; 