# AI Tab Manager - Agent Instructions

This `AGENTS.md` file provides authoritative instructions and context for AI agents working on the **AI Tab Manager** browser extension.

## Project Overview
**Name:** AI Tab Manager
**Type:** Browser Extension (Chrome/Firefox)
**Manifest:** V3
**Purpose:** Manage and organize browser tabs using AI. It groups tabs by topic, tags them, and allows for bulk management (close, move to window).
**Key Features:**
- Unified tab view across all windows.
- AI-powered analysis to suggest tags/groups (OpenAI, Gemini, Claude, Ollama, Custom).
- Bulk tab operations (group, move, close).
- Local storage for privacy.

## Technology Stack
- **Languages:** HTML5, CSS3, JavaScript (ES6+).
- **Frameworks:** None (Vanilla JS).
- **Platform:** WebExtensions API (`chrome.*`).
- **Build System:** None (Direct usage of source files).
- **External Dependencies:** None (No npm/yarn, no bundlers).

## Project Structure
```
.
├── manifest.json         # Configuration and permissions (Manifest V3)
├── background.js         # Service worker: AI logic, message handling
├── content.js            # Content script: Extracts page content for analysis
├── extension.html        # Main UI (Popup/Tab Manager interface)
├── extension.js          # Main UI logic
├── extension.css         # Main UI styles
├── options.html          # Settings page
├── options.js            # Settings logic
├── options.css           # Settings styles
├── theme.js              # Theme handling (Light/Dark/System)
└── icons/                # Extension icons
```

## Development Environment & Setup
- **No Build Step:** Source files are loaded directly.
- **Installation:**
    - **Chrome**: `chrome://extensions/` -> Developer Mode -> Load Unpacked.
    - **Firefox**: `about:debugging` -> This Firefox -> Load Temporary Add-on.
- **Debugging:**
    - **UI:** Right-click extension page -> Inspect.
    - **Background:** `chrome://extensions/` -> Inspect views: "service worker".
    - **Popup:** Right-click extension icon -> Inspect popup.

## Code Style & Conventions
- **Async/Await:** Used extensively for asynchronous Chrome API calls and fetch requests.
- **Error Handling:**
  - `try/catch` blocks around API calls.
  - `showError()` helper in UI files for user feedback.
  - Console logging for debugging.
- **Message Passing:** Used for communication between UI and Background worker.
  - Pattern: `chrome.runtime.sendMessage({ action: '...' })` -> `chrome.runtime.onMessage.addListener`.
- **Styling:**
  - Vanilla CSS.
  - CSS Variables for theming (light/dark mode).
- **Privacy:** Store sensitive data (API keys) in `chrome.storage.local` ONLY.
- **Formatting:** Standard JS formatting, 4-space indentation preferred (or match existing).
- **No Build Step:** Code is written to be runnable directly by the browser. Do not introduce compilation steps (TypeScript, Webpack) unless explicitly requested and configured.

## Key Components & Architecture

### 1. Background Service Worker (`background.js`)
- **Role:** Central hub for heavy lifting and API calls.
- **Responsibilities:**
  - Listen for messages from the UI (`extension.js`).
  - Perform AI analysis by calling external APIs (OpenAI, Gemini, etc.).
  - Handle `chrome.action.onClicked` to open the main extension page.
  - Fallback content extraction if content scripts fail.
- **Key Functions:**
  - `analyzeTabsWithAI(tabs, settings)`: Orchestrates the analysis.
  - `extractTabsContent(tabs)`: Gathers title/url/content from tabs.
  - `analyzeWith[Provider]`: Specific implementations for each LLM provider.

### 2. Main UI (`extension.html` / `extension.js`)
- **Role:** The primary interface for the user.
- **Responsibilities:**
  - Display list of tabs from all windows.
  - Manage selection state (`selectedTabs` Set).
  - Trigger actions (Group, Move, Close, Analyze).
  - Render tags and groups.
  - Persist tags to `chrome.storage.local`.
- **Data Flow:**
  - Loads tabs via `chrome.windows.getAll({ populate: true })`.
  - Merges with stored tags from `chrome.storage.local`.
  - Sends `analyzeTabsWithAI` message to `background.js`.

### 3. Content Script (`content.js`)
- **Role:** Extract page content.
- **Responsibilities:**
  - Listen for `extractContent` message.
  - Return page title, meta description, and main body text.
  - Used to give the AI more context than just the URL/Title.

### 4. Options & Storage
- **Storage:** `chrome.storage.local` is used for:
  - `llmProvider`: Selected provider string.
  - `llmOptions`: API keys and model names.
  - `tabTags`: Dictionary mapping `tabId` -> `tags[]`.
  - `theme`: UI theme preference.
- **Privacy:** API keys and tab data are stored locally.

## AI Integration Details
- **Providers:** OpenAI, Gemini, Claude, Ollama, Custom.
- **Prompt Engineering:**
  - System prompt defines the persona.
  - User prompt lists tabs with Title, URL, and truncated Content.
  - Output format requested is strictly JSON.
- **Flow:** UI -> Message -> Background -> LLM API -> JSON Response -> UI Update.
- **Resilience:**
  - The code attempts to parse JSON from the AI response.
  - Fallback regex parsing (`extractTagsFromNaturalLanguage`) is implemented if JSON parsing fails.

## Boundaries & Limitations
- **Do Not:** Introduce build tools (Webpack, Vite) unless explicitly requested.
- **Do Not:** Commit API keys or secrets.
- **Do Not:** Change `manifest.json` permissions without verifying necessity.
- **Do Not:** Use external CDNs for code; keep everything local/packed.

## Common Tasks
- **Add Provider:** Update `manifest.json` permissions, add logic to `background.js`, add UI to `options.html`.
- **Fix UI:** Modify `extension.html` and `extension.css`.
- **Enhance AI:** Improve prompts in `background.js`.
