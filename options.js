// Options/Settings Page Script

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('llmProvider').addEventListener('change', onProviderChange);
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('testBtn').addEventListener('click', testConnection);

    // Model refresh buttons
    document.getElementById('refreshOpenaiModels').addEventListener('click', () => fetchModels('openai'));
    document.getElementById('refreshOllamaModels').addEventListener('click', () => fetchModels('ollama'));
    document.getElementById('refreshGeminiModels').addEventListener('click', () => fetchModels('gemini'));
    document.getElementById('refreshClaudeModels').addEventListener('click', () => fetchModels('claude'));

    // Theme selection
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', async (e) => {
            const value = e.target.value;
            await chrome.storage.local.set({ theme: value });
            // Reinitialize to ensure system listener is attached when needed
            if (window.Theme && typeof window.Theme.applyTheme === 'function') {
                window.Theme.applyTheme(value);
                if (typeof window.Theme.initTheme === 'function' && value === 'system') {
                    window.Theme.initTheme();
                }
            }
        });
    }
}

// Load saved settings
async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get([
            'llmProvider',
            'llmOptions',
            'theme'
        ]);

        // Theme
        const theme = settings.theme || 'system';
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = theme;
        }

        if (settings.llmProvider) {
            document.getElementById('llmProvider').value = settings.llmProvider;

            const llmOptions = settings.llmOptions ?? {};

            showProviderSettings(settings.llmProvider, llmOptions);

            // Load provider-specific settings
            switch (settings.llmProvider) {
                case 'openai':
                    if (llmOptions.apiKey) {
                        document.getElementById('openaiApiKey').value = llmOptions.apiKey;
                    }
                    if (llmOptions.model) {
                        document.getElementById('openaiModel').value = llmOptions.model;
                    }
                    break;

                case 'ollama':
                    if (llmOptions.apiEndpoint) {
                        document.getElementById('ollamaEndpoint').value = llmOptions.apiEndpoint;
                    }
                    if (llmOptions.model) {
                        document.getElementById('ollamaModel').value = llmOptions.model;
                    }
                    break;

                case 'gemini':
                    if (llmOptions.apiKey) {
                        document.getElementById('geminiApiKey').value = llmOptions.apiKey;
                    }
                    if (llmOptions.model) {
                        document.getElementById('geminiModel').value = llmOptions.model;
                    }
                    break;

                case 'claude':
                    if (llmOptions.apiKey) {
                        document.getElementById('claudeApiKey').value = llmOptions.apiKey;
                    }
                    if (llmOptions.model) {
                        document.getElementById('claudeModel').value = llmOptions.model;
                    }
                    break;

                case 'custom':
                    if (llmOptions.apiEndpoint) {
                        document.getElementById('customEndpoint').value = llmOptions.apiEndpoint;
                    }
                    if (llmOptions.apiKey) {
                        document.getElementById('customApiKey').value = llmOptions.apiKey;
                    }
                    if (llmOptions.model) {
                        document.getElementById('customModel').value = llmOptions.model;
                    }
                    break;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Handle provider change
function onProviderChange(event) {
    const provider = event.target.value;
    showProviderSettings(provider);
}

// Show provider-specific settings
function showProviderSettings(provider, options) {
    document.querySelectorAll('.provider-settings').forEach(el => el.classList.add('hidden'));

    document.getElementById(`${provider}Settings`).classList.remove('hidden');

    if (options) {
        populateModelDropdown(provider, options.availableModels || []);
    }
}

// Save settings
async function saveSettings() {
    try {
        const provider = document.getElementById('llmProvider').value;

        if (!provider) {
            showStatus('Please select an LLM provider', 'error');
            return;
        }

        const theme = (document.getElementById('themeSelect')?.value) || 'system';

        let settings = {
            llmProvider: provider,
            llmOptions: {}
        };

        // Get provider-specific settings
        switch (provider) {
            case 'openai':
                const openaiApiKey = document.getElementById('openaiApiKey').value.trim();

                if (!openaiApiKey) {
                    showStatus('Please enter your OpenAI API key', 'error');
                    return;
                }

                settings.llmOptions.apiKey = openaiApiKey;
                settings.llmOptions.model = document.getElementById('openaiModel').value;
                settings.llmOptions.availableModels = await fetchOpenAIModels();

                break;

            case 'ollama':
                const ollamaEndpoint = document.getElementById('ollamaEndpoint').value.trim() || 'http://localhost:11434';
                const ollamaModel = document.getElementById('ollamaModel').value.trim();

                if (!ollamaModel) {
                    showStatus('Please select an Ollama model', 'error');
                    return;
                }

                settings.llmOptions.apiEndpoint = ollamaEndpoint;
                settings.llmOptions.model = ollamaModel;

                settings.llmOptions.availableModels = await fetchOllamaModels();

                break;

            case 'gemini':
                const geminiApiKey = document.getElementById('geminiApiKey').value.trim();

                if (!geminiApiKey) {
                    showStatus('Please enter your Gemini API key', 'error');
                    return;
                }

                settings.llmOptions.apiKey = geminiApiKey;
                settings.llmOptions.model = document.getElementById('geminiModel').value;
                settings.llmOptions.availableModels = await fetchGeminiModels();

                break;

            case 'claude':
                const claudeApiKey = document.getElementById('claudeApiKey').value.trim();

                if (!claudeApiKey) {
                    showStatus('Please enter your Claude API key', 'error');
                    return;
                }

                settings.llmOptions.apiKey = claudeApiKey;
                settings.llmOptions.model = document.getElementById('claudeModel').value;
                settings.llmOptions.availableModels = await fetchClaudeModels();

                break;

            case 'custom':
                const customEndpoint = document.getElementById('customEndpoint').value.trim();

                if (!customEndpoint) {
                    showStatus('Please enter the API endpoint', 'error');
                    return;
                }

                settings.llmOptions.apiEndpoint = customEndpoint;
                settings.llmOptions.apiKey = document.getElementById('customApiKey').value.trim();
                settings.llmOptions.model = document.getElementById('customModel').value.trim();

                break;
        }

        await chrome.storage.local.set({ ...settings, theme });
        if (window.Theme && typeof window.Theme.applyTheme === 'function') {
            window.Theme.applyTheme(theme);
            if (typeof window.Theme.initTheme === 'function' && theme === 'system') {
                window.Theme.initTheme();
            }
        }
        showStatus('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Failed to save settings: ' + error.message, 'error');
    }
}

// Test connection to LLM provider
async function testConnection() {
    try {
        const provider = document.getElementById('llmProvider').value;

        if (!provider) {
            showStatus('Please select and save a provider first', 'error');
            return;
        }

        showStatus('Testing connection...', '');

        const settings = await chrome.storage.local.get([
            'llmProvider',
            'llmOptions'
        ]);

        // Create a simple test prompt
        const testTabs = [
            {
                id: 1,
                title: 'GitHub - Code Repository',
                url: 'https://github.com'
            },
            {
                id: 2,
                title: 'Stack Overflow - Programming Q&A',
                url: 'https://stackoverflow.com'
            }
        ];

        // Send test request to background script
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeTabsWithAI',
            tabs: testTabs,
            settings: settings
        });

        if (response.success) {
            showStatus('Connection test successful! ✓', 'success');
        } else {
            showStatus('Connection test failed: ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        showStatus('Connection test failed: ' + error.message, 'error');
    }
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + type;

    // Clear message after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status-message';
        }, 5000);
    }
}

// Fetch available models from the LLM provider
async function fetchModels(provider) {
    const btnId = `refresh${provider.charAt(0).toUpperCase() + provider.slice(1)}Models`;
    const btn = document.getElementById(btnId);
    const statusId = `${provider}ModelStatus`;
    const statusEl = document.getElementById(statusId);

    // Set loading state
    btn.disabled = true;
    btn.classList.add('loading');
    statusEl.textContent = 'Fetching models...';
    statusEl.style.color = '#666';

    try {
        let models = [];

        switch (provider) {
            case 'openai':
                models = await fetchOpenAIModels();
                break;
            case 'ollama':
                models = await fetchOllamaModels();
                break;
            case 'gemini':
                models = await fetchGeminiModels();
                break;
            case 'claude':
                models = await fetchClaudeModels();
                break;
        }

        if (models && models.length > 0) {
            populateModelDropdown(provider, models);
            statusEl.textContent = `Found ${models.length} model(s)`;
            statusEl.style.color = '#48bb78';
        } else {
            statusEl.textContent = 'No models found';
            statusEl.style.color = '#f56565';
        }
    } catch (error) {
        console.error(`Error fetching ${provider} models:`, error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.style.color = '#f56565';
    } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
    }
}

// Populate model dropdown with fetched models
function populateModelDropdown(provider, models) {
    const selectId = `${provider}Model`;
    const select = document.getElementById(selectId);
    const currentValue = select.value;

    // Clear existing options
    select.innerHTML = '';

    // Add models
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        select.appendChild(option);
    });

    // Restore previous selection if still available
    if (currentValue && models.find(m => m.id === currentValue)) {
        select.value = currentValue;
    }
}

// Fetch OpenAI models
async function fetchOpenAIModels() {
    const apiKey = document.getElementById('openaiApiKey').value.trim();

    if (!apiKey) {
        throw new Error('Please enter your OpenAI API key first');
    }

    const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Failed to fetch models (${response.status})`);
    }

    const data = await response.json();

    // Filter for GPT models suitable for chat
    const chatModels = data.data
        .filter(model => model.id.includes('gpt') && !model.id.includes('instruct'))
        .sort((a, b) => {
            // Sort by priority: gpt-4 models first, then gpt-3.5
            const priority = (id) => {
                if (id.includes('gpt-4-turbo')) return 1;
                if (id.includes('gpt-4')) return 2;
                if (id.includes('gpt-3.5-turbo')) return 3;
                return 4;
            };
            return priority(a.id) - priority(b.id);
        })
        .map(model => ({
            id: model.id,
            name: model.id
        }));

    return chatModels;
}

// Fetch Ollama models
async function fetchOllamaModels() {
    const endpoint = document.getElementById('ollamaEndpoint').value.trim() || 'http://localhost:11434';

    const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET'
    });

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error(
                'Ollama returned 403 (Forbidden). Recent Ollama versions block browser origins by default. Allow your extension origin by starting Ollama with CORS enabled, e.g. in PowerShell:\n\n    $env:OLLAMA_ORIGINS="*"; ollama serve\n\nThen retry fetching models.'
            );
        }
        throw new Error(`Failed to connect to Ollama (${response.status}). Make sure Ollama is running.`);
    }

    const data = await response.json();

    if (!data.models || data.models.length === 0) {
        throw new Error('No models found. Pull a model using: ollama pull <model-name>');
    }

    return data.models.map(model => ({
        id: model.name,
        name: `${model.name} (${(model.size / 1e9).toFixed(1)}GB)`
    }));
}

// Fetch Gemini models
async function fetchGeminiModels() {
    const apiKey = document.getElementById('geminiApiKey').value.trim();

    if (!apiKey) {
        throw new Error('Please enter your Gemini API key first');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
        method: 'GET'
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Failed to fetch models (${response.status})`);
    }

    const data = await response.json();

    // Filter for models that support generateContent
    const validModels = data.models
        .filter(model =>
            model.supportedGenerationMethods?.includes('generateContent') &&
            model.name.includes('gemini')
        )
        .map(model => {
            const modelId = model.name.replace('models/', '');
            return {
                id: modelId,
                name: modelId
            };
        });

    return validModels;
}

// Fetch Claude models
async function fetchClaudeModels() {
    const apiKey = document.getElementById('claudeApiKey').value.trim();

    if (!apiKey) {
        throw new Error('Please enter your Claude API key first');
    }

    // Anthropic doesn't have a public models endpoint, so we return the known models
    // This could be enhanced to actually test which models are available
    const knownModels = [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)' },
        { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet (June 2024)' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Latest)' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ];

    // Verify the API key works by making a test request
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }]
            })
        });

        // If we get a 2xx or 4xx response (not 401/403), the key format is valid
        if (response.status === 401 || response.status === 403) {
            throw new Error('Invalid API key');
        }
    } catch (error) {
        if (error.message === 'Invalid API key') {
            throw error;
        }
        // Other errors (like network) are okay for this validation
    }

    return knownModels;
}
