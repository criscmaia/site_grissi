// JavaScript Template System for GitHub Pages
class TemplateSystem {
    constructor() {
        this.templates = {};
        this.currentPage = this.getCurrentPage();
    }

    // Get current page from URL
    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'index';
        return path.replace('.html', '').replace('.php', '').substring(1);
    }

    // Load a template
    async loadTemplate(templateName) {
        if (this.templates[templateName]) {
            return this.templates[templateName];
        }

        try {
            const response = await fetch(`templates/${templateName}.html`);
            const template = await response.text();
            this.templates[templateName] = template;
            return template;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            return '';
        }
    }

    // Render template with data
    async render(templateName, data = {}) {
        let template = await this.loadTemplate(templateName);
        
        // Replace template variables
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            template = template.replace(regex, this.escapeHtml(data[key]));
        });

        // Handle navigation highlighting
        template = this.processNavigation(template);
        
        return template;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Process navigation to highlight current page
    processNavigation(template) {
        const currentPage = this.currentPage;
        
        // Replace navigation links and add current class
        const navItems = [
            { path: '/', label: 'Página Principal', id: 'index' },
            { path: '/arvore-genealogica.html', label: 'Árvore Genealógica', id: 'arvore-genealogica' },
            { path: '/historia.html', label: 'História', id: 'historia' },
            { path: '/lembrancas.html', label: 'Lembranças', id: 'lembrancas' },
            { path: '/fotos.html', label: 'Fotos', id: 'fotos' },
            { path: '/contato.html', label: 'Contato', id: 'contato' }
        ];

        navItems.forEach(item => {
            const isCurrent = currentPage === item.id;
            const currentClass = isCurrent ? 'id="current"' : '';
            const link = `<a href="${item.path}" ${currentClass}>${item.label}</a>`;
            
            // Replace the navigation item in the template
            const regex = new RegExp(`<a href="${item.path.replace('/', '\\/')}"[^>]*>${item.label}<\/a>`, 'g');
            template = template.replace(regex, link);
        });

        return template;
    }

    // Initialize page with header and footer
    async initPage(title = 'Página Principal') {
        const header = await this.render('header', { title });
        const footer = await this.render('footer');
        
        // Insert header at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', header);
        
        // Insert footer at the end of body
        document.body.insertAdjacentHTML('beforeend', footer);
    }
}

// Global template system instance
window.templateSystem = new TemplateSystem(); 