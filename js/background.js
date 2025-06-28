// js/background.js
import { getAgents, getProviders } from './storage.js';
import { queryAI } from './api.js';

const CONTEXT_MENU_ID = "my-ia-assistant-context-menu";

/**
 * Creates the main context menu for the extension.
 * This is triggered when the extension is first installed or updated.
 */
function setupContextMenu() {
    // Ensure any old menu is removed before creating a new one.
    chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
        // Ignore errors if the menu didn't exist, which is common.
        if (chrome.runtime.lastError) {}
        chrome.contextMenus.create({
            id: CONTEXT_MENU_ID,
            title: chrome.i18n.getMessage("extensionName"),
            contexts: ["page", "selection"]
        });
    });
}

// --- Event Listeners ---

chrome.runtime.onInstalled.addListener(setupContextMenu);

// The service worker can be woken up by alarms, so it's good practice
// to ensure the context menu exists on startup as well.
chrome.runtime.onStartup.addListener(setupContextMenu);

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
        handleContextMenuClick(tab.id);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "queryAgent") {
        handleQueryAgent(message.payload, sendResponse);
        return true; // Indicates that sendResponse will be called asynchronously.
    }
});

// --- Core Logic Functions ---

/**
 * Handles the context menu click event.
 * It determines if text is selected and stores it for the popup.
 * @param {number} tabId - The ID of the tab where the click occurred.
 */
function handleContextMenuClick(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.getSelection().toString(),
    }, (injectionResults) => {
        if (chrome.runtime.lastError) {
            console.error(`Script injection error: ${chrome.runtime.lastError.message}`);
            return;
        }
        const selectedText = injectionResults?.[0]?.result;
        storeTextForPopup(selectedText || "");
    });
}

/**
 * Stores the provided text in session storage and opens the popup.
 * @param {string} text - The text to store.
 */
function storeTextForPopup(text) {
    const normalizedText = text.replace(/\r\n/g, '\n');
    chrome.storage.session.set({ selectedTextForPopup: normalizedText }, () => {
        if (chrome.runtime.lastError) {
            console.error(`Error storing text: ${chrome.runtime.lastError.message}`);
        } else {
            chrome.action.openPopup();
        }
    });
}

/**
 * Handles the 'queryAgent' message from the popup.
 * It retrieves agent and provider data, calls the AI, and sends back the response.
 * @param {object} payload - The message payload containing agentId and text.
 * @param {function} sendResponse - The callback to send the result to the popup.
 */
async function handleQueryAgent(payload, sendResponse) {
    const { agentId, text } = payload;

    if (!agentId || !text) {
        sendResponse({ success: false, error: "Agent ID or text is missing." });
        return;
    }

    try {
        const [allAgents, allProviders] = await Promise.all([getAgents(), getProviders()]);

        const agent = allAgents.find(a => a.id === agentId);
        if (!agent) {
            sendResponse({ success: false, error: `Agent with ID ${agentId} not found.` });
            return;
        }

        const provider = allProviders.find(p => p.id === agent.provider);
        if (!provider) {
            sendResponse({ success: false, error: `Provider for agent "${agent.name}" not found.` });
            return;
        }

        const assistantResponse = await queryAI(agent, provider, text);
        sendResponse({ success: true, data: assistantResponse });

    } catch (error) {
        console.error("Error processing agent request:", error);
        sendResponse({ success: false, error: error.message });
    }
}