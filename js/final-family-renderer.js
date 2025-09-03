/**
 * Final Family Data Renderer - Dynamic Genealogy Display
 * Renders family members from genealogy.json with beautiful card-based layout
 */

class FinalFamilyRenderer {
    constructor() {
        this.familyData = null;
        this.container = null;
        this.loadingElement = null;
        this.nameToIds = new Map();
    }

    /**
     * Get the appropriate display name for a person
     * Children in unions always show their birth name (name)
     * All other contexts show legal name if available, otherwise birth name
     */
    getDisplayName(person, context = 'default') {
        if (!person) return '';
        
        // Children contexts always show birth name
        if (context === 'children') {
            return person.name || '';
        }
        
        // All other contexts show legal name with fallback to birth name
        return person.legalName || person.name;
    }

    /**
     * Initialize the family renderer
     */
    async initialize() {
        try {
            // console.log('🚀 Initializing Final Family Renderer');
            
            // Get the container
            this.container = document.querySelector('.family-members');
            if (!this.container) {
                throw new Error('Family members container not found');
            }

            // Create loading element
            this.createLoadingElement();
            
            // Load family data from genealogy.json
            await this.loadFamilyData();

            // Build name index for quick lookup (exact name → ids)
            this.buildNameIndex();
            
            // Initialize photo matcher
            await this.initializePhotoMatcher();
            
            // Render all family members
            this.renderFamilyMembers();
            
            // Update results counter
            this.updateResultsCounter();

            // Bind interactions (click/keyboard) for parent/child navigation
            this.bindInteractions();

            // Notify listeners that data is ready
            try {
                const members = Array.isArray(this.familyData?.familyMembers) ? this.familyData.familyMembers : [];
                window.dispatchEvent(new CustomEvent('familyDataLoaded', { detail: members }));
            } catch (e) {
                console.warn('Could not dispatch familyDataLoaded event:', e);
            }
            
            // console.log('✅ Final Family Renderer initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Final Family Renderer:', error);
            this.showError('Erro ao carregar dados da família');
        }
    }

    /**
     * Initialize photo matcher for profile pictures
     */
    async initializePhotoMatcher() {
        if (window.PhotoMatcher) {
            this.photoMatcher = new PhotoMatcher();
            await this.photoMatcher.init();
            
            // Get photo statistics for family members
            const stats = await this.photoMatcher.getPhotoStats(this.familyData.familyMembers);
            console.log(`📸 Photo coverage: ${stats.membersWithPhotos}/${stats.totalMembers} (${stats.coveragePercentage}%)`);
            
            // Store photo results for use during rendering
            this.photoResults = stats.photoResults;
            
            // Collect all spouses/partners from unions
            const spouses = [];
            this.familyData.familyMembers.forEach(member => {
                if (member.unions && member.unions.length > 0) {
                    member.unions.forEach(union => {
                        if (union.partner && union.partner.name) {
                            // Create a pseudo-member object for the spouse to work with PhotoMatcher
                            spouses.push({
                                name: union.partner.name,
                                legalName: union.partner.legalName,
                                id: `spouse_${union.partner.name}` // Create unique ID for spouse
                            });
                        }
                    });
                }
            });
            
            // Get photos for spouses
            if (spouses.length > 0) {
                const spouseStats = await this.photoMatcher.getPhotoStats(spouses);
                console.log(`📸 Spouse photo coverage: ${spouseStats.membersWithPhotos}/${spouseStats.totalMembers} (${spouseStats.coveragePercentage}%)`);
                
                // Store spouse photo results separately
                this.spousePhotoResults = spouseStats.photoResults;
            } else {
                this.spousePhotoResults = [];
            }
        } else {
            console.warn('⚠️ PhotoMatcher not available');
            this.photoMatcher = null;
            this.photoResults = [];
            this.spousePhotoResults = [];
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
            // console.log(`📊 Using ${this.familyData.familyMembers.length} family members from final JSON`);
        } catch (error) {
            console.error('❌ Failed to load family data:', error);
            throw error;
        }
    }

    /**
     * Build a map of exact names to member IDs
     */
    buildNameIndex() {
        try {
            const members = Array.isArray(this.familyData?.familyMembers) ? this.familyData.familyMembers : [];
            members.forEach(m => {
                const key = (m.name || '').trim();
                if (!key) return;
                if (!this.nameToIds.has(key)) {
                    this.nameToIds.set(key, []);
                }
                this.nameToIds.get(key).push(m.id);
            });
        } catch (e) {
            console.warn('Could not build name index:', e);
        }
    }

    /**
     * Resolve a unique member id by exact name
     */
    resolveIdByExactName(name) {
        const ids = this.nameToIds.get((name || '').trim());
        if (Array.isArray(ids) && ids.length === 1) return ids[0];
        return null;
    }

    /**
     * Find person data by birth name, searching both family members and spouse/partner records
     * Returns an object with name and legalName if found, null otherwise
     */
    findPersonByBirthName(birthName) {
        if (!birthName) return null;
        
        // First try to find as a family member
        const member = this.familyData.familyMembers.find(m => m.name === birthName);
        if (member) {
            return { name: member.name, legalName: member.legalName };
        }
        
        // If not found as member, search through all partner/spouse records
        for (const member of this.familyData.familyMembers) {
            if (member.unions) {
                for (const union of member.unions) {
                    if (union.partner && union.partner.name === birthName) {
                        return { name: union.partner.name, legalName: union.partner.legalName };
                    }
                }
            }
        }
        
        return null;
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

        // Check if member has a photo
        const photoResult = this.photoResults?.find(r => r.member.id === member.id);
        const hasPhoto = photoResult?.hasPhoto;
        const photoUrl = photoResult?.photoUrl;

        card.innerHTML = `
            <div class="card-header">
                <div class="profile-icon ${member.gender || 'unknown'}">
                    ${hasPhoto ? 
                        `<img src="${photoUrl}" alt="${this.getDisplayName(member)}" class="profile-photo" loading="lazy" decoding="async" />` :
                        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>`
                    }
                </div>
                <div class="person-info">
                    <h3 class="person-name">${this.getDisplayName(member)}</h3>
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

        // Add hover handlers for profile photos
        if (hasPhoto && window.PhotoPopup) {
            const profileIcon = card.querySelector('.profile-icon');
            const profilePhoto = card.querySelector('.profile-photo');
            if (profilePhoto) {
                window.photoPopup.createHoverHandlers(profilePhoto, photoUrl, this.getDisplayName(member));
            }
        }

        // Add hover handlers for spouse photos
        if (window.PhotoPopup && member.unions) {
            member.unions.forEach((union, unionIndex) => {
                if (union.partner && union.partner.name) {
                    const spousePhotoResult = this.spousePhotoResults?.find(r => r.member.name === union.partner.name);
                    if (spousePhotoResult?.hasPhoto) {
                        // Find all spouse photos and get the one for this union
                        const spousePhotos = card.querySelectorAll('.spouse-photo');
                        const spousePhoto = spousePhotos[unionIndex];
                        if (spousePhoto) {
                            window.photoPopup.createHoverHandlers(
                                spousePhoto, 
                                spousePhotoResult.photoUrl, 
                                this.getDisplayName(union.partner)
                            );
                        }
                    }
                }
            });
        }

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
                    <svg viewBox="0 0 54 55.711" xml:space="preserve" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><g style="fill:#8f6e56;fill-opacity:1;stroke:#8f6e56;stroke-opacity:1"><path d="M50.287 26.051C47.9 15.399 38.325 7.712 27.356 7.712c-.348 0-.69.03-1.035.045.371-.678 1.563-2.29 4.916-3.384a1 1 0 1 0-.62-1.901c-2.588.844-4.147 2.02-5.076 3.021-.958-2.077-3.098-4.535-7.916-5.476a1 1 0 0 0-.383 1.963c5.429 1.06 6.697 4.232 6.99 5.81q0 .076.011.15C14.619 9.236 6.582 16.42 4.424 26.049A8.04 8.04 0 0 0 .855 32.71c0 3.13 1.871 6.004 4.699 7.289C9.114 48.816 17.82 54.71 27.355 54.71s18.241-5.894 21.801-14.711c2.829-1.285 4.699-4.159 4.699-7.289a8.03 8.03 0 0 0-3.568-6.659zm-2.267 12.26a1 1 0 0 0-.573.575c-3.161 8.27-11.235 13.826-20.09 13.826s-16.929-5.557-20.09-13.826a1 1 0 0 0-.573-.575 6.04 6.04 0 0 1-3.837-5.599 6.03 6.03 0 0 1 2.964-5.177 1 1 0 0 0 .473-.662C8.331 16.93 17.189 9.712 27.356 9.712s19.025 7.218 21.062 17.161a1 1 0 0 0 .473.662 6.03 6.03 0 0 1 2.964 5.177 6.04 6.04 0 0 1-3.835 5.599z" style="fill:#8f6e56;fill-opacity:1;stroke:#8f6e56;stroke-opacity:1" transform="translate(-.355 .501)"/><path d="M26.856 34.712c-2.693 0-9 0-9 6.174 0 5.111 4.122 9.429 9 9.429s9-4.317 9-9.429c0-6.174-6.307-6.174-9-6.174zm0 13.603c-3.729 0-7-3.472-7-7.429 0-3.043 1.897-4.174 7-4.174s7 1.131 7 4.174c0 3.957-3.271 7.429-7 7.429z" style="fill:#8f6e56;fill-opacity:1;stroke:#8f6e56;stroke-opacity:1" transform="translate(-.355 .501)"/><path d="M26.856 38.712c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0 6c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2zm8-21c-2.757 0-5 2.243-5 5a1 1 0 1 0 2 0c0-1.654 1.346-3 3-3s3 1.346 3 3a1 1 0 1 0 2 0c0-2.757-2.243-5-5-5zm-12 5a1 1 0 1 0 2 0c0-2.757-2.243-5-5-5s-5 2.243-5 5a1 1 0 1 0 2 0c0-1.654 1.346-3 3-3s3 1.346 3 3z" style="fill:#8f6e56;fill-opacity:1;stroke:#8f6e56;stroke-opacity:1" transform="translate(-.355 .501)"/></g></svg>
                    <span><strong>Nascimento:</strong> ${member.birthDate || 'Não informado'}${member.birthLocation ? ` em ${member.birthLocation}` : ''}</span>
                </div>
            `);
        }
        
        if (member.deathDate || member.deathLocation) {
            details.push(`
                <div class="info-row">
                    <!-- cruz
                        <svg width="11.232" height="17" viewBox="0 0 11.232 17" xmlns="http://www.w3.org/2000/svg"><path style="fill:#8f6e56;fill-opacity:1;stroke-width:.265625" d="M14.593 17.682a.6.6 0 0 1-.202-.177c-.065-.107-.067-.21-.083-4.714l-.017-4.604-1.737-.017c-1.67-.016-1.741-.02-1.83-.084a.7.7 0 0 1-.16-.205c-.065-.13-.068-.201-.068-1.515 0-1.305.004-1.386.067-1.517a.6.6 0 0 1 .177-.204c.105-.064.192-.068 1.83-.084l1.72-.017.018-1.72c.018-1.93.008-1.856.27-2.004.123-.068.168-.07 1.532-.07 1.33 0 1.411.003 1.535.066a.6.6 0 0 1 .21.194l.079.128.01 1.711.01 1.712h3.421l.121.082c.233.159.232.152.232 1.728 0 1.575.002 1.56-.236 1.723l-.111.076h-3.429l-.01 4.596-.008 4.596-.08.127a.6.6 0 0 1-.21.194c-.122.063-.203.067-1.522.067-1.324 0-1.4-.004-1.529-.068m2.312-5.605c.017-4.59.017-4.61.086-4.703a1 1 0 0 1 .163-.163c.09-.068.136-.07 1.828-.079l1.736-.01-.01-.749-.009-.75-1.743-.016c-1.694-.017-1.745-.019-1.836-.087a1 1 0 0 1-.163-.162c-.067-.091-.07-.136-.078-1.829l-.01-1.735-.75.01-.749.008-.017 1.726c-.016 1.678-.019 1.73-.086 1.82a1 1 0 0 1-.163.162c-.09.068-.142.07-1.82.087l-1.726.017-.009.75-.009.749 1.736.01c1.7.008 1.737.01 1.83.08.052.038.13.12.171.181l.076.112v4.576c0 2.518.01 4.587.023 4.6s.358.02.768.014l.744-.009z" transform="translate(-10.496 -.75)"/></svg>
                    -->
                    <svg width="16.606" height="17" viewBox="0 0 16.606 17" xmlns="http://www.w3.org/2000/svg"><path style="fill:#8f6e56;fill-opacity:1;stroke:#8f6e56;stroke-width:.0620637;stroke-dasharray:none;stroke-opacity:1" d="M6.502 17.557c-.287-.146-.281-.121-.292-1.297-.01-.997-.007-1.042.063-1.23a1.2 1.2 0 0 1 .569-.614c.16-.072.222-.079.857-.088l.685-.011.013-4.077c.014-3.928.017-4.091.082-4.442.246-1.333.789-2.394 1.689-3.304a6.063 6.063 0 0 1 8.621 0c.9.91 1.442 1.97 1.689 3.304.065.35.068.514.081 4.442l.014 4.077.685.01c.635.01.697.017.857.09.233.105.476.367.568.614.07.187.073.232.063 1.23-.01 1.175-.005 1.15-.291 1.296l-.146.075H6.647Zm15.16-1.58v-.563H7.294v1.125H21.66Zm-2.22-5.62c0-4.153-.001-4.205-.146-4.774-.451-1.782-1.87-3.212-3.61-3.636a4.3 4.3 0 0 0-1.208-.143c-.495 0-.751.03-1.208.143a4.98 4.98 0 0 0-3.574 3.47c-.185.657-.183.591-.183 4.916v3.989h9.93zm-5.227.198a.51.51 0 0 1-.268-.357c-.016-.071-.03-.752-.03-1.512l-.001-1.382h-.906c-.887 0-.907-.001-1.017-.075a.54.54 0 0 1-.262-.46c0-.2.062-.327.22-.448l.122-.092.921-.01.922-.01v-.834c0-.504.014-.887.036-.965.079-.283.395-.466.665-.385.176.053.34.216.387.385.022.078.037.461.037.965v.834l.921.01.921.01.122.092c.158.121.22.247.22.447a.54.54 0 0 1-.262.461c-.109.074-.13.075-1.015.075h-.904l-.01 1.465c-.01 1.622-.007 1.59-.23 1.75a.64.64 0 0 1-.59.036z" transform="translate(-6.175 -.663)"/></svg>

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
                    <!--
                        <h4 class="section-header">
                            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Informações Pessoais
                        </h4>
                    -->
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
            const fid = this.resolveIdByExactName(member.parents.father);
            const fatherPerson = this.familyData.familyMembers.find(m => m.id === fid);
            let fatherDisplayName;
            
            if (fatherPerson) {
                // Found as family member - use getDisplayName for legal name
                fatherDisplayName = this.getDisplayName(fatherPerson);
            } else {
                // Not found as family member - search partners/spouses for legal name
                const fatherData = this.findPersonByBirthName(member.parents.father);
                fatherDisplayName = fatherData ? (fatherData.legalName || fatherData.name) : member.parents.father;
            }
            
            const fatherHtml = fid
                ? `<span class="parent-link" data-id="${fid}" role="link" tabindex="0">${fatherDisplayName}</span>`
                : `${fatherDisplayName}`;
            parents.push(`<strong>Pai:</strong> ${fatherHtml}`);
        }
        if (member.parents.mother) {
            const mid = this.resolveIdByExactName(member.parents.mother);
            const motherPerson = this.familyData.familyMembers.find(m => m.id === mid);
            let motherDisplayName;
            
            if (motherPerson) {
                // Found as family member - use getDisplayName for legal name
                motherDisplayName = this.getDisplayName(motherPerson);
            } else {
                // Not found as family member - search partners/spouses for legal name
                const motherData = this.findPersonByBirthName(member.parents.mother);
                motherDisplayName = motherData ? (motherData.legalName || motherData.name) : member.parents.mother;
            }
            
            const motherHtml = mid
                ? `<span class="parent-link" data-id="${mid}" role="link" tabindex="0">${motherDisplayName}</span>`
                : `${motherDisplayName}`;
            parents.push(`<strong>Mãe:</strong> ${motherHtml}`);
        }

        return `
            <div class="details-section">
                <div class="info-section">
                    <!--
                    <h4 class="section-header">
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Pais
                    </h4>
                    -->
                    <div class="section-content">
                        <div class="info-row">
                            <svg width="18" height="13" viewBox="0 0 18 13" xmlns="http://www.w3.org/2000/svg"><path style="fill:#8f6e56;fill-opacity:1;stroke:#8f6e56;stroke-width:.6;stroke-dasharray:none;stroke-opacity:1" d="M188.678 150.81c-.163-.088-.17-.153-.153-1.385.012-.907.027-1.19.072-1.388.318-1.41 1.15-2.482 2.4-3.096l.407-.2-.19-.132a3.22 3.22 0 0 1-1.242-1.77c-.094-.349-.104-1.08-.02-1.42.197-.784.654-1.447 1.286-1.868 1.64-1.09 3.882-.36 4.555 1.483a3.065 3.065 0 0 1-1.146 3.578c-.187.13-.192.136-.116.166.224.087.403.175.637.314a4.36 4.36 0 0 1 1.672 1.763c.089.175.169.318.178.318.01 0 .09-.143.178-.318.424-.832 1.094-1.483 1.971-1.914l.408-.2-.19-.132a3.22 3.22 0 0 1-1.242-1.77c-.094-.349-.104-1.08-.02-1.42.197-.784.653-1.447 1.286-1.868 1.64-1.09 3.882-.36 4.555 1.483a3.065 3.065 0 0 1-1.146 3.578c-.187.13-.192.136-.116.166a4.45 4.45 0 0 1 2.3 2.057c.203.394.307.673.41 1.102.08.33.085.411.1 1.488.017 1.24.01 1.299-.16 1.387-.14.072-16.542.07-16.674-.002zm8.008-1.392c0-.85-.029-1.142-.153-1.577-.277-.962-1.015-1.847-1.923-2.304a4 4 0 0 0-1.677-.39 3.77 3.77 0 0 0-3.718 3.236c-.02.141-.035.607-.035 1.035v.778h7.506zm8.17 0c0-.85-.028-1.142-.153-1.577-.276-.962-1.014-1.847-1.922-2.304a4 4 0 0 0-1.678-.39 3.77 3.77 0 0 0-3.717 3.236c-.02.141-.036.607-.036 1.035v.778h7.507zm-11.465-4.988a2.39 2.39 0 0 0 1.923-2.514c-.042-.591-.262-1.061-.704-1.506-.258-.26-.346-.324-.615-.454-.72-.345-1.402-.345-2.125 0-.273.13-.356.192-.615.454-.33.333-.486.59-.62 1.017-.065.21-.077.317-.075.681.002.375.014.467.09.698.124.372.3.655.589.949.58.59 1.37.837 2.152.675zm8.17 0a2.39 2.39 0 0 0 1.924-2.514c-.042-.591-.262-1.061-.704-1.506-.259-.26-.346-.324-.616-.454-.72-.345-1.402-.345-2.124 0-.273.13-.356.192-.616.454-.329.333-.485.59-.619 1.017-.065.21-.077.317-.075.681.002.375.014.467.09.698.124.372.299.655.588.949.581.59 1.37.837 2.152.675z" transform="translate(-188.217 -138.743)"/></svg>
                            <span>${parents.join(' <br> ')}</span>
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
                    <!--
                        <h4 class="section-header">
                            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>
                            Família
                        </h4>
                    -->
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
        if (!spouse || !spouse.name) return '';

        // Check if spouse has a photo
        const spousePhotoResult = this.spousePhotoResults?.find(r => r.member.name === spouse.name);
        const hasPhoto = spousePhotoResult?.hasPhoto;
        const photoUrl = spousePhotoResult?.photoUrl;

        const details = [];
        
        if (spouse.name) {
            details.push(`<strong>${this.getDisplayName(spouse)}</strong>`);
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
            details.push(`${parents.join(' | ')}`);
        }

        return `
            <div class="spouse-info">
                <div class="spouse-header">
                    ${hasPhoto ? 
                        `<div class="spouse-photo-container">
                            <img src="${photoUrl}" alt="${this.getDisplayName(spouse)}" class="spouse-photo" loading="lazy" decoding="async" />
                        </div>` : 
                        ''
                    }
                    <div class="spouse-name">${details[0] || 'Cônjuge'}</div>
                </div>
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
            `<span class="child-tag" data-id="${child.id}" role="link" tabindex="0">${this.getDisplayName(child, 'children')}</span>`
        ).join('');

        return `
            <div class="children-section">
                <div class="children-header">
                    <!--
                        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>
                        <svg width="11" height="17" viewBox="0 0 11 17" xmlns="http://www.w3.org/2000/svg"><path style="fill:#8f6e56;fill-opacity:1;stroke-width:.0415794" d="M98.13 64.637c-.463-.078-.993-.37-1.358-.75-.23-.24-.53-.774-.578-1.032l-.027-.144h-.86c-.474 0-.972-.02-1.108-.045a2.23 2.23 0 0 1-1.162-.637c-.341-.345-.49-.603-.603-1.047-.08-.31-.083-.473-.083-4.404v-4.082l-.161-.049a2.41 2.41 0 0 1-1.74-2.46c.026-.478.138-.852.357-1.191a2.42 2.42 0 0 1 2.058-1.137c.72 0 1.23.208 1.735.707.982.97.987 2.492.012 3.467-.27.27-.667.511-1.005.611l-.18.053.013 1.105.013 1.105.111.187c.15.254.347.434.596.548.192.087.279.096 1.105.11l.897.015.108-.294a2.462 2.462 0 0 1 3.705-1.183c.72.492 1.1 1.27 1.055 2.155-.027.52-.135.842-.423 1.266a2.52 2.52 0 0 1-2.048 1.083c-1.051-.004-2.078-.79-2.347-1.798l-.053-.197h-.883c-.957 0-1.184-.03-1.584-.21l-.26-.118v2.194c0 2.46-.003 2.425.296 2.765.092.105.27.239.402.304.235.115.25.117 1.137.131l.9.016.09-.273c.336-1.009 1.402-1.714 2.473-1.636.619.045 1.112.275 1.567.73.49.49.715 1.033.712 1.716a2.3 2.3 0 0 1-.217 1.013 2.42 2.42 0 0 1-2.245 1.428 4 4 0 0 1-.416-.022m.919-1.111c.941-.325 1.22-1.574.51-2.285-.257-.257-.522-.37-.908-.391-.269-.015-.378-.001-.568.07a1.37 1.37 0 0 0-.75.7c-.12.243-.137.317-.137.61 0 .256.021.382.09.53.101.22.375.534.573.657.325.2.797.244 1.19.109m-.032-6.134c.67-.287.969-1.069.677-1.767-.094-.225-.416-.543-.66-.653-.305-.136-.802-.138-1.073-.005a1.4 1.4 0 0 0-.649.625c-.1.204-.117.288-.117.591 0 .29.018.39.101.558a1.34 1.34 0 0 0 1.721.651M93.5 51.35c.788-.404.989-1.459.403-2.11a1.8 1.8 0 0 0-.403-.324c-.186-.097-.26-.111-.607-.112-.463 0-.659.074-.954.363-.278.273-.397.563-.397.967.001.401.101.657.365.929.31.32.582.425 1.048.408.26-.01.38-.036.545-.121" transform="translate(-90.446 -47.66)"/></svg>
                    -->
                    <svg width="17" height="17" viewBox="0 0 17 17" xmlns="http://www.w3.org/2000/svg"><path style="fill:#8f6e56;fill-opacity:1;stroke-width:.0332175" d="M100.082 111.064a1.57 1.57 0 0 1-1.183-1.748 1.57 1.57 0 0 1 1.554-1.327h.237l.372-.8.373-.8-.199-.212a2 2 0 0 1-.567-1.426c0-.516.14-.916.459-1.323a2.094 2.094 0 0 1 2.543-.564l.163.082.717-.717.718-.718h-.582c-.66-.001-.805-.038-.931-.238-.064-.1-.069-.145-.053-.509.053-1.233.822-2.436 1.919-3.005l.22-.114-.125-.168c-.585-.783-.57-1.858.037-2.592a2.15 2.15 0 0 1 1.2-.729c.322-.066.526-.066.849 0a2.094 2.094 0 0 1 1.668 2.04c0 .451-.172.953-.443 1.295l-.118.147.239.13c1.112.6 1.854 1.773 1.905 3.013.014.346.009.392-.054.492-.126.2-.27.237-.931.238h-.581l.717.718.717.717.163-.082c1.037-.526 2.326-.062 2.819 1.014.14.305.184.518.184.883 0 .537-.19 1.012-.568 1.416l-.199.212.373.8.372.8h.235q.657 0 1.116.46c.897.9.402 2.419-.859 2.635-.787.135-1.577-.402-1.765-1.198a1.86 1.86 0 0 1 .065-.904c.04-.102.13-.261.2-.355l.13-.17-.383-.823-.383-.824-.42.005-.422.005-.387.816c-.214.45-.376.825-.36.834.064.04.274.398.332.566.276.803-.156 1.7-.953 1.98a1.553 1.553 0 0 1-2.07-1.465 1.54 1.54 0 0 1 1.564-1.562h.22l.37-.786c.204-.432.37-.795.37-.806s-.078-.104-.174-.207c-.6-.638-.751-1.542-.39-2.315l.102-.218-1.072-1.073-1.073-1.072h-1.362l-1.073 1.072-1.072 1.073.102.218c.363.777.215 1.65-.395 2.326l-.18.198.05.106.376.795.325.689h.22q.658 0 1.103.45c.32.323.461.662.461 1.112 0 .779-.552 1.416-1.331 1.537-1.133.175-2.068-.959-1.692-2.052.058-.168.268-.526.333-.566.015-.009-.147-.384-.36-.833l-.388-.817-.42-.005-.422-.005-.383.823-.383.823.129.17c.183.243.27.49.29.826a1.49 1.49 0 0 1-.457 1.202c-.38.38-.93.536-1.448.41m.62-1.024c.21-.106.305-.28.29-.532-.02-.314-.2-.494-.514-.514-.227-.015-.384.055-.498.223a.55.55 0 0 0 .033.687c.192.22.431.266.69.136m4.63 0a.52.52 0 0 0 .283-.378c.064-.36-.187-.677-.538-.677-.504 0-.756.548-.43.936a.54.54 0 0 0 .685.118m4.582.03c.22-.093.38-.383.338-.613a.57.57 0 0 0-.573-.472c-.35 0-.617.34-.54.687a.576.576 0 0 0 .774.397m4.616 0c.145-.06.314-.26.34-.403a.554.554 0 0 0-.606-.674.53.53 0 0 0-.423.238c-.104.138-.097.494.011.647a.59.59 0 0 0 .678.192m-11.329-4.318c.186-.078.471-.364.56-.563.11-.242.11-.668 0-.892a1.14 1.14 0 0 0-.508-.528c-.191-.103-.235-.113-.492-.114-.336-.001-.509.065-.75.287a1.093 1.093 0 0 0-.042 1.564c.325.325.812.422 1.232.246m9.314-.04c.501-.245.727-.911.482-1.427a1.25 1.25 0 0 0-.564-.56c-.227-.104-.656-.098-.886.013a1.3 1.3 0 0 0-.547.547c-.12.247-.118.66.003.913.272.575.93.799 1.512.515zm-2.48-5.227c0-.075-.15-.505-.24-.684a3.1 3.1 0 0 0-.686-.867 3.5 3.5 0 0 0-1.116-.564 3.05 3.05 0 0 0-1.278.015 2.76 2.76 0 0 0-1.924 1.843c-.039.125-.07.24-.07.257s1.116.03 2.657.03 2.657-.013 2.657-.03M107.85 97.2c.505-.248.754-.86.56-1.374a1.2 1.2 0 0 0-.56-.615 1.15 1.15 0 0 0-.943 0c-.646.317-.819 1.115-.369 1.705.091.12.296.263.471.33.192.073.65.048.841-.046" transform="translate(-98.881 -94.107)"/></svg>
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
                            <!--
                                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14,2 14,8 20,8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10,9 9,9 8,9"></polyline>
                                </svg>
                            -->
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
            const generations = Math.max(...this.familyData.familyMembers.map(m => m.generation || 0));
            counter.textContent = `${totalMembers} membros da família encontrados (${generations} gerações)`;
        }
    }

    /**
     * Bind click and keyboard interactions for navigating to related members
     */
    bindInteractions() {
        if (!this.container) return;
        const navigate = (id) => {
            if (!id) return;
            if (window.shareManager && typeof window.shareManager.navigateToMember === 'function') {
                window.shareManager.navigateToMember(id);
            } else {
                window.location.hash = encodeURIComponent(id);
            }
        };

        this.container.addEventListener('click', (e) => {
            const el = e.target.closest('.child-tag, .parent-link');
            if (!el) return;
            const id = el.getAttribute('data-id');
            if (id) {
                e.preventDefault();
                navigate(id);
            }
        });

        this.container.addEventListener('keydown', (e) => {
            const el = e.target;
            if (!el || !(el.classList?.contains('child-tag') || el.classList?.contains('parent-link'))) return;
            if (e.key === 'Enter' || e.key === ' ') {
                const id = el.getAttribute('data-id');
                if (id) {
                    e.preventDefault();
                    navigate(id);
                }
            }
        });
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
