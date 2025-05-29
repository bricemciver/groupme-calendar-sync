# GitHub Secrets Setup Guide

To enable automatic deployment via GitHub Actions, you need to set up the following secrets in your GitHub repository.

## Required Secrets

You need to add two secrets to your GitHub repository:

1. `CLASP_CREDENTIALS` - Your Google OAuth credentials
2. `CLASPRC_JSON` - Your clasp configuration with script ID

## Step-by-Step Setup

### 1. Get Your Clasp Credentials

First, make sure you're logged in to clasp locally:

```bash
clasp login
```

This will create a `.clasprc.json` file in your home directory with your Google OAuth credentials.

### 2. Find Your Credentials Files

#### On macOS/Linux:
```bash
# View your clasp credentials
cat ~/.clasprc.json

# View your project clasp config
cat .clasp.json
```

#### On Windows:
```cmd
# View your clasp credentials
type %USERPROFILE%\.clasprc.json

# View your project clasp config  
type .clasp.json
```

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

#### Secret 1: CLASP_CREDENTIALS
- **Name**: `CLASP_CREDENTIALS`
- **Value**: Copy the entire contents of your `~/.clasprc.json` file

Example format:
```json
{
  "token": {
    "access_token": "ya29.a0...",
    "refresh_token": "1//04...",
    "scope": "https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/script.webapp.deploy https://www.googleapis.com/auth/logging.read https://www.googleapis.com/auth/service.management https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/script.deployments https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/script.storage",
    "token_type": "Bearer",
    "expiry_date": 1234567890123
  },
  "oauth2ClientSettings": {
    "clientId": "123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-abcdefghijklmnopqrstuvwxyz",
    "redirectUri": "http://localhost"
  },
  "isLocalCreds": false
}
```

#### Secret 2: CLASPRC_JSON
- **Name**: `CLASPRC_JSON`  
- **Value**: Copy the entire contents of your `.clasp.json` file

Example format:
```json
{
  "scriptId": "1BxKfF2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3",
  "rootDir": "./src"
}
```

### 4. Security Notes

⚠️ **Important Security Considerations:**

- These secrets contain sensitive OAuth tokens that allow access to your Google Apps Script projects
- Never commit these files to your repository
- The `.clasprc.json` file is already in your `.gitignore`
- Consider using a dedicated Google account for automation if this is a shared project
- Tokens will expire periodically and may need to be refreshed

### 5. Alternative: Service Account (Advanced)

For production use, consider setting up a Google Cloud Service Account instead of using personal OAuth credentials:

1. Create a Google Cloud Project
2. Enable the Google Apps Script API
3. Create a Service Account with appropriate permissions
4. Use the service account key instead of personal OAuth credentials

This approach is more secure for production deployments but requires additional setup.

## Testing the Setup

1. Push a change to your main branch
2. Go to **Actions** tab in your GitHub repository
3. You should see a new workflow run
4. Check the logs to ensure deployment succeeds

## Troubleshooting

### Common Issues:

1. **"Invalid credentials"**: Double-check your `CLASP_CREDENTIALS` secret
2. **"Script not found"**: Verify your `CLASPRC_JSON` has the correct `scriptId`
3. **"Permission denied"**: Ensure your Google account has access to the script
4. **"Token expired"**: You may need to run `clasp login` again locally and update the secret

### Debugging Steps:

1. Check the GitHub Actions logs for specific error messages
2. Verify both secrets are set correctly in your repository settings
3. Test deployment locally with `clasp push` to ensure it works
4. Make sure your script ID in `.clasp.json` matches your actual Google Apps Script project

## Workflow Behavior

- **On Push to Main**: Automatically deploys to Google Apps Script
- **On Pull Request**: Only runs type checks (no deployment)
- **TypeScript Compilation**: Always checks for type errors before deployment
- **Force Push**: Uses `--force` flag to overwrite any changes in Google Apps Script editor
