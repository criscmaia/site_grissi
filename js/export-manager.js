/**
 * Export Manager for Family Data
 * Handles exporting family data to various formats
 */

/**
 * Get the appropriate display name for a person
 * Children in unions always show their birth name (name)
 * All other contexts show legal name if available, otherwise birth name
 */
function getDisplayName(person) {
    if (!person) return '';
    return person.legalName || person.name;
}

class ExportManager {
    constructor() {
        this.familyData = null;
        this.isAdmin = false; // Admin mode flag
    }

    /**
     * Initialize the export manager
     */
    init(familyData, adminMode = false) {
        this.familyData = familyData;
        this.isAdmin = adminMode;
        
        if (this.isAdmin) {
            this.createExportUI();
        }
        
        console.log('📊 ExportManager: Initialized', { adminMode });
    }

    /**
     * Create export UI (admin only)
     */
    createExportUI() {
        // Create export section
        const exportSection = document.createElement('div');
        exportSection.className = 'admin-export-section';
        exportSection.innerHTML = `
            <div class="export-header">
                <h3>Exportar Dados (Admin)</h3>
                <p>Formatos disponíveis para download</p>
            </div>
            <div class="export-buttons">
                <button class="export-btn json" onclick="window.exportManager.exportJSON()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    Exportar JSON
                </button>
                <button class="export-btn csv" onclick="window.exportManager.exportCSV()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    Exportar CSV
                </button>
                <button class="export-btn gedcom" onclick="window.exportManager.exportGEDCOM()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    Exportar GEDCOM
                </button>
            </div>
        `;

        // Insert after search section
        const searchSection = document.querySelector('.search-filter-section');
        if (searchSection) {
            searchSection.parentNode.insertBefore(exportSection, searchSection.nextSibling);
        }
    }

    /**
     * Export data as JSON
     */
    exportJSON() {
        if (!this.familyData) {
            console.error('❌ ExportManager: No data available');
            return;
        }

        const dataStr = JSON.stringify(this.familyData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        this.downloadFile(dataBlob, 'familia-grissi.json');
        
        console.log('📊 ExportManager: JSON exported successfully');
    }

    /**
     * Export data as CSV
     */
    exportCSV() {
        if (!this.familyData) {
            console.error('❌ ExportManager: No data available');
            return;
        }

        const csvData = this.convertToCSV();
        const dataBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(dataBlob, 'familia-grissi.csv');
        
        console.log('📊 ExportManager: CSV exported successfully');
    }

    /**
     * Export data as GEDCOM
     */
    exportGEDCOM() {
        if (!this.familyData) {
            console.error('❌ ExportManager: No data available');
            return;
        }

        const gedcomData = this.convertToGEDCOM();
        const dataBlob = new Blob([gedcomData], { type: 'text/plain;charset=utf-8;' });
        this.downloadFile(dataBlob, 'familia-grissi.ged');
        
        console.log('📊 ExportManager: GEDCOM exported successfully');
    }

    /**
     * Convert family data to CSV format
     */
    convertToCSV() {
        const headers = [
            'ID', 'Nome', 'Geração', 'Gênero', 'Data de Nascimento', 'Local de Nascimento',
            'Data de Falecimento', 'Local de Falecimento', 'Pai', 'Mãe', 'Cônjuge', 'Filhos'
        ];

        const rows = [headers.join(',')];

        this.familyData.familyMembers.forEach(member => {
            const row = [
                member.id || '',
                `"${getDisplayName(member)}"`,
                member.generation || '',
                member.gender || '',
                `"${member.birthDate || ''}"`,
                `"${member.birthLocation || ''}"`,
                `"${member.deathDate || ''}"`,
                `"${member.deathLocation || ''}"`,
                `"${member.parents?.father || ''}"`,
                `"${member.parents?.mother || ''}"`,
                `"${this.getSpouseNames(member)}"`,
                `"${this.getChildrenNames(member)}"`
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }

    /**
     * Convert family data to GEDCOM format
     */
    convertToGEDCOM() {
        const lines = [
            '0 HEAD',
            '1 SOUR SiteGrissi',
            '1 GEDC',
            '2 VERS 5.5.1',
            '2 FORM LINEAGE-LINKED',
            '1 CHAR UTF-8',
            '1 DATE ' + new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            }).replace(/\//g, ''),
            '0 @F1@ FAM',
            ''
        ];

        // Add individuals
        this.familyData.familyMembers.forEach(member => {
            lines.push(`0 @I${member.id}@ INDI`);
            lines.push(`1 NAME ${getDisplayName(member)}`);
            
            if (member.gender) {
                lines.push(`1 SEX ${member.gender === 'male' ? 'M' : 'F'}`);
            }
            
            if (member.birthDate) {
                lines.push(`1 BIRT`);
                lines.push(`2 DATE ${member.birthDate}`);
                if (member.birthLocation) {
                    lines.push(`2 PLAC ${member.birthLocation}`);
                }
            }
            
            if (member.deathDate) {
                lines.push(`1 DEAT`);
                lines.push(`2 DATE ${member.deathDate}`);
                if (member.deathLocation) {
                    lines.push(`2 PLAC ${member.deathLocation}`);
                }
            }
            
            if (member.parents?.father || member.parents?.mother) {
                lines.push(`1 FAMC @F${member.id}@`);
            }
            
            lines.push('');
        });

        // Add families
        this.familyData.familyMembers.forEach(member => {
            if (member.unions && member.unions.length > 0) {
                member.unions.forEach((union, index) => {
                    const familyId = `${member.id}_${index + 1}`;
                    lines.push(`0 @F${familyId}@ FAM`);
                    lines.push(`1 HUSB @I${member.id}@`);
                    
                    if (union.partner?.name) {
                        lines.push(`1 WIFE @I${union.partner.name.replace(/\s+/g, '_')}@`);
                    }
                    
                    if (union.children && union.children.length > 0) {
                        union.children.forEach(child => {
                            lines.push(`1 CHIL @I${child.id}@`);
                        });
                    }
                    
                    if (union.partner?.marriageDate) {
                        lines.push(`1 MARR`);
                        lines.push(`2 DATE ${union.partner.marriageDate}`);
                    }
                    
                    lines.push('');
                });
            }
        });

        lines.push('0 TRLR');
        return lines.join('\n');
    }

    /**
     * Get spouse names for CSV export
     */
    getSpouseNames(member) {
        if (!member.unions) return '';
        return member.unions
            .map(union => union.partner?.name)
            .filter(Boolean)
            .join('; ');
    }

    /**
     * Get children names for CSV export
     * Children always show their birth name (name), not legal name
     */
    getChildrenNames(member) {
        if (!member.unions) return '';
        return member.unions
            .flatMap(union => union.children || [])
            .map(child => child.name) // Always use birth name for children
            .filter(Boolean)
            .join('; ');
    }

    /**
     * Download file helper
     */
    downloadFile(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
}

// Expose globally
window.ExportManager = ExportManager;

