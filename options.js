// Options/Settings Page Script

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('llmProvider').addEventListener('change', onProviderChange);
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('testBtn').addEventListener('click', testConnection);
}

// Load saved settings
async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get([
            'llmProvider',
            'apiKey',
            'apiEndpoint',
            'model'
        ]);
        
        if (settings.llmProvider) {
            document.getElementById('llmProvider').value = settings.llmProvider;
            showProviderSettings(settings.llmProvider);
            
            // Load provider-specific settings
            switch (settings.llmProvider) {
                case 'openai':
                    if (settings.apiKey) {
                        document.getElementById('openaiApiKey').value = settings.apiKey;
                    }
                    if (settings.model) {
                        document.getElementById('openaiModel').value = settings.model;
                    }
                    break;
                    
                case 'ollama':
                    if (settings.apiEndpoint) {
                        document.getElementById('ollamaEndpoint').value = settings.apiEndpoint;
                    }
                    if (settings.model) {
                        document.getElementById('ollamaModel').value = settings.model;
                    }
                    break;
                    
                case 'custom':
                    if (settings.apiEndpoint) {
                        document.getElementById('customEndpoint').value = settings.apiEndpoint;
                    }
                    if (settings.apiKey) {
                        document.getElementById('customApiKey').value = settings.apiKey;
                    }
                    if (settings.model) {
                        document.getElementById('customModel').value = settings.model;
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
function showProviderSettings(provider) {
    // Hide all provider settings
    document.querySelectorAll('.provider-settings').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show selected provider settings
    if (provider === 'openai') {
        document.getElementById('openaiSettings').classList.remove('hidden');
    } else if (provider === 'ollama') {
        document.getElementById('ollamaSettings').classList.remove('hidden');
    } else if (provider === 'custom') {
        document.getElementById('customSettings').classList.remove('hidden');
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
        
        let settings = {
            llmProvider: provider
        };
        
        // Get provider-specific settings
        switch (provider) {
            case 'openai':
                const openaiApiKey = document.getElementById('openaiApiKey').value.trim();
                if (!openaiApiKey) {
                    showStatus('Please enter your OpenAI API key', 'error');
                    return;
                }
                settings.apiKey = openaiApiKey;
                settings.model = document.getElementById('openaiModel').value;
                break;
                
            case 'ollama':
                const ollamaEndpoint = document.getElementById('ollamaEndpoint').value.trim() || 'http://localhost:11434';
                const ollamaModel = document.getElementById('ollamaModel').value.trim();
                if (!ollamaModel) {
                    showStatus('Please enter the Ollama model name', 'error');
                    return;
                }
                settings.apiEndpoint = ollamaEndpoint;
                settings.model = ollamaModel;
                break;
                
            case 'custom':
                const customEndpoint = document.getElementById('customEndpoint').value.trim();
                if (!customEndpoint) {
                    showStatus('Please enter the API endpoint', 'error');
                    return;
                }
                settings.apiEndpoint = customEndpoint;
                settings.apiKey = document.getElementById('customApiKey').value.trim();
                settings.model = document.getElementById('customModel').value.trim();
                break;
        }
        
        await chrome.storage.local.set(settings);
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
            'apiKey',
            'apiEndpoint',
            'model'
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
