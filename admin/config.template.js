/**
 * Configuration Template for Photo Upload System
 * 
 * Instructions:
 * 1. Copy this file to config.js
 * 2. Replace the placeholder values with your actual credentials
 * 3. Do NOT commit config.js to git (it's in .gitignore)
 */

// GitHub Configuration - Automatically injected by GitHub Actions
window.UPLOAD_CONFIG = {
    github: {
        token: 'ghp_YOUR_ACTUAL_GITHUB_TOKEN_HERE', // Injected from GitHub Secrets
        repo: 'SiteGrissi',
        owner: 'criscmaia',
        branch: 'master'
    },
    auth: {
        password: 'your_secure_password_here' // Injected from GitHub Secrets
    }
};