// popup/popup.js
import { getAgents, getSettings } from '../js/storage.js';
import { localization } from '../options/localization.js';

document.addEventListener('DOMContentLoaded', main);

const STORAGE_KEYS = {
    LAST_AGENT: 'myIAAssistantLastAgentId',
    SETTINGS: 'myIAAssistantSettings',
    POPUP_SELECTED_TEXT: 'popupSelectedText',
    POPUP_RESPONSE_TEXT: 'popupResponseText'
};

/**
 * Main function to initialize the popup.
 */
async function main() {
    // --- DOM Element Retrieval ---
    const ui = {
        selectedTextArea: document.getElementById('selectedText'),
        agentSelect: document.getElementById('agentSelect'),
        submitButton: document.getElementById('submitButton'),
        responseTextArea: document.getElementById('responseText'),
        copyButton: document.getElementById('copyButton'),
        clearButton: document.getElementById('clearButton'),
        statusMessage: document.getElementById('statusMessage'),
        openOptionsButton: document.getElementById('openOptionsButton')
    };

    // --- Initial Setup ---
    // Initialize localization with the user's preferred language
    const settings = await getSettings();
    await localization.init(settings.language || 'auto');
    localizeHtml();
    await applyTheme();
    await loadAndRenderAgents(ui.agentSelect, ui.submitButton);
    await loadInitialText(ui.selectedTextArea);
    loadState(ui);
    setupEventListeners(ui);
}

// --- Setup and Initialization Functions ---

/**
 * Applies translations to the static HTML elements.
 */
function localizeHtml() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const [attr, key] = el.dataset.i18n.split('|');
        if (!attr || !key) {
            console.warn('Invalid data-i18n format:', el.dataset.i18n, 'on element', el);
            return;
        }

        const message = localization.getMessage(key);
        if (message) {
            if (attr === 'html') {
                el.innerHTML = message;
            } else if (attr === 'textContent') {
                el.textContent = message;
            } else {
                el.setAttribute(attr, message);
            }
        }
    });
}

/**
 * Applies the saved theme (dark/light) to the popup.
 */
async function applyTheme() {
    try {
        const { myIAAssistantSettings = {} } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        document.documentElement.setAttribute('data-bs-theme', myIAAssistantSettings.darkMode ? 'dark' : 'light');
    } catch (error) {
        console.error("Error applying theme:", error);
    }
}

/**
 * Loads agents from storage and populates the dropdown.
 * @param {HTMLSelectElement} agentSelect - The select element for agents.
 * @param {HTMLButtonElement} submitButton - The submit button.
 */
async function loadAndRenderAgents(agentSelect, submitButton) {
    try {
        const agents = await getAgents();
        agentSelect.innerHTML = `<option selected value="">${localization.getMessage("popupChooseAgent")}</option>`;
        if (agents.length > 0) {
            agents.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.name;
                agentSelect.appendChild(option);
            });
            agentSelect.disabled = false;
        } else {
            agentSelect.disabled = true;
        }

        const lastAgentId = localStorage.getItem(STORAGE_KEYS.LAST_AGENT);
        if (lastAgentId && agents.some(a => a.id === lastAgentId)) {
            agentSelect.value = lastAgentId;
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error("Error loading agents:", error);
        showStatus(localization.getMessage("popupErrorLoadingAgents"), "danger");
    }
}

/**
 * Loads text from session storage (from context menu) if available.
 * @param {HTMLTextAreaElement} selectedTextArea - The textarea for selected text.
 */
async function loadInitialText(selectedTextArea) {
    try {
        const result = await chrome.storage.session.get('selectedTextForPopup');
        if (result.selectedTextForPopup) {
            selectedTextArea.value = result.selectedTextForPopup;
            localStorage.setItem(STORAGE_KEYS.POPUP_SELECTED_TEXT, result.selectedTextForPopup);
            await chrome.storage.session.remove('selectedTextForPopup');
        }
    } catch (error) {
        console.error("Error loading initial text:", error);
    }
}

/**
 * Loads the last saved state from local storage.
 * @param {object} ui - The collection of UI elements.
 */
function loadState(ui) {
    ui.selectedTextArea.value = localStorage.getItem(STORAGE_KEYS.POPUP_SELECTED_TEXT) || '';
    ui.responseTextArea.value = localStorage.getItem(STORAGE_KEYS.POPUP_RESPONSE_TEXT) || '';
}

/**
 * Sets up all event listeners for the popup.
 * @param {object} ui - The collection of UI elements.
 */
function setupEventListeners(ui) {
    ui.agentSelect.addEventListener('change', (e) => handleAgentChange(e, ui.submitButton));
    ui.submitButton.addEventListener('click', () => handleSubmit(ui));
    ui.copyButton.addEventListener('click', () => handleCopy(ui));
    ui.clearButton.addEventListener('click', () => handleClear(ui));
    ui.openOptionsButton.addEventListener('click', () => chrome.runtime.openOptionsPage());

    // Persist text areas on input
    ui.selectedTextArea.addEventListener('input', () => localStorage.setItem(STORAGE_KEYS.POPUP_SELECTED_TEXT, ui.selectedTextArea.value));
    ui.responseTextArea.addEventListener('input', () => localStorage.setItem(STORAGE_KEYS.POPUP_RESPONSE_TEXT, ui.responseTextArea.value));
}

// --- Event Handlers ---

function handleAgentChange(event, submitButton) {
    const agentId = event.target.value;
    submitButton.disabled = !agentId;
    if (agentId) {
        localStorage.setItem(STORAGE_KEYS.LAST_AGENT, agentId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.LAST_AGENT);
    }
}

function handleSubmit(ui) {
    const agentId = ui.agentSelect.value;
    const text = ui.selectedTextArea.value;

    if (!agentId) {
        showStatus(localization.getMessage('popupNoTextSelected'), 'warning', ui.statusMessage);
        ui.submitButton.disabled = true;
        return;
    }
    if (!text.trim()) {
        showStatus(localization.getMessage("popupWarningEnterText"), "warning", ui.statusMessage);
        return;
    }

    hideStatus(ui.statusMessage);
    ui.responseTextArea.value = "";
    localStorage.setItem(STORAGE_KEYS.POPUP_RESPONSE_TEXT, "");

    setSubmitButtonState(ui.submitButton, true);

    chrome.runtime.sendMessage({ type: "queryAgent", payload: { agentId, text } }, (response) => {
        handleApiResponse(response, ui);
        setSubmitButtonState(ui.submitButton, false);
    });
}

function handleApiResponse(response, ui) {
    if (chrome.runtime.lastError) {
        showStatus(localization.getMessage("popupErrorCommunication", chrome.runtime.lastError.message), "danger", ui.statusMessage);
    } else if (response?.success) {
        ui.responseTextArea.value = response.data;
        localStorage.setItem(STORAGE_KEYS.POPUP_RESPONSE_TEXT, response.data);
    } else {
        showStatus(localization.getMessage("popupErrorApi", response?.error || "Unknown error"), "danger", ui.statusMessage);
    }
}

async function handleCopy(ui) {
    if (!ui.responseTextArea.value) return;
    try {
        await navigator.clipboard.writeText(ui.responseTextArea.value);
        const originalHtml = ui.copyButton.innerHTML;
        ui.copyButton.innerHTML = `<i class="bi bi-check-lg"></i> ${localization.getMessage("popupCopySuccess")}`;
        ui.copyButton.classList.add('btn-success');
        ui.copyButton.classList.remove('btn-secondary');
        setTimeout(() => {
            ui.copyButton.innerHTML = originalHtml;
            ui.copyButton.classList.remove('btn-success');
            ui.copyButton.classList.add('btn-secondary');
        }, 1500);
    } catch (err) {
        showStatus(localization.getMessage("popupErrorCopy"), "danger", ui.statusMessage);
    }
}

function handleClear(ui) {
    ui.selectedTextArea.value = '';
    ui.responseTextArea.value = '';
    localStorage.removeItem(STORAGE_KEYS.POPUP_SELECTED_TEXT);
    localStorage.removeItem(STORAGE_KEYS.POPUP_RESPONSE_TEXT);
    hideStatus(ui.statusMessage);
}

// --- UI Utility Functions ---

function showStatus(message, type = 'info', statusElement) {
    statusElement.textContent = message;
    statusElement.className = `alert alert-${type}`;
    statusElement.style.display = 'block';
}

function hideStatus(statusElement) {
    statusElement.style.display = 'none';
}

function setSubmitButtonState(submitButton, isLoading) {
    submitButton.disabled = isLoading;
    if (isLoading) {
        submitButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ${chrome.i18n.getMessage("popupStatusQuerying")}`;
    } else {
        submitButton.textContent = chrome.i18n.getMessage("popupButtonQueryAgent");
    }
}