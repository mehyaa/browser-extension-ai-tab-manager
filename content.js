// Content script for extracting visible page content

// Function to extract main content from the page
function extractMainContent() {
    // Remove script, style, and other non-content elements
    const excludeSelectors = 'script, style, noscript, iframe, object, embed, svg, canvas, nav, header, footer, aside, .ad, .advertisement, [role="banner"], [role="navigation"], [role="complementary"]';
    
    // Try to find main content area first
    let mainContent = null;
    
    // Try common main content selectors
    const mainSelectors = [
        'main',
        '[role="main"]',
        'article',
        '#content',
        '#main-content',
        '.main-content',
        '.content',
        '.post-content',
        '.article-content',
        '.entry-content'
    ];
    
    for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            mainContent = element;
            break;
        }
    }
    
    // If no main content found, use body
    if (!mainContent) {
        mainContent = document.body;
    }
    
    // Extract visible text from main content
    function getVisibleText(element) {
        // Skip excluded elements
        if (element.matches && element.matches(excludeSelectors)) {
            return '';
        }
        
        // Check if element is visible
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return '';
        }
        
        let text = '';
        
        // Process text nodes
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeText = node.textContent.trim();
                if (nodeText) {
                    text += nodeText + ' ';
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Recursively get text from child elements
                text += getVisibleText(node);
            }
        }
        
        return text;
    }
    
    let content = getVisibleText(mainContent);
    
    // Clean up the text
    content = content
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
    
    // Limit to approximately 3000 characters to keep within reasonable token limits
    if (content.length > 3000) {
        content = content.substring(0, 3000) + '...';
    }
    
    return content;
}

// Function to get page metadata
function getPageMetadata() {
    const metadata = {
        title: document.title,
        description: '',
        keywords: '',
        url: window.location.href
    };
    
    // Get meta description
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
        metadata.description = descMeta.getAttribute('content') || '';
    }
    
    // Get meta keywords
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
        metadata.keywords = keywordsMeta.getAttribute('content') || '';
    }
    
    // Get OpenGraph title if available
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.getAttribute('content')) {
        metadata.title = ogTitle.getAttribute('content');
    }
    
    return metadata;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        try {
            const metadata = getPageMetadata();
            const content = extractMainContent();
            
            sendResponse({
                success: true,
                metadata: metadata,
                content: content
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    return true; // Keep channel open for async response
});
