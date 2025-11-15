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
        
        // Prepare prompt for AI
        const prompt = createAnalysisPrompt(tabs);
        
        let result;
        
        switch (llmProvider) {
            case 'openai':
                result = await analyzeWithOpenAI(prompt, apiKey, model || 'gpt-3.5-turbo');
                break;
            case 'ollama':
                result = await analyzeWithOllama(prompt, apiEndpoint || 'http://localhost:11434', model || 'llama2');
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

// Create prompt for AI analysis
function createAnalysisPrompt(tabs) {
    const tabList = tabs.map((tab, index) => 
        `${index + 1}. Title: "${tab.title}" | URL: ${tab.url}`
    ).join('\n');
    
    return `You are a browser tab organization assistant. Analyze the following browser tabs and suggest appropriate groups/tags for each tab. Consider the content type, domain, and purpose.

Tabs to analyze:
${tabList}

For each tab, suggest 1-3 relevant tags/groups that would help organize them. Tags should be concise (1-2 words) and descriptive.

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
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
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
        throw new Error('Ollama API request failed');
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
        throw new Error('Custom API request failed');
    }
    
    const data = await response.json();
    
    // Try to extract response from common API response formats
    return data.response || data.text || data.content || data.output || JSON.stringify(data);
}

// Parse AI suggestions from response
function parseAISuggestions(aiResponse, tabs) {
    try {
        // Try to extract JSON from the response
        let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
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
