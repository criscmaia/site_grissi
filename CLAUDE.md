# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SiteGrissi is a modern genealogy website for the Grizzo/Grice/Gris/Grissi family. This is a vanilla JavaScript PWA (Progressive Web App) built with performance optimization and modern web standards in mind. The site displays family tree data with interactive search, filtering, and photo integration capabilities.

## Architecture & Core Components

### Data Layer
- **`genealogy.json`**: Primary data source containing 289+ family members with full genealogical relationships
- **`family-data.json`**: Legacy/backup data source
- **`images/arvore/photo-manifest.json`**: Photo metadata and mapping system

### Frontend Architecture
- **Vanilla JavaScript ES6+**: No frameworks, uses modern JavaScript classes and modules
- **Component-based design**: Modular JavaScript classes for different functionalities
- **PWA implementation**: Service worker (`sw.js`) with intelligent caching strategies

### Key JavaScript Modules (`js/` directory)
- **`final-family-renderer.js`**: Main component that renders genealogy data into cards
- **`search-filter-controller.js`**: Handles search functionality and filtering
- **`photo-matcher.js`**: Matches family member names to profile photos
- **`photo-popup.js`**: Handles photo hover effects and popups
- **`share-manager.js`**: Social sharing functionality
- **`export-manager.js`**: Data export capabilities

### Data Structure
The genealogy JSON follows a comprehensive structure:
- Each family member has: id, name, legalName, generation, parents, unions, relationships
- Unions contain partner details and children
- Name changes are tracked with `legalName` field
- Parent-child relationships use exact name matching

## Development Workflow

Since this is a vanilla JavaScript project:
1. **No build process required** - Edit files directly
2. **Live reload** - Changes reflect immediately when refreshing browser
3. **No package manager** - All dependencies are either vanilla JS or CDN-based
4. **Simple deployment** - Upload files directly to web server

## Performance Standards

The project follows strict performance guidelines from `.cursorrules`:
- **Core Web Vitals targets**: LCP < 2.5s, CLS < 0.1, INP < 200ms
- **Critical CSS inlined** for above-the-fold content
- **Service Worker caching** for offline functionality
- **Lazy loading** for images and non-critical resources
- **Resource preloading** for critical assets
- **Modern image formats** (WebP) with fallbacks

## Key Features

### Family Tree Display
- Dynamic card-based layout for family members
- Generation-based organization (7 generations tracked)
- Responsive design for all device sizes

### Search & Filtering
- Real-time search across all family member names
- Auto-adjustment for hidden cards with toast notifications
- Search filter controller maintains state across interactions

### Photo Integration
- Automatic photo matching based on family member names
- Hover effects and popup displays
- Photo manifest system for organized image management

### PWA Capabilities
- Installable as mobile/desktop app
- Offline functionality via service worker
- Fast loading with intelligent caching

## Testing & Quality Assurance

- **Manual testing**: Open files directly in browser
- **Performance monitoring**: Check Core Web Vitals in browser dev tools
- **PWA validation**: Use Lighthouse for PWA compliance
- **Cross-device testing**: Verify responsive design on multiple screen sizes

## Content Management

### Adding Family Members
1. Update `genealogy.json` with new family member data
2. Follow existing JSON structure for consistency
3. Update photo manifest if adding photos
4. Test search functionality with new entries

### Photo Management
1. Add photos to appropriate `images/` subdirectories
2. Update `photo-manifest.json` with new photo metadata
3. Ensure photo matching works with family member names

## Common Tasks

- **View site locally**: Open `index.html` in browser
- **Check genealogy tree**: Open `arvore-genealogica.html`
- **Test search**: Use the search functionality on the main family tree page
- **Validate PWA**: Run Lighthouse audit in Chrome DevTools
- **Monitor performance**: Check Core Web Vitals in browser console

## Important Notes

- Always maintain backward compatibility with existing data structure
- Preserve performance optimizations when making changes
- Test search functionality after any data modifications
- Ensure new features work offline via service worker caching
- Follow semantic HTML5 structure for accessibility