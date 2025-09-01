/**
 * Configuration Template for Photo Upload System
 * 
 * Instructions:
 * 1. Copy this file to config.js
 * 2. Replace the placeholder values with your actual credentials
 * 3. Do NOT commit config.js to git (it's in .gitignore)
 */

// GitHub Configuration - Fill in your actual values
window.UPLOAD_CONFIG = {
    github: {
        token: 'ghp_YOUR_ACTUAL_GITHUB_TOKEN_HERE', // Get from GitHub Settings → Developer settings → PAT
        repo: 'SiteGrissi',
        owner: 'criscmaia',
        branch: 'master' // Change to 'main' if your repo uses main branch
    },
    auth: {
        password: 'your_secure_password_here' // Choose a secure password
    }
};