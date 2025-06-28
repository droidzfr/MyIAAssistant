// options/options.js
import { getSettings, getProviders, getAgents } from '../js/storage.js';
import { localization } from './localization.js';
import {
    DOMElements,
    localizeHtml,
    renderProviderList,
    renderAgentList,
    populateProviderSelect,
    applyTheme
} from './ui.js';
import { setupEventListeners } from './handlers.js';

/**
 * Initializes the application state and UI.
 */
async function main() {
    console.log("Initializing options page...");

    // 1. Load settings and data from storage
    const [settings, providers, agents] = await Promise.all([getSettings(), getProviders(), getAgents()]);

    // 2. Initialize and apply internationalization
    await localization.init(settings.language || 'auto');
    localizeHtml();

    // 3. Initial UI setup from loaded data
    applyTheme(settings);
    if (DOMElements.syncStorageSwitch) DOMElements.syncStorageSwitch.checked = settings.useSync;
    if (DOMElements.darkModeSwitch) DOMElements.darkModeSwitch.checked = settings.darkMode;
    if (DOMElements.languageSelect) DOMElements.languageSelect.value = settings.language || 'auto';

    // 4. Render dynamic lists
    renderProviderList(providers);
    await renderAgentList(agents);
    await populateProviderSelect();

    // 5. Setup all event listeners
    setupEventListeners();

    console.log("Options page initialized.");
}

document.addEventListener('DOMContentLoaded', main);