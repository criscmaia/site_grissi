/**
 * Photo Upload System for Family Tree
 * Handles authentication, file uploads, and GitHub API integration
 */

class PhotoUploadManager {
    constructor() {
        this.isAuthenticated = false;
        this.familyMembers = [];
        this.photoManifest = null;
        this.fileQueue = [];
        this.currentFileIndex = 0;
        this.selectedPerson = null;
        this.currentFile = null;
        
        // GitHub Configuration loaded from external config file
        this.github = window.UPLOAD_CONFIG?.github || {
            repo: 'site_grissi',
            owner: 'criscmaia',
            branch: 'master',
            triggerToken: ''
        };
        
        // Check if config is properly loaded
        this.configMissing = !window.UPLOAD_CONFIG || !window.UPLOAD_CONFIG.github?.triggerToken || 
                            window.UPLOAD_CONFIG.github.triggerToken === 'ghp_YOUR_WORKFLOW_TRIGGER_TOKEN_HERE' ||
                            !window.UPLOAD_CONFIG.github.triggerToken.startsWith('ghp_');
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadFamilyData();
        this.checkAuthentication();
    }
    
    bindEvents() {
        // Authentication
        document.getElementById('login-btn').addEventListener('click', () => this.authenticate());
        document.getElementById('password-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authenticate();
        });
        
        // File selection
        document.getElementById('select-files-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });
        
        // Drag and drop
        const dropzone = document.getElementById('dropzone');
        dropzone.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            this.handleFileSelection(e.dataTransfer.files);
        });
        
        // Queue actions
        document.getElementById('upload-all-btn').addEventListener('click', () => {
            console.log('Upload button clicked');
            this.startUploadProcess();
        });
        document.getElementById('clear-queue-btn').addEventListener('click', () => this.clearQueue());
        
        // Modal events - Remove inline handlers, use addEventListener instead
        document.getElementById('person-search-input').addEventListener('input', () => this.searchPeople());
        document.getElementById('confirm-person-btn').addEventListener('click', () => this.confirmPersonSelection());
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closePersonModal());
        document.getElementById('cancel-modal-btn').addEventListener('click', () => this.closePersonModal());
        
        // Close modal on outside click
        document.getElementById('person-modal').addEventListener('click', (e) => {
            if (e.target.id === 'person-modal') {
                this.closePersonModal();
            }
        });
    }
    
    checkAuthentication() {
        const stored = localStorage.getItem('photoUploadAuth');
        const storedPassword = localStorage.getItem('photoUploadPassword');
        if (stored === 'authenticated' && storedPassword) {
            this.uploadPassword = storedPassword;
            this.isAuthenticated = true;
            this.showUploadInterface();
        }
    }
    
    authenticate() {
        const password = document.getElementById('password-input').value;
        
        // Validate password is provided
        if (!password.trim()) {
            this.showError('Digite uma senha para continuar.');
            return;
        }
        
        // Store the password for use in workflow dispatch
        this.uploadPassword = password;
        
        // If config is missing, prompt for credentials
        if (this.configMissing) {
            this.promptForCredentials();
            return;
        }
        
        // Set authenticated state
        this.isAuthenticated = true;
        localStorage.setItem('photoUploadAuth', 'authenticated');
        localStorage.setItem('photoUploadPassword', password); // Store for later use
        this.showUploadInterface();
    }
    
    promptForCredentials() {
        const triggerToken = prompt(`⚠️ Arquivo de configuração não encontrado!\n\nPara usar o sistema de upload, você precisa fornecer:\nGitHub Workflow Trigger Token (com escopo 'workflow' apenas)\n\nDigite seu GitHub Token:`);
        
        if (!triggerToken) {
            this.showError('Token GitHub é necessário para continuar');
            return;
        }
        
        // Set the credentials
        this.github.triggerToken = triggerToken;
        this.configMissing = false;
        
        // Continue with authentication
        this.isAuthenticated = true;
        localStorage.setItem('photoUploadAuth', 'authenticated');
        this.showUploadInterface();
        
        alert('✅ Credenciais configuradas! Sistema pronto para uso.\n\nNOTA: Para uso futuro, crie um arquivo config.js local para evitar digitar as credenciais novamente.');
    }
    
    async promptForUploadCredentials() {
        return new Promise((resolve) => {
            const triggerToken = prompt(`🔐 GitHub Workflow Token necessário para upload!\n\nDigite seu GitHub Workflow Trigger Token (escopo 'workflow'):`);
            
            if (!triggerToken) {
                resolve(false);
                return;
            }
            
            // Set the credentials
            this.github.triggerToken = triggerToken;
            this.configMissing = false;
            
            this.addLog('✅ Credenciais configuradas para upload', 'success');
            resolve(true);
        });
    }
    
    showError(message) {
        const errorDiv = document.getElementById('auth-error');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 5000);
    }
    
    showUploadInterface() {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('upload-section').style.display = 'block';
    }
    
    async loadFamilyData() {
        try {
            const response = await fetch('../genealogy.json');
            const data = await response.json();
            this.familyMembers = data.familyMembers;
            
            // Also load existing photo manifest
            try {
                const manifestResponse = await fetch('../images/arvore/photo-manifest.json');
                this.photoManifest = await manifestResponse.json();
            } catch (e) {
                console.warn('No photo manifest found, will create new one');
                this.photoManifest = { photos: [] };
            }
            
            console.log(`Loaded ${this.familyMembers.length} family members`);
        } catch (error) {
            console.error('Failed to load family data:', error);
            this.showError('Erro ao carregar dados da família');
        }
    }
    
    handleFileSelection(files) {
        const validFiles = [];
        const maxSize = 2 * 1024 * 1024; // Reduced to 2MB for Base64 compression
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        Array.from(files).forEach(file => {
            if (!validTypes.includes(file.type)) {
                this.addLog(`❌ ${file.name}: Tipo de arquivo não suportado`, 'error');
                return;
            }
            
            if (file.size > maxSize) {
                this.addLog(`❌ ${file.name}: Arquivo muito grande (máximo 2MB para upload via workflow)`, 'error');
                return;
            }
            
            validFiles.push(file);
        });
        
        validFiles.forEach(file => {
            this.addToQueue(file);
        });
        
        if (validFiles.length > 0) {
            document.getElementById('file-queue').style.display = 'block';
        }
    }
    
    addToQueue(file) {
        const queueItem = {
            id: Date.now() + Math.random(),
            file: file,
            person: null,
            status: 'pending', // pending, ready, uploading, uploaded, error
            preview: null
        };
        
        // Generate preview
        this.generatePreview(file).then(preview => {
            queueItem.preview = preview;
            this.updateQueueDisplay();
        });
        
        this.fileQueue.push(queueItem);
        this.updateQueueDisplay();
        this.updateUploadButton();
    }
    
    async generatePreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
    
    updateQueueDisplay() {
        const queueList = document.getElementById('queue-list');
        queueList.innerHTML = '';
        
        this.fileQueue.forEach(item => {
            const queueElement = this.createQueueElement(item);
            queueList.appendChild(queueElement);
        });
        
        this.updateUploadButton();
    }
    
    createQueueElement(item) {
        const div = document.createElement('div');
        div.className = `queue-item ${item.status}`;
        div.dataset.id = item.id;
        
        const statusIcon = {
            pending: '⏳',
            ready: '✅',
            uploading: '⬆️',
            uploaded: '✅',
            error: '❌'
        }[item.status];
        
        const personInfo = item.person 
            ? `<strong>Pessoa:</strong> ${item.person.displayName}`
            : '<em>Pessoa não selecionada</em>';
        
        div.innerHTML = `
            ${item.preview ? `<img src="${item.preview}" class="queue-photo" alt="Preview">` : '<div class="queue-photo"></div>'}
            <div class="queue-info">
                <h4>${statusIcon} ${item.file.name}</h4>
                <p>${this.formatFileSize(item.file.size)} - ${personInfo}</p>
            </div>
            <div class="queue-actions-item">
                ${item.status === 'pending' ? `
                    <button class="btn-small btn-edit" data-action="select-person" data-file-id="${item.id}">
                        Escolher Pessoa
                    </button>
                ` : ''}
                <button class="btn-small btn-remove" data-action="remove-file" data-file-id="${item.id}">
                    Remover
                </button>
            </div>
        `;
        
        // Add event listeners to the buttons
        const selectBtn = div.querySelector('[data-action="select-person"]');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.selectPersonForFile(item.id));
        }
        
        const removeBtn = div.querySelector('[data-action="remove-file"]');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeFromQueue(item.id));
        }
        
        return div;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    selectPersonForFile(fileId) {
        const item = this.fileQueue.find(f => f.id == fileId);
        if (!item) return;
        
        this.currentFile = item;
        this.showPersonModal(item);
    }
    
    showPersonModal(item) {
        const modal = document.getElementById('person-modal');
        const photoImg = document.getElementById('modal-photo');
        const filename = document.getElementById('photo-filename');
        const filesize = document.getElementById('photo-size');
        
        photoImg.src = item.preview || '';
        filename.textContent = item.file.name;
        filesize.textContent = this.formatFileSize(item.file.size);
        
        // Suggest names based on filename
        this.suggestNamesFromFilename(item.file.name);
        
        modal.style.display = 'block';
        document.getElementById('person-search-input').focus();
    }
    
    suggestNamesFromFilename(filename) {
        const suggestions = [];
        const cleanName = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
            .replace(/[_-]/g, ' ')
            .toUpperCase();
        
        // Look for potential names in the filename
        this.familyMembers.forEach(member => {
            const memberNames = [member.name];
            if (member.legalName) memberNames.push(member.legalName);
            
            memberNames.forEach(name => {
                const words = name.split(' ');
                words.forEach(word => {
                    if (word.length > 2 && cleanName.includes(word)) {
                        if (!suggestions.find(s => s.name === name)) {
                            suggestions.push({ name, member });
                        }
                    }
                });
            });
        });
        
        const suggestedDiv = document.getElementById('suggested-names');
        const suggestionsContainer = document.getElementById('filename-suggestions');
        
        if (suggestions.length > 0) {
            suggestedDiv.style.display = 'block';
            suggestionsContainer.innerHTML = suggestions.map(s => 
                `<span class="suggestion-tag" data-member-id="${s.member.id}">${s.name}</span>`
            ).join('');
            
            // Add click listeners to suggestion tags
            suggestionsContainer.querySelectorAll('.suggestion-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    this.selectSuggestion(tag.dataset.memberId);
                });
            });
        } else {
            suggestedDiv.style.display = 'none';
        }
    }
    
    selectSuggestion(memberId) {
        const member = this.familyMembers.find(m => m.id === memberId);
        if (member) {
            document.getElementById('person-search-input').value = member.name;
            this.searchPeople();
            this.selectSearchResult(member);
        }
    }
    
    searchPeople() {
        const query = document.getElementById('person-search-input').value.toLowerCase().trim();
        const results = document.getElementById('search-results');
        
        if (query.length < 2) {
            results.innerHTML = '';
            return;
        }
        
        const matches = [];
        
        // Search in family members
        this.familyMembers.forEach(member => {
            const searchIn = [member.name, member.legalName].filter(Boolean).join(' ').toLowerCase();
            if (searchIn.includes(query)) {
                matches.push({
                    type: 'member',
                    data: member,
                    displayName: member.legalName || member.name,
                    subtext: `ID: ${member.id} - Geração ${member.generation}`
                });
            }
        });
        
        // Search in spouses/partners
        this.familyMembers.forEach(member => {
            if (member.unions) {
                member.unions.forEach(union => {
                    if (union.partner && union.partner.name) {
                        const partnerName = (union.partner.legalName || union.partner.name).toLowerCase();
                        if (partnerName.includes(query)) {
                            matches.push({
                                type: 'partner',
                                data: union.partner,
                                displayName: union.partner.legalName || union.partner.name,
                                subtext: `Cônjuge de ${member.legalName || member.name}`
                            });
                        }
                    }
                });
            }
        });
        
        // Sort by relevance
        matches.sort((a, b) => {
            const aName = a.displayName.toLowerCase();
            const bName = b.displayName.toLowerCase();
            const aExact = aName.startsWith(query);
            const bExact = bName.startsWith(query);
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return aName.localeCompare(bName);
        });
        
        results.innerHTML = matches.slice(0, 10).map((match, index) => `
            <div class="search-result" data-index="${index}">
                <h5>${match.displayName}</h5>
                <p>${match.subtext}</p>
            </div>
        `).join('');
        
        // Add click listeners to search results
        results.querySelectorAll('.search-result').forEach((result, index) => {
            result.addEventListener('click', () => {
                this.selectSearchResult(matches[index], result);
            });
        });
        
        document.getElementById('confirm-person-btn').disabled = true;
        this.selectedPerson = null;
    }
    
    selectSearchResult(match, clickedElement = null) {
        if (typeof match === 'string') {
            // If called from suggestion, find the member
            const member = this.familyMembers.find(m => m.id === match);
            if (member) {
                match = {
                    type: 'member',
                    data: member,
                    displayName: member.legalName || member.name
                };
            }
        }
        
        // Clear previous selection
        document.querySelectorAll('.search-result').forEach(el => el.classList.remove('selected'));
        
        // Select the clicked item - find it if not provided
        if (!clickedElement) {
            // Try to find the element by match data
            const results = document.querySelectorAll('.search-result');
            results.forEach(el => {
                if (el.querySelector('h5').textContent === match.displayName) {
                    el.classList.add('selected');
                }
            });
        } else {
            clickedElement.classList.add('selected');
        }
        
        this.selectedPerson = match;
        document.getElementById('confirm-person-btn').disabled = false;
    }
    
    confirmPersonSelection() {
        if (!this.selectedPerson || !this.currentFile) return;
        
        this.currentFile.person = this.selectedPerson;
        this.currentFile.status = 'ready';
        
        this.closePersonModal();
        this.updateQueueDisplay();
    }
    
    closePersonModal() {
        document.getElementById('person-modal').style.display = 'none';
        document.getElementById('person-search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('suggested-names').style.display = 'none';
        this.selectedPerson = null;
        this.currentFile = null;
    }
    
    removeFromQueue(fileId) {
        this.fileQueue = this.fileQueue.filter(item => item.id != fileId);
        this.updateQueueDisplay();
        
        if (this.fileQueue.length === 0) {
            document.getElementById('file-queue').style.display = 'none';
        }
    }
    
    clearQueue() {
        this.fileQueue = [];
        document.getElementById('file-queue').style.display = 'none';
    }
    
    updateUploadButton() {
        const readyCount = this.fileQueue.filter(item => item.status === 'ready').length;
        const uploadBtn = document.getElementById('upload-all-btn');
        
        uploadBtn.disabled = readyCount === 0;
        uploadBtn.textContent = `Upload ${readyCount} Foto${readyCount !== 1 ? 's' : ''}`;
    }
    
    async startUploadProcess() {
        console.log('Upload process started');
        console.log('GitHub config:', { triggerToken: this.github.triggerToken ? 'SET' : 'NOT SET', owner: this.github.owner });
        console.log('Config missing flag:', this.configMissing);
        
        // Check if we have a password
        if (!this.uploadPassword) {
            this.addLog('❌ Senha não encontrada. Faça logout e entre novamente.', 'error');
            this.addLogoutLink();
            return;
        }
        
        // If config is missing and no trigger token is set, show error
        if (this.configMissing || !this.github.triggerToken || !this.github.owner) {
            this.addLog('❌ Configuração do sistema não encontrada. Contate o administrador.', 'error');
            console.error('GitHub configuration missing:', this.github);
            return;
        }
        
        const readyFiles = this.fileQueue.filter(item => item.status === 'ready');
        console.log('Ready files:', readyFiles.length);
        if (readyFiles.length === 0) {
            this.addLog('❌ Nenhuma foto pronta para upload. Selecione pessoas para as fotos primeiro.', 'error');
            return;
        }
        
        document.getElementById('upload-progress').style.display = 'block';
        document.getElementById('upload-all-btn').disabled = true;
        
        this.currentFileIndex = 0;
        
        for (const item of readyFiles) {
            await this.uploadSingleFile(item);
            this.currentFileIndex++;
            this.updateProgress(this.currentFileIndex, readyFiles.length);
        }
        
        this.addLog('✅ Processo de upload concluído!', 'success');
        
        // Auto-refresh after 2 minutes to show new photos (GitHub Pages needs time to rebuild)
        setTimeout(() => {
            this.addLog('🔄 Recarregando página em 30 segundos para mostrar novas fotos...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        }, 90000);
    }
    
    async uploadSingleFile(item) {
        item.status = 'uploading';
        this.updateQueueDisplay();
        
        try {
            // Generate filename
            const filename = this.generateFilename(item.person, item.file);
            
            // Convert file to base64
            const base64Content = await this.fileToBase64(item.file);
            
            // Upload via workflow dispatch
            await this.uploadViaWorkflow(filename, base64Content, item.person);
            
            item.status = 'uploaded';
            this.addLog(`✅ ${item.file.name} → ${filename} (workflow iniciado)`, 'success');
            
        } catch (error) {
            item.status = 'error';
            this.addLog(`❌ Erro ao fazer upload de ${item.file.name}: ${error.message}`, 'error');
            console.error('Upload error:', error);
        }
        
        this.updateQueueDisplay();
    }
    
    generateFilename(person, file) {
        const ext = file.name.split('.').pop().toLowerCase();
        let baseName;
        
        if (person.type === 'member') {
            // For family members, use their name
            baseName = (person.data.legalName || person.data.name)
                .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special chars but keep spaces
                .replace(/\s+/g, ' ')             // Normalize multiple spaces to single space
                .trim()                           // Remove leading/trailing spaces
                .toUpperCase();                   // Convert to uppercase to match manifest format
        } else {
            // For partners, use their name  
            baseName = (person.data.legalName || person.data.name)
                .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special chars but keep spaces
                .replace(/\s+/g, ' ')             // Normalize multiple spaces to single space
                .trim()                           // Remove leading/trailing spaces
                .toUpperCase();                   // Convert to uppercase to match manifest format
        }
        
        return `${baseName}.${ext}`;
    }
    
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            // Compress image before converting to base64
            this.compressImage(file, 0.7).then(compressedFile => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(compressedFile);
            }).catch(reject);
        });
    }
    
    async compressImage(file, quality = 0.7) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions (max 1200px on longest side)
                const maxDimension = 1200;
                let { width, height } = img;
                
                if (width > height && width > maxDimension) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    async uploadViaWorkflow(filename, base64Content, person) {
        // STEP 1: Create blob (upload file content to GitHub)
        this.addLog(`🔼 Passo 1/2: Enviando conteúdo do arquivo...`, 'info');
        
        const blobUrl = `https://api.github.com/repos/${this.github.owner}/${this.github.repo}/git/blobs`;
        const blobResponse = await fetch(blobUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${this.github.triggerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: base64Content,
                encoding: 'base64'
            })
        });

        if (!blobResponse.ok) {
            let errorData;
            try {
                errorData = await blobResponse.json();
            } catch (e) {
                errorData = { message: `HTTP ${blobResponse.status}: ${blobResponse.statusText}` };
            }
            throw new Error(`Falha ao criar blob: ${errorData.message}`);
        }

        const blobData = await blobResponse.json();
        const blobSha = blobData.sha;
        this.addLog(`✅ Blob criado: ${blobSha.substring(0, 8)}...`, 'success');

        // STEP 2: Trigger workflow with blob SHA
        this.addLog(`⚙️ Passo 2/2: Iniciando workflow de commit...`, 'info');
        
        const workflowUrl = `https://api.github.com/repos/${this.github.owner}/${this.github.repo}/actions/workflows/upload-photo.yml/dispatches`;
        const workflowPayload = {
            ref: this.github.branch,
            inputs: {
                password: this.uploadPassword,
                filename: filename,
                blob_sha: blobSha,
                person_id: person.type === 'member' ? person.data.id : null,
                person_name: person.displayName
            }
        };

        const workflowResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${this.github.triggerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workflowPayload)
        });

        if (workflowResponse.status === 204) {
            this.addLog(`🚀 Workflow iniciado para ${filename}`, 'success');
            return { success: true };
        } else {
            let errorData;
            try {
                errorData = await workflowResponse.json();
            } catch (e) {
                errorData = { message: `HTTP ${workflowResponse.status}: ${workflowResponse.statusText}` };
            }

            // Handle specific error cases
            if (workflowResponse.status === 401) {
                throw new Error('Token de acesso inválido ou sem permissão. Verifique se o token tem escopo "workflow".');
            } else if (workflowResponse.status === 404) {
                throw new Error('Repositório ou workflow não encontrado. Verifique a configuração.');
            } else {
                throw new Error(errorData.message || `Erro ${workflowResponse.status}: Falha ao iniciar workflow`);
            }
        }
    }
    
    
    updateProgress(current, total) {
        const percentage = Math.round((current / total) * 100);
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressFill.style.width = percentage + '%';
        progressText.textContent = `${percentage}% - ${current}/${total} arquivos processados`;
    }
    
    addLog(message, type = 'info') {
        const logContainer = document.getElementById('upload-log');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    addLogoutLink() {
        const logContainer = document.getElementById('upload-log');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry info';
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] <button onclick="photoUploader.logout()" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Fazer Logout</button>`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    logout() {
        // Clear stored authentication
        localStorage.removeItem('photoUploadAuth');
        localStorage.removeItem('photoUploadPassword');
        
        // Reset state
        this.isAuthenticated = false;
        this.uploadPassword = null;
        
        // Hide upload interface and show auth section
        document.getElementById('upload-section').style.display = 'none';
        document.getElementById('auth-section').style.display = 'block';
        
        // Clear password input
        document.getElementById('password-input').value = '';
        
        // Clear any error messages
        document.getElementById('auth-error').classList.remove('show');
        
        console.log('User logged out');
    }
}

// Initialize the photo upload system
const photoUploader = new PhotoUploadManager();

// Global functions for onclick handlers
window.photoUploader = photoUploader;