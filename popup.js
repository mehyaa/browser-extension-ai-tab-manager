// Tab Manager - Popup Script

let allTabs = [];
let selectedTabs = new Set();

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadTabs();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', loadTabs);
    document.getElementById('settingsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    document.getElementById('analyzeBtn').addEventListener('click', analyzeTabsWithAI);
    document.getElementById('groupByTagBtn').addEventListener('click', groupTabsByTags);

    document.getElementById('searchInput').addEventListener('input', filterTabs);
    document.getElementById('filterSelect').addEventListener('change', filterTabs);

    document.getElementById('selectAll').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.tab-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            if (e.target.checked) {
                selectedTabs.add(parseInt(cb.dataset.tabId));
            } else {
                selectedTabs.delete(parseInt(cb.dataset.tabId));
            }
        });
        updateBulkActionButtons();
    });

    document.getElementById('groupSelectedBtn').addEventListener('click', groupSelectedTabs);
    document.getElementById('moveToNewWindowBtn').addEventListener('click', moveSelectedToNewWindow);
    document.getElementById('closeSelectedBtn').addEventListener('click', closeSelectedTabs);
}

// Load all tabs from all windows
async function loadTabs() {
    try {
        const windows = await chrome.windows.getAll({ populate: true });
        allTabs = [];

        windows.forEach(window => {
            window.tabs.forEach(tab => {
                allTabs.push({
                    ...tab,
                    windowId: window.id,
                    tags: []
                });
            });
        });

        // Load saved tags from storage
        const storage = await chrome.storage.local.get(['tabTags']);
        const tabTags = storage.tabTags || {};

        allTabs.forEach(tab => {
            if (tabTags[tab.id]) {
                tab.tags = tabTags[tab.id];
            }
        });

        updateStats(windows.length, allTabs.length);
        renderTabs(allTabs);
    } catch (error) {
        console.error('Error loading tabs:', error);
        showError('Failed to load tabs');
    }
}

// Update statistics
function updateStats(windowCount, tabCount) {
    document.getElementById('windowCount').textContent = `${windowCount} window${windowCount !== 1 ? 's' : ''}`;
    document.getElementById('tabCount').textContent = `${tabCount} tab${tabCount !== 1 ? 's' : ''}`;
}

// Render tabs in table
function renderTabs(tabs) {
    const tbody = document.getElementById('tabsBody');
    tbody.innerHTML = '';

    if (tabs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">No tabs found</td></tr>';
        return;
    }

    // Group tabs by window
    const tabsByWindow = {};
    tabs.forEach(tab => {
        if (!tabsByWindow[tab.windowId]) {
            tabsByWindow[tab.windowId] = [];
        }
        tabsByWindow[tab.windowId].push(tab);
    });

    // Render each window's tabs
    Object.entries(tabsByWindow).forEach(([windowId, windowTabs], index) => {
        // Add window separator
        if (Object.keys(tabsByWindow).length > 1) {
            const separatorRow = document.createElement('tr');
            separatorRow.className = 'window-separator';
            separatorRow.innerHTML = `<td colspan="5">Window ${index + 1} (${windowTabs.length} tabs)</td>`;
            tbody.appendChild(separatorRow);
        }

        // Add tabs
        windowTabs.forEach(tab => {
            const row = createTabRow(tab);
            tbody.appendChild(row);
        });
    });
}

// Create a table row for a tab
function createTabRow(tab) {
    const row = document.createElement('tr');

    // Checkbox
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tab-checkbox';
    checkbox.dataset.tabId = tab.id;
    checkbox.checked = selectedTabs.has(tab.id);
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            selectedTabs.add(tab.id);
        } else {
            selectedTabs.delete(tab.id);
        }
        updateBulkActionButtons();
    });
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    // Title
    const titleCell = document.createElement('td');
    titleCell.className = 'tab-title';
    titleCell.textContent = tab.title || 'Untitled';
    titleCell.title = tab.title;
    row.appendChild(titleCell);

    // URL
    const urlCell = document.createElement('td');
    urlCell.className = 'tab-url';
    let urlDisplay;
    try {
        const url = new URL(tab.url);
        urlDisplay = url.hostname + url.pathname;
    } catch (e) {
        urlDisplay = tab.url || 'Invalid URL';
    }
    urlCell.textContent = urlDisplay;
    urlCell.title = tab.url;
    row.appendChild(urlCell);

    // Tags
    const tagsCell = document.createElement('td');
    tagsCell.className = 'tab-tags';
    if (tab.tags && tab.tags.length > 0) {
        tab.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = tag.suggested ? 'tag suggested' : 'tag';
            tagSpan.textContent = tag.name;
            tagSpan.title = tag.suggested ? 'AI suggested' : '';
            tagsCell.appendChild(tagSpan);
        });
    } else {
        const noTagsSpan = document.createElement('span');
        noTagsSpan.className = 'no-tags';
        noTagsSpan.textContent = 'No tags';
        tagsCell.appendChild(noTagsSpan);
    }
    row.appendChild(tagsCell);

    // Actions
    const actionsCell = document.createElement('td');
    actionsCell.className = 'tab-actions';

    const switchBtn = document.createElement('button');
    switchBtn.className = 'action-btn';
    switchBtn.textContent = '👁️';
    switchBtn.title = 'Switch to tab';
    switchBtn.addEventListener('click', () => switchToTab(tab));
    actionsCell.appendChild(switchBtn);

    const tagBtn = document.createElement('button');
    tagBtn.className = 'action-btn';
    tagBtn.textContent = '🏷️';
    tagBtn.title = 'Edit tags';
    tagBtn.addEventListener('click', () => editTabTags(tab));
    actionsCell.appendChild(tagBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'action-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close tab';
    closeBtn.addEventListener('click', () => closeTab(tab));
    actionsCell.appendChild(closeBtn);

    row.appendChild(actionsCell);

    return row;
}

// Filter tabs based on search and filter
function filterTabs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('filterSelect').value;

    let filteredTabs = allTabs;

    // Apply search filter
    if (searchTerm) {
        filteredTabs = filteredTabs.filter(tab =>
            tab.title.toLowerCase().includes(searchTerm) ||
            tab.url.toLowerCase().includes(searchTerm) ||
            (tab.tags && tab.tags.some(tag => tag.name.toLowerCase().includes(searchTerm)))
        );
    }

    // Apply group filter
    if (filter === 'ungrouped') {
        filteredTabs = filteredTabs.filter(tab => !tab.tags || tab.tags.length === 0);
    } else if (filter === 'grouped') {
        filteredTabs = filteredTabs.filter(tab => tab.tags && tab.tags.length > 0);
    }

    renderTabs(filteredTabs);
}

// Analyze tabs with AI
async function analyzeTabsWithAI() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const analyzeBtn = document.getElementById('analyzeBtn');

    try {
        // Get LLM settings
        const settings = await chrome.storage.local.get(['llmProvider', 'apiKey', 'apiEndpoint', 'model']);

        if (!settings.llmProvider) {
            alert('Please select an LLM provider in the options page first.');
            chrome.runtime.openOptionsPage();
            return;
        }
        // Validate provider-specific requirements
        const provider = settings.llmProvider;
        const requiresKey = provider === 'openai' || provider === 'gemini' || provider === 'claude';
        if (requiresKey && !settings.apiKey) {
            alert('Please enter your API key for the selected provider in the options page.');
            chrome.runtime.openOptionsPage();
            return;
        }
        if (provider === 'custom' && !settings.apiEndpoint) {
            alert('Please enter your custom API endpoint in the options page.');
            chrome.runtime.openOptionsPage();
            return;
        }

        loadingIndicator.classList.remove('hidden');
        analyzeBtn.disabled = true;

        // Prepare tab data for analysis
        const tabData = allTabs.map(tab => ({
            id: tab.id,
            title: tab.title,
            url: tab.url
        }));

        // Send to background script for AI analysis
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeTabsWithAI',
            tabs: tabData,
            settings: settings
        });

        if (response.success) {
            // Apply suggested tags
            const tabTags = await chrome.storage.local.get(['tabTags']);
            const currentTags = tabTags.tabTags || {};

            response.suggestions.forEach(suggestion => {
                const tab = allTabs.find(t => t.id === suggestion.tabId);
                if (tab) {
                    const suggestedTags = suggestion.tags.map(name => ({
                        name: name,
                        suggested: true
                    }));
                    tab.tags = [...(tab.tags || []), ...suggestedTags];
                    currentTags[tab.id] = tab.tags;
                }
            });

            await chrome.storage.local.set({ tabTags: currentTags });
            renderTabs(allTabs);
            showSuccess('AI analysis complete! Tags suggested for tabs.');
        } else {
            showError(response.error || 'Failed to analyze tabs with AI');
        }
    } catch (error) {
        console.error('Error analyzing tabs:', error);
        showError('Failed to analyze tabs: ' + error.message);
    } finally {
        loadingIndicator.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
}

// Group tabs by their tags
async function groupTabsByTags() {
    try {
        // Collect all unique tags
        const tagGroups = {};

        allTabs.forEach(tab => {
            if (tab.tags && tab.tags.length > 0) {
                tab.tags.forEach(tag => {
                    if (!tagGroups[tag.name]) {
                        tagGroups[tag.name] = [];
                    }
                    tagGroups[tag.name].push(tab.id);
                });
            }
        });

        if (Object.keys(tagGroups).length === 0) {
            alert('No tags found. Please analyze tabs or add tags manually first.');
            return;
        }

        // Track tabs that have already been moved
        const movedTabIds = new Set();

        // Create new windows for each tag group
        for (const [, tabIds] of Object.entries(tagGroups)) {
            // Filter out tabs that have already been moved
            const uniqueTabIds = tabIds.filter(tabId => !movedTabIds.has(tabId));

            if (uniqueTabIds.length > 0) {
                const newWindow = await chrome.windows.create({
                    tabId: uniqueTabIds[0]
                });
                movedTabIds.add(uniqueTabIds[0]);

                // Move remaining tabs to the new window
                for (let i = 1; i < uniqueTabIds.length; i++) {
                    await chrome.tabs.move(uniqueTabIds[i], {
                        windowId: newWindow.id,
                        index: -1
                    });
                    movedTabIds.add(uniqueTabIds[i]);
                }
            }
        }

        showSuccess(`Created ${Object.keys(tagGroups).length} window groups based on tags`);
        await loadTabs();
    } catch (error) {
        console.error('Error grouping tabs:', error);
        showError('Failed to group tabs: ' + error.message);
    }
}

// Switch to a specific tab
async function switchToTab(tab) {
    try {
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.tabs.update(tab.id, { active: true });
        window.close();
    } catch (error) {
        console.error('Error switching to tab:', error);
        showError('Failed to switch to tab');
    }
}

// Edit tags for a tab
async function editTabTags(tab) {
    const currentTags = tab.tags ? tab.tags.map(t => t.name).join(', ') : '';
    const newTags = prompt('Enter tags (comma-separated):', currentTags);

    if (newTags !== null) {
        const tags = newTags.split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0)
            .map(name => ({ name, suggested: false }));

        tab.tags = tags;

        // Save to storage
        const storage = await chrome.storage.local.get(['tabTags']);
        const tabTags = storage.tabTags || {};
        tabTags[tab.id] = tags;
        await chrome.storage.local.set({ tabTags });

        renderTabs(allTabs);
    }
}

// Close a specific tab
async function closeTab(tab) {
    try {
        await chrome.tabs.remove(tab.id);
        allTabs = allTabs.filter(t => t.id !== tab.id);
        selectedTabs.delete(tab.id);
        renderTabs(allTabs);
        updateStats(
            new Set(allTabs.map(t => t.windowId)).size,
            allTabs.length
        );
    } catch (error) {
        console.error('Error closing tab:', error);
        showError('Failed to close tab');
    }
}

// Group selected tabs
async function groupSelectedTabs() {
    if (selectedTabs.size === 0) return;

    const groupName = prompt('Enter a group/tag name for selected tabs:');
    if (!groupName) return;

    try {
        const storage = await chrome.storage.local.get(['tabTags']);
        const tabTags = storage.tabTags || {};

        selectedTabs.forEach(tabId => {
            const tab = allTabs.find(t => t.id === tabId);
            if (tab) {
                const existingTags = tab.tags || [];
                const newTag = { name: groupName, suggested: false };

                // Check if tag already exists
                if (!existingTags.some(t => t.name === groupName)) {
                    tab.tags = [...existingTags, newTag];
                    tabTags[tabId] = tab.tags;
                }
            }
        });

        await chrome.storage.local.set({ tabTags });
        renderTabs(allTabs);
        showSuccess(`Tagged ${selectedTabs.size} tabs with "${groupName}"`);
    } catch (error) {
        console.error('Error grouping tabs:', error);
        showError('Failed to group tabs');
    }
}

// Move selected tabs to new window
async function moveSelectedToNewWindow() {
    if (selectedTabs.size === 0) return;

    try {
        const tabIds = Array.from(selectedTabs);

        // Create new window with first tab
        const newWindow = await chrome.windows.create({
            tabId: tabIds[0]
        });

        // Move remaining tabs
        for (let i = 1; i < tabIds.length; i++) {
            await chrome.tabs.move(tabIds[i], {
                windowId: newWindow.id,
                index: -1
            });
        }

        selectedTabs.clear();
        await loadTabs();
        showSuccess(`Moved ${tabIds.length} tabs to a new window`);
    } catch (error) {
        console.error('Error moving tabs:', error);
        showError('Failed to move tabs to new window');
    }
}

// Close selected tabs
async function closeSelectedTabs() {
    if (selectedTabs.size === 0) return;

    if (!confirm(`Close ${selectedTabs.size} selected tabs?`)) {
        return;
    }

    try {
        await chrome.tabs.remove(Array.from(selectedTabs));
        selectedTabs.clear();
        await loadTabs();
    } catch (error) {
        console.error('Error closing tabs:', error);
        showError('Failed to close tabs');
    }
}

// Update bulk action buttons state
function updateBulkActionButtons() {
    const hasSelection = selectedTabs.size > 0;
    document.getElementById('groupSelectedBtn').disabled = !hasSelection;
    document.getElementById('moveToNewWindowBtn').disabled = !hasSelection;
    document.getElementById('closeSelectedBtn').disabled = !hasSelection;
}

// Show success message
function showSuccess(message) {
    alert('Success: ' + message);
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
}
