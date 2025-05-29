# GroupMe Calendar Sync

A Google Apps Script project that automatically syncs GroupMe events to your Google Calendar.

## Features

- 🔄 **Automatic Sync**: Syncs GroupMe events to Google Calendar
- 📅 **Two-way Management**: Creates, updates, and deletes calendar events based on GroupMe changes
- 🏷️ **Event Prefixing**: Adds configurable prefixes to synced events for easy identification
- 🗓️ **Configurable Sync Window**: Set how many days ahead to sync events
- 🔍 **Smart Updates**: Only updates events when necessary to avoid spam
- 🧹 **Cleanup**: Automatically removes calendar events that no longer exist in GroupMe

## Prerequisites

- Google account with access to Google Apps Script
- GroupMe account with API access
- Node.js (for development)

## Setup

### 1. Install Dependencies

```bash
npm install -g @google/clasp
npm install
```

### 2. Authentication

Login to Google Apps Script:

```bash
clasp login
```

### 3. Create or Clone the Project

#### Option A: Create New Project
```bash
clasp create --type standalone --rootDir ./src
```

#### Option B: Use Existing Project
1. Get your script ID from the Google Apps Script editor URL
2. Update `.clasp.json` with your script ID:
   ```json
   {
     "scriptId": "YOUR_ACTUAL_SCRIPT_ID",
     "rootDir": "./src"
   }
   ```

### 4. Configure Script Properties

In the Google Apps Script editor, go to **Project Settings** → **Script Properties** and add:

| Property | Description | Example |
|----------|-------------|---------|
| `GROUPME_GROUP_ID` | Your GroupMe group/conversation ID | `12345678` |
| `GROUPME_ACCESS_TOKEN` | Your GroupMe API access token | `abc123...` |
| `GOOGLE_CALENDAR_ID` | Target Google Calendar ID | `your-email@gmail.com` |
| `SYNC_DAYS_AHEAD` | Days ahead to sync (optional, default: 30) | `30` |
| `EVENT_PREFIX` | Prefix for synced events (optional, default: "[GroupMe] ") | `[Team Events] ` |

### 5. Deploy

Deploy your code to Google Apps Script:

```bash
npm run deploy
```

## Usage

### Manual Execution

1. Open your project in Google Apps Script: `npm run open`
2. Select the `syncGroupMeCalendar` function
3. Click **Run**

### Automated Execution

Set up a time-driven trigger:

1. In Google Apps Script, go to **Triggers** (clock icon)
2. Click **Add Trigger**
3. Configure:
   - Function: `syncGroupMeCalendar`
   - Deployment: Head
   - Event source: Time-driven
   - Type: Timer (e.g., every hour, daily)

## Development

### Watch Mode

Automatically push changes as you develop:

```bash
npm run watch
```

### View Logs

Check execution logs:

```bash
npm run logs
```

### Pull Remote Changes

Pull changes from Google Apps Script:

```bash
npm run pull
```

## Getting GroupMe API Credentials

### 1. Get GroupMe Access Token

1. Go to [GroupMe Developers](https://dev.groupme.com/)
2. Sign in with your GroupMe account
3. Click **Access Token** in the top right
4. Copy your access token

### 2. Find Group ID

1. Use the GroupMe API to list your groups:
   ```bash
   curl -X GET "https://api.groupme.com/v3/groups?token=YOUR_ACCESS_TOKEN"
   ```
2. Find your group in the response and copy its `id`

Alternatively, you can find the group ID in the GroupMe web app URL when viewing the group.

## Configuration Options

All configuration is done through Google Apps Script Properties:

- **GROUPME_GROUP_ID**: The ID of the GroupMe group to sync events from
- **GROUPME_ACCESS_TOKEN**: Your GroupMe API access token  
- **GOOGLE_CALENDAR_ID**: The ID of the Google Calendar to sync events to
- **SYNC_DAYS_AHEAD**: Number of days in the future to sync events (default: 30)
- **EVENT_PREFIX**: Text to prepend to all synced event titles (default: "[GroupMe] ")

## Troubleshooting

### Common Issues

1. **"GroupMe API error"**: Check your access token and group ID
2. **"Google Calendar not found"**: Verify your calendar ID is correct
3. **"Permission denied"**: Ensure proper OAuth scopes are enabled

### Debugging

- Check the execution logs in Google Apps Script for detailed error messages
- Use `npm run logs` to view recent execution logs from the command line
- Verify all script properties are set correctly

## Project Structure

```
├── src/
│   ├── Code.ts              # Main TypeScript source code
│   └── appsscript.json      # Apps Script manifest
├── .clasp.json              # Clasp configuration
├── package.json             # Node.js dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
