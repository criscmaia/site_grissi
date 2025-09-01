# Photo Upload System - Setup Guide

## 🔧 Automated Configuration with GitHub Actions

This system uses GitHub Actions for secure, automated deployment. No manual configuration files needed!

### 1. GitHub Personal Access Token (PAT)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token" → "Generate new token (classic)"
3. Set expiration to "No expiration" (or your preferred timeframe)
4. Select these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `public_repo` (Access to public repositories)
5. Click "Generate token"
6. **IMPORTANT**: Copy the token immediately (you won't see it again)

### 2. Configure Repository Secrets

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret" and add:
   - **Name**: `GRISSI_TOKEN_PAT`
   - **Value**: The token from step 1
3. Click "New repository secret" again and add:
   - **Name**: `ADMIN_PASSWORD`
   - **Value**: Your desired admin password (choose something secure)

### 3. Deployment Process

The system automatically deploys when you make changes to the admin folder:

1. Any commit to the `master` branch that modifies files in the `admin/` folder triggers deployment
2. GitHub Actions securely injects your secrets into the configuration
3. The admin interface is deployed to GitHub Pages at `/admin/`
4. No sensitive data is ever committed to your repository

### Manual Deployment (Optional)

You can also trigger deployment manually:
1. Go to your repository → Actions
2. Select "Deploy Admin Interface" workflow
3. Click "Run workflow"

## 🚀 Usage Instructions

### Access the Upload Interface
1. Navigate to: `https://your-site-url/admin/photo-upload.html`
2. Enter the password you configured
3. Start uploading photos!

### Upload Process
1. **Select Files**: Drag & drop or click to select image files
2. **Match to People**: For each photo, select which family member it belongs to
3. **Upload**: Click "Upload All Photos" to start the GitHub upload process
4. **Wait**: Photos will be uploaded directly to your GitHub repository
5. **Auto-Deploy**: GitHub Pages will automatically rebuild and deploy (2-3 minutes)

### Supported Formats
- JPG/JPEG
- PNG  
- GIF
- WebP
- Maximum file size: 5MB per photo

## 🔒 Security Considerations

### Token Security
- The GitHub token will be visible in the browser's source code
- Only share the upload URL with trusted family members
- Consider using a token with minimal required permissions
- Monitor your GitHub repository for unauthorized changes

### Password Protection
- The password provides basic protection but is not encryption
- It's stored in plain text in the JavaScript file
- Consider changing it periodically

### Access Control
- The upload page is not linked from the main site
- Use robots.txt to prevent search engine indexing
- Consider adding IP restrictions if needed

## 🛠️ Troubleshooting

### Common Issues

**"Configuration not found" error:**
- Make sure you've set the GitHub token and owner in photo-upload.js

**Upload fails:**
- Check that your GitHub token has the correct permissions
- Verify the repository name and owner are correct
- Check your internet connection

**Photos don't appear on site:**
- GitHub Pages rebuild can take 2-10 minutes
- Check the GitHub repository to confirm files were uploaded
- Clear your browser cache

### GitHub API Limits
- GitHub API allows 5000 requests per hour for authenticated users
- Each photo upload uses 1-2 API calls
- You can upload approximately 2000+ photos per hour

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your GitHub token permissions
3. Ensure the repository settings allow API access
4. Test with a single small image file first

## 🔄 Future Enhancements

Possible improvements:
- Automatic photo manifest updates
- Batch thumbnail generation
- Upload progress for individual files
- Photo compression before upload
- Duplicate photo detection