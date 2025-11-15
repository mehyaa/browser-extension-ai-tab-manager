# AI Tab Manager

A powerful browser extension for Chrome and Firefox that uses AI to help you organize and manage your browser tabs intelligently.

## Features

### 📊 Tab Overview
- **Unified Tab View**: See all tabs from all windows in a single, organized table
- **Detailed Information**: View page titles, URLs, and assigned groups/tags
- **Multi-Window Support**: Manage tabs across multiple browser windows seamlessly

### 🤖 AI-Powered Organization
- **Smart Suggestions**: Use AI to automatically suggest relevant groups and tags for your tabs
- **Multiple LLM Support**:
  - OpenAI (GPT-3.5, GPT-4)
  - Google Gemini (1.5 Pro, 1.5 Flash)
  - Anthropic Claude (3.5 Sonnet/Haiku, 3 Opus)
  - Ollama (local AI models)
  - Custom API endpoints
- **Content Analysis**: AI analyzes actual page content, titles, and descriptions to suggest meaningful categorization (not just URLs)

### 🏷️ Tab Management
- **Grouping & Tagging**: Organize tabs with custom tags and groups
- **Auto-Grouping**: Automatically group tabs by tags into separate windows
- **Bulk Operations**: Select multiple tabs and perform actions on them at once
- **Search & Filter**: Quickly find tabs with search and filtering options

### ⚡ Additional Features
- Move tabs to new windows based on groups
- Close multiple tabs at once
- Quick tab switching
- Manual tag editing
- Real-time tab statistics

## Installation

### Chrome
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the extension directory

Note: For Firefox, you may need to use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) for permanent installation.

## Setup

### 1. Configure LLM Provider

After installing the extension:

1. Click the extension icon in your browser toolbar
2. Click the ⚙️ Settings button
3. Choose your preferred LLM provider

#### OpenAI Setup
1. Select "OpenAI" as the provider
2. Enter your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
3. Choose your preferred model (GPT-3.5 Turbo recommended for cost-effectiveness)
4. Click "Save Settings"

#### Ollama Setup (Local AI)
1. Install [Ollama](https://ollama.ai/) on your computer
2. Pull a model: `ollama pull llama2` (or mistral, codellama, etc.)
3. Make sure Ollama is running: `ollama serve`
4. In extension settings, select "Ollama"
5. Enter endpoint (default: `http://localhost:11434`)
6. Enter the model name you pulled
7. Click "Save Settings"

#### Custom API Setup
#### Google Gemini Setup
1. Select "Google Gemini" as the provider
2. Get an API key from Google AI Studio: https://aistudio.google.com/app/apikey
3. Enter your API key
4. Choose a model (e.g., `gemini-1.5-pro-latest` or `gemini-1.5-flash-latest`)
5. Click "Save Settings"

Notes:
- Endpoint is managed by the extension; only the API key and model are required.
- Ensure your Google account has access to the selected model family.

#### Anthropic Claude Setup
1. Select "Anthropic Claude" as the provider
2. Get an API key from Anthropic Console: https://console.anthropic.com/
3. Enter your API key
4. Choose a model (e.g., `claude-3-5-sonnet-20241022`)
5. Click "Save Settings"

Notes:
- Endpoint is managed by the extension; only the API key and model are required.
- Some models may have access restrictions depending on your account.

1. Select "Custom API Endpoint"
2. Enter your API endpoint URL
3. Enter API key if required
4. Enter model name if required
5. Click "Save Settings"

### 2. Test Your Configuration

Click the "Test Connection" button to verify your LLM provider is configured correctly.

## Usage

### Basic Operations

1. **Open the Extension**: Click the AI Tab Manager icon in your toolbar
2. **View All Tabs**: All your tabs are displayed in an organized table
3. **Search**: Use the search bar to find specific tabs
4. **Filter**: Use the dropdown to filter by grouped/ungrouped tabs

### AI Analysis

1. Click "🤖 Analyze & Suggest Groups"
2. Wait for AI to analyze your tabs (may take a few seconds)
3. Review the suggested tags (shown with yellow background)
4. Tags are automatically saved for future use

### Organizing Tabs

#### Manual Tagging
1. Click the 🏷️ icon next to any tab
2. Enter tags separated by commas
3. Tags are saved automatically

#### Bulk Operations
1. Check the boxes next to tabs you want to organize
2. Click "Group Selected" to add a common tag
3. Click "Move to New Window" to move selected tabs together

#### Auto-Grouping by Tags
1. Make sure your tabs have tags (use AI analysis or manual tagging)
2. Click "📁 Group by Tags"
3. Extension creates new windows for each tag group
4. Tabs with multiple tags appear in multiple windows

### Tab Actions
- 👁️ Switch to tab
- 🏷️ Edit tags
- ✕ Close tab

## Privacy & Security

- **Local Storage**: Tab tags and settings are stored locally in your browser
- **API Keys**: Your API keys are stored locally and never shared
- **Data Transmission**: Tab titles, descriptions, and visible page content are sent to your configured LLM provider for analysis. Special browser pages (chrome://, about:) are excluded.
- **No Tracking**: This extension does not track your browsing history or collect analytics

## Troubleshooting

### AI Analysis Not Working

1. Check your LLM provider settings in the options page
2. Verify your API key is correct
3. For Ollama, ensure it's running: `ollama serve`
4. Check browser console for error messages

### Ollama returns 403 (Forbidden)

- Reason: Recent Ollama versions block requests from browser origins (including Chrome/Firefox extensions) by default for security. When the extension calls `http://localhost:11434`, Ollama may respond with 403.
- Fix (Windows PowerShell):

```
$env:OLLAMA_ORIGINS="*"; ollama serve
```

- Persistent setup (optional):

```
setx OLLAMA_ORIGINS "*"
# If running as a Windows service, restart it (service name may be Ollama):
Stop-Service -Name Ollama
Start-Service -Name Ollama
```

- Tip: You can replace `*` with a stricter allowlist if supported by your Ollama version.

### Tabs Not Grouping

- Make sure tabs have tags assigned (either from AI or manually)
- Check that you have permission to create new windows
- Try refreshing the tab list

### Extension Not Loading

- Ensure manifest.json is in the root directory
- Check that all required files are present
- Look for errors in browser extension management page

## Development

### Project Structure
```
.
├── manifest.json         # Extension manifest (Manifest V3)
├── popup.html           # Main popup interface
├── popup.css            # Popup styles
├── popup.js             # Popup logic and UI handling
├── background.js        # Background service worker & LLM integration
├── content.js           # Content script for page content extraction
├── options.html         # Settings page
├── options.css          # Settings page styles
├── options.js           # Settings page logic
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Technologies Used
- Manifest V3 (Chrome/Firefox compatible)
- Vanilla JavaScript (no frameworks)
- Chrome Extension APIs
- Multiple LLM API integrations

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

See LICENSE file for details.

## Roadmap

Future features being considered:
- Duplicate tab detection and removal
- Tab session saving and restoration
- Keyboard shortcuts
- Tab preview on hover
- Export/import tab collections
- Sync settings across devices
- More LLM provider integrations

## Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section
2. Open an issue on GitHub
3. Include browser version, extension version, and error messages

---

Built with ❤️ for better tab management