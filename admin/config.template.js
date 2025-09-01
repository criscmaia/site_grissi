/**
 * Configuration Template for Photo Upload System
 * 
 * Instructions:
 * 1. Copy this file to config.js
 * 2. Replace the placeholder values with your actual credentials
 * 3. Do NOT commit config.js to git (it's in .gitignore)
 */

// GitHub Configuration - Manual setup required
window.UPLOAD_CONFIG = {
    github: {
        repo: 'site_grissi',
        owner: 'criscmaia',
        branch: 'master',
        // Workflow trigger token - create with ONLY 'workflow' scope
        // This will be visible in client code, so use minimal permissions
        triggerToken: 'ghp_YOUR_WORKFLOW_TRIGGER_TOKEN_HERE'
    },
    auth: {
        // This is handled server-side now, no password needed in client
        // Password validation happens in GitHub Actions workflow
    }
};