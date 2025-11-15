# Quick Start Guide

## Installation

### Chrome
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The AI Tab Manager icon should appear in your extensions toolbar

### Firefox
1. Clone or download this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Navigate to the extension folder and select `manifest.json`
5. The extension is now loaded (note: temporary add-ons are removed when Firefox closes)

## Setup Your LLM Provider

### Option 1: OpenAI (Recommended for beginners)

1. Sign up at https://platform.openai.com/
2. Generate an API key at https://platform.openai.com/api-keys
3. Click the extension icon → ⚙️ Settings
4. Select "OpenAI" as provider
5. Paste your API key
6. Choose "GPT-3.5 Turbo" (cost-effective)
7. Click "Save Settings"
8. Click "Test Connection" to verify

### Option 2: Ollama (Free, runs locally)

1. Install Ollama from https://ollama.ai/
2. Open terminal and run: `ollama pull llama2`
3. Start Ollama: `ollama serve`
4. Click the extension icon → ⚙️ Settings
5. Select "Ollama" as provider
6. Endpoint: `http://localhost:11434` (default)
7. Model: `llama2` (or any model you pulled)
8. Click "Save Settings"
9. Click "Test Connection" to verify

Note on 403 errors from Ollama:

If the test fails with 403 (Forbidden), Ollama is likely blocking browser/extension origins. Start Ollama with CORS enabled:

```
$env:OLLAMA_ORIGINS="*"; ollama serve
```

Then try again.

### Option 3: Custom API

If you have your own LLM API endpoint:
1. Click the extension icon → ⚙️ Settings
2. Select "Custom API Endpoint"
3. Enter your API URL
4. Enter API key (if required)
5. Enter model name (if required)
6. Click "Save Settings"

## Using the Extension

### View All Your Tabs
- Click the extension icon
- See all tabs from all windows in one table
- Shows: Title, URL, Tags, and Actions

### Get AI Suggestions
1. Click "🤖 Analyze & Suggest Groups"
2. Wait a few seconds for AI to analyze
3. Suggested tags appear with yellow background
4. Tags are automatically saved

### Organize Your Tabs

**Manual Tagging:**
- Click 🏷️ icon next to any tab
- Enter tags separated by commas
- Click OK

**Bulk Tagging:**
- Check boxes next to multiple tabs
- Click "Group Selected"
- Enter a tag name
- All selected tabs get that tag

**Group into Windows:**
- Make sure tabs have tags
- Click "📁 Group by Tags"
- Extension creates separate windows for each tag

### Other Features

**Search:** Type in the search box to filter tabs

**Filter:** Use dropdown to show All/Ungrouped/Grouped tabs

**Quick Actions:**
- 👁️ Switch to tab
- 🏷️ Edit tags
- ✕ Close tab

**Bulk Actions:**
- Select multiple tabs
- Move to new window together
- Close selected tabs

## Tips

1. **First Time:** Start with just a few tabs open to test
2. **API Costs:** OpenAI GPT-3.5 Turbo is cheap (~$0.002 per request)
3. **Local Option:** Ollama is completely free but requires local installation
4. **Privacy:** Only tab titles/URLs are sent to LLM, no page content
5. **Refinement:** You can edit AI suggestions manually

## Troubleshooting

**Extension doesn't load:**
- Make sure all files are in the same folder
- Check browser console for errors (F12)

**AI analysis fails:**
- Verify your API key in Settings
- Click "Test Connection" to check
- For Ollama: Make sure it's running (`ollama serve`)

**No suggested tags:**
- Make sure you saved your LLM settings
- Try with just 2-3 tabs first
- Check browser console for errors

## Example Workflow

1. Open extension → Click "🤖 Analyze & Suggest Groups"
2. Review suggested tags (e.g., "work", "social", "shopping")
3. Edit any tags you want to change
4. Click "📁 Group by Tags"
5. Extension organizes tabs into separate windows by category
6. Much easier to find what you need!

## Privacy Note

This extension:
- ✅ Stores settings locally in your browser
- ✅ Sends only tab titles/URLs to your configured LLM
- ✅ Does not track your browsing
- ✅ Does not collect analytics
- ✅ Your API keys stay on your device

Enjoy organized tabs! 🎉
