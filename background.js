// Background Service Worker for AI Tab Manager

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeTabsWithAI') {
        analyzeTabsWithAI(request.tabs, request.settings)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
});

// Analyze tabs using AI
async function analyzeTabsWithAI(tabs, settings) {
    try {
        const { llmProvider, apiKey, apiEndpoint, model } = settings;

        // Extract content from tabs
        const tabsWithContent = await extractTabsContent(tabs);

        // Prepare prompt for AI
        const prompt = createAnalysisPrompt(tabsWithContent);

        let result;

        switch (llmProvider) {
            case 'openai':
                result = await analyzeWithOpenAI(prompt, apiKey, model || 'gpt-3.5-turbo');
                break;
            case 'ollama':
                result = await analyzeWithOllama(prompt, apiEndpoint || 'http://localhost:11434', model || 'llama2');
                break;
            case 'gemini':
                result = await analyzeWithGemini(prompt, apiKey, model || 'gemini-1.5-pro-latest');
                break;
            case 'claude':
                result = await analyzeWithClaude(prompt, apiKey, model || 'claude-3-5-sonnet-20241022');
                break;
            case 'custom':
                result = await analyzeWithCustomAPI(prompt, apiEndpoint, apiKey, model);
                break;
            default:
                throw new Error('Unsupported LLM provider');
        }

        // Parse AI response and extract tags
        const suggestions = parseAISuggestions(result, tabs);

        return {
            success: true,
            suggestions: suggestions
        };
    } catch (error) {
        console.error('Error in AI analysis:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Extract content from tabs
async function extractTabsContent(tabs) {
    const tabsWithContent = [];

    for (const tab of tabs) {
        let content = '';
        let metadata = {
            title: tab.title,
            url: tab.url
        };

        // Try to extract content from the tab
        try {
            // Skip special URLs that don't support content scripts
            if (tab.url.startsWith('chrome://') ||
                tab.url.startsWith('about:') ||
                tab.url.startsWith('edge://') ||
                tab.url.startsWith('chrome-extension://')) {
                content = `Special page: ${tab.title}`;
            } else {
                // Send message to content script to extract content
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });

                if (response && response.success) {
                    metadata = response.metadata;
                    content = response.content;
                } else {
                    // Fallback if content extraction fails
                    content = `Title: ${tab.title}`;
                }
            }
        } catch (error) {
            // If content script fails, use title as fallback
            console.log(`Failed to extract content from tab ${tab.id}:`, error.message);
            content = `Title: ${tab.title}`;
        }

        tabsWithContent.push({
            id: tab.id,
            title: metadata.title,
            content: content,
            description: metadata.description || '',
            url: tab.url
        });
    }

    return tabsWithContent;
}

// Create prompt for AI analysis
function createAnalysisPrompt(tabsWithContent) {
    const tabList = tabsWithContent.map((tab, index) => {
        let tabInfo = `${index + 1}. Title: "${tab.title}"`;

        if (tab.description) {
            tabInfo += `\n   Description: ${tab.description}`;
        }

        if (tab.content && tab.content.length > 0) {
            // Truncate content if too long
            const contentPreview = tab.content.length > 5000
                ? tab.content.substring(0, 5000) + '...'
                : tab.content;
            tabInfo += `\n   Content: ${contentPreview}`;
        }

        return tabInfo;
    }).join('\n\n');

    return `You are a browser tab organization assistant. Analyze the following browser tabs based on their titles and content, and suggest appropriate groups/tags for each tab. Consider the content type, topic, and purpose.

Tabs to analyze:
${tabList}

For each tab, suggest 1-3 relevant tags/groups that would help organize them. Tags should be concise (1-2 words) and descriptive. Base your suggestions on the actual content, not just the URL.

Respond in JSON format:
{
  "suggestions": [
    {
      "tabIndex": 1,
      "tags": ["work", "documentation"]
    },
    {
      "tabIndex": 2,
      "tags": ["social", "news"]
    }
  ]
}

Only respond with the JSON, no additional text.`;
}

// Analyze with OpenAI API
async function analyzeWithOpenAI(prompt, apiKey, model) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that analyzes browser tabs and suggests organization tags.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        let errorMessage = 'OpenAI API request failed';
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                const error = await response.json();
                errorMessage = error.error?.message || errorMessage;
            } catch (jsonErr) {
                errorMessage += ` (failed to parse error response: ${jsonErr.message})`;
            }
        } else {
            try {
                const text = await response.text();
                errorMessage += ` (status ${response.status}): ${text.substring(0, 200)}`;
            } catch (textErr) {
                errorMessage += ` (status ${response.status})`;
            }
        }
        throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (jsonErr) {
            throw new Error('Failed to parse OpenAI response as JSON: ' + jsonErr.message);
        }
    } else {
        throw new Error('OpenAI API did not return JSON');
    }

    if (!Array.isArray(data.choices) || data.choices.length === 0 || !data.choices[0].message || typeof data.choices[0].message.content !== 'string') {
        throw new Error('OpenAI API response missing choices or message content');
    }

    return data.choices[0].message.content;
}

// Analyze with Google Gemini API
async function analyzeWithGemini(prompt, apiKey, model) {
    if (!apiKey) {
        throw new Error('Gemini API key is required');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: 'You are a helpful assistant that analyzes browser tabs and suggests organization tags.' },
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000
            }
        })
    });

    if (!response.ok) {
        let msg = `Gemini API request failed (status ${response.status})`;
        try {
            const err = await response.text();
            msg += `: ${err.substring(0, 300)}`;
        } catch (_) { /* ignore */ }
        throw new Error(msg);
    }

    const data = await response.json();

    // Expected shape: candidates[0].content.parts[].text
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join(' ').trim();
    if (!text) {
        throw new Error('Gemini API response missing text content');
    }
    return text;
}

// Analyze with Anthropic Claude API
async function analyzeWithClaude(prompt, apiKey, model) {
    if (!apiKey) {
        throw new Error('Claude API key is required');
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 2000,
            temperature: 0.7,
            system: 'You are a helpful assistant that analyzes browser tabs and suggests organization tags.',
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        let msg = `Claude API request failed (status ${response.status})`;
        try {
            const err = await response.text();
            msg += `: ${err.substring(0, 300)}`;
        } catch (_) { /* ignore */ }
        throw new Error(msg);
    }

    const data = await response.json();
    // Expected: data.content is an array of blocks, first text contains response
    const textBlocks = Array.isArray(data?.content) ? data.content.filter(b => b.type === 'text').map(b => b.text) : [];
    const text = (textBlocks[0] || '').trim();
    if (!text) {
        throw new Error('Claude API response missing text content');
    }
    return text;
}

// Analyze with Ollama API
async function analyzeWithOllama(prompt, endpoint, model) {
    const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false
        })
    });

    if (!response.ok) {
        let errorText;
        try {
            errorText = await response.text();
        } catch (e) {
            errorText = '[Unable to read response body]';
        }
        throw new Error(`Ollama API request failed (status ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.response;
}

// Analyze with Custom API
async function analyzeWithCustomAPI(prompt, endpoint, apiKey, model) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = {
        prompt: prompt
    };

    if (model) {
        body.model = model;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Custom API request failed (status ${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Try to extract response from common API response formats
    return data.response || data.text || data.content || data.output || JSON.stringify(data);
}

// Parse AI suggestions from response
function parseAISuggestions(aiResponse, tabs) {
    try {
        // Try to extract JSON from the response
        let jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            // Try to parse the whole response as JSON
            jsonMatch = [aiResponse];
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const suggestions = [];

        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            parsed.suggestions.forEach(suggestion => {
                const tabIndex = suggestion.tabIndex - 1; // Convert to 0-based index
                if (tabIndex >= 0 && tabIndex < tabs.length && suggestion.tags) {
                    suggestions.push({
                        tabId: tabs[tabIndex].id,
                        tags: suggestion.tags
                    });
                }
            });
        }

        return suggestions;
    } catch (error) {
        console.error('Error parsing AI response:', error);
        console.log('AI Response:', aiResponse);

        // Fallback: try to extract tags from natural language response
        return extractTagsFromNaturalLanguage(aiResponse, tabs);
    }
}

// Fallback: Extract tags from natural language response
function extractTagsFromNaturalLanguage(response, tabs) {
    const suggestions = [];

    // Try to find patterns like "Tab 1: tag1, tag2"
    const lines = response.split('\n');
    lines.forEach(line => {
        const match = line.match(/(?:tab|#)\s*(\d+)[:\s]+([a-zA-Z0-9\s,\-_]+)/i);
        if (match) {
            const tabIndex = parseInt(match[1]) - 1;
            const tagsStr = match[2];
            const tags = tagsStr.split(',')
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag.length > 0 && tag.length < 20)
                .slice(0, 3); // Max 3 tags

            if (tabIndex >= 0 && tabIndex < tabs.length && tags.length > 0) {
                suggestions.push({
                    tabId: tabs[tabIndex].id,
                    tags: tags
                });
            }
        }
    });

    return suggestions;
}

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('AI Tab Manager installed');
        // Set default settings
        chrome.storage.local.set({
            llmProvider: 'openai',
            model: 'gpt-3.5-turbo'
        });
    }
});

console.log('AI Tab Manager background service worker loaded');
