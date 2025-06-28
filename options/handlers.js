// options/handlers.js
import {
    getSettings,
    saveSettings,
    getAgents,
    saveAgents as saveAgentsToStorage,
    getProviders,
    saveProviders as saveProvidersToStorage
} from '../js/storage.js';
import {
    DOMElements,
    renderProviderList,
    renderAgentList,
    populateProviderSelect,
    populateAgentModelSelect,
    applyTheme,
    localizeHtml,
    renderModelTags,
    getModelsFromTags
} from './ui.js';
import { handleExportAll, handleImportFileSelect } from './importExport.js';
import { localization } from './localization.js';

/**
 * Saves providers, re-renders lists, and updates the provider dropdown in the agent modal.
 * @param {Array<Object>} providers - The full list of providers to save.
 */
async function saveAndRenderProviders(providers) {
    await saveProvidersToStorage(providers);
    renderProviderList(providers);
    await populateProviderSelect(DOMElements.agentProviderSelect.value);
    const agents = await getAgents();
    await renderAgentList(agents);
}

/**
 * Saves agents and re-renders the agent list.
 * @param {Array<Object>} agents - The full list of agents to save.
 */
async function saveAndRenderAgents(agents) {
    await saveAgentsToStorage(agents);
    await renderAgentList(agents);
}

/**
 * Sets up all event listeners for the options page.
 */
export function setupEventListeners() {
    // Provider Modal Handlers
    DOMElements.providerListContainer.addEventListener('click', handleProviderListClick);
    DOMElements.providerForm.addEventListener('submit', handleProviderFormSubmit);
    DOMElements.addModelButton.addEventListener('click', handleAddModelTag);
    document.getElementById('addProviderButton').addEventListener('click', () => {
        DOMElements.providerModalLabel.textContent = chrome.i18n.getMessage("optionsProviderModalTitleAdd");
        DOMElements.providerForm.reset();
        DOMElements.providerForm.querySelector('#providerId').value = '';
        DOMElements.providerModal.show();
    });

    // Agent Modal Handlers
    DOMElements.agentListContainer.addEventListener('click', handleAgentListClick);
    DOMElements.agentForm.addEventListener('submit', handleAgentFormSubmit);
    DOMElements.agentProviderSelect.addEventListener('change', (e) => populateAgentModelSelect(e.target.value));
    document.getElementById('addAgentButton').addEventListener('click', () => {
        DOMElements.agentModalLabel.textContent = chrome.i18n.getMessage("optionsAgentModalTitleAdd");
        DOMElements.agentForm.reset();
        DOMElements.agentForm.querySelector('#agentId').value = '';
        populateProviderSelect().then(() => {
            populateAgentModelSelect('');
            DOMElements.agentModal.show();
        });
    });

    // Settings Handlers
    DOMElements.syncStorageSwitch.addEventListener('change', handleSettingsChange);
    DOMElements.darkModeSwitch.addEventListener('change', handleSettingsChange);
    DOMElements.languageSelect.addEventListener('change', handleSettingsChange);

    // Import/Export Handlers
    DOMElements.exportAllButton.addEventListener('click', handleExportAll);
    DOMElements.importAllButton.addEventListener('click', () => DOMElements.importAllFile.click());
    DOMElements.importAllFile.addEventListener('change', handleImportFileSelect);

    // API Key visibility toggle
    const toggleBtn = document.getElementById('toggleApiKeyVisibility');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', handleToggleApiKeyVisibility);
    }
}

// --- Event Handler Implementations ---

async function handleProviderListClick(event) {
    const btn = event.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.providerId;
    if (!id) return;

    const providers = await getProviders();
    const provider = providers.find(p => p.id === id);
    if (!provider) {
        alert(chrome.i18n.getMessage("optionsErrorProviderNotFound"));
        return;
    }

    if (btn.classList.contains('delete-provider-btn')) {
        if (confirm(chrome.i18n.getMessage("optionsConfirmDeleteProvider", provider.name))) {
            const updatedProviders = providers.filter(p => p.id !== id);
            await saveAndRenderProviders(updatedProviders);
        }
    } else if (btn.classList.contains('edit-provider-btn')) {
        DOMElements.providerModalLabel.textContent = chrome.i18n.getMessage("optionsProviderModalTitleEdit");
        const form = DOMElements.providerForm;
        form.reset();
        form.querySelector('#providerId').value = provider.id;
        form.querySelector('#providerName').value = provider.name || '';
        form.querySelector('#providerApiKey').value = provider.apiKey || '';
        form.querySelector('#providerEndpointUrl').value = provider.endpointUrl || '';
        renderModelTags(provider.models || []);
        // Set advanced settings if they exist
        DOMElements.providerModal.show();
    }
}

async function handleProviderFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const id = form.querySelector('#providerId').value;
    const providerData = {
        id: id || `provider_${Date.now()}`,
        name: form.querySelector('#providerName').value.trim(),
        apiKey: form.querySelector('#providerApiKey').value.trim(),
        endpointUrl: form.querySelector('#providerEndpointUrl').value.trim(),
        models: getModelsFromTags(),
    };

    if (!providerData.name || !providerData.apiKey) {
        alert(chrome.i18n.getMessage("optionsAlertProviderNameApiKeyRequired"));
        return;
    }

    let providers = await getProviders();
    const index = providers.findIndex(p => p.id === id);

    if (index > -1) {
        providers[index] = { ...providers[index], ...providerData };
    } else {
        providers.push(providerData);
    }

    await saveAndRenderProviders(providers);
    DOMElements.providerModal.hide();
}

async function handleAgentListClick(event) {
    const btn = event.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.agentId;
    if (!id) return;

    const agents = await getAgents();
    const agent = agents.find(a => a.id === id);
    if (!agent) {
        alert(chrome.i18n.getMessage("optionsErrorAgentNotFound"));
        return;
    }

    if (btn.classList.contains('delete-agent-btn')) {
        if (confirm(chrome.i18n.getMessage("optionsConfirmDeleteAgent", agent.name))) {
            const updatedAgents = agents.filter(a => a.id !== id);
            await saveAndRenderAgents(updatedAgents);
        }
    } else if (btn.classList.contains('edit-agent-btn')) {
        DOMElements.agentModalLabel.textContent = chrome.i18n.getMessage("optionsAgentModalTitleEdit");
        const form = DOMElements.agentForm;
        form.reset();
        form.querySelector('#agentId').value = agent.id;
        form.querySelector('#agentName').value = agent.name || '';
        form.querySelector('#agentSystemPrompt').value = agent.systemPrompt || '';
        form.querySelector('#agentUserPrompt').value = agent.userPrompt || '';
        
        await populateProviderSelect(agent.provider);
        await populateAgentModelSelect(agent.provider, agent.model);

        DOMElements.agentModal.show();
    }
}

async function handleAgentFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const id = form.querySelector('#agentId').value;
    const agentData = {
        id: id || `agent_${Date.now()}`,
        name: form.querySelector('#agentName').value.trim(),
        provider: form.querySelector('#agentProvider').value,
        model: form.querySelector('#agentModelSelect').value,
        systemPrompt: form.querySelector('#agentSystemPrompt').value.trim(),
        userPrompt: form.querySelector('#agentUserPrompt').value.trim(),
    };

    if (!agentData.name) {
        alert(chrome.i18n.getMessage("optionsAlertAgentNameRequired"));
        return;
    }

    let agents = await getAgents();
    const index = agents.findIndex(a => a.id === id);

    if (index > -1) {
        agents[index] = { ...agents[index], ...agentData };
    } else {
        agents.push(agentData);
    }

    await saveAndRenderAgents(agents);
    DOMElements.agentModal.hide();
}

async function handleSettingsChange() {
    const oldSettings = await getSettings();
    const newSettings = {
        useSync: DOMElements.syncStorageSwitch.checked,
        darkMode: DOMElements.darkModeSwitch.checked,
        language: DOMElements.languageSelect.value
    };

    await saveSettings(newSettings);
    applyTheme(newSettings);

    // If language changed, re-initialize localization and re-render UI
    if (oldSettings.language !== newSettings.language) {
        await localization.init(newSettings.language);
        localizeHtml(); // Re-translate static elements
        const [providers, agents] = await Promise.all([getProviders(), getAgents()]);
        renderProviderList(providers); // Re-render lists with translated text
        await renderAgentList(agents);
        await populateProviderSelect(); // Re-populate selects
    }

    // Inform user about sync storage change, which requires more attention
    if (oldSettings.useSync !== newSettings.useSync) {
        alert(localization.getMessage("optionsSettingsSyncChangeAlert"));
    }
}

/**
 * Toggles the visibility of the API key input field.
 */
function handleToggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('providerApiKey');
    const icon = this.querySelector('i');
    const isPassword = apiKeyInput.type === 'password';

    apiKeyInput.type = isPassword ? 'text' : 'password';
    icon.classList.toggle('bi-eye', !isPassword);
    icon.classList.toggle('bi-eye-slash', isPassword);
}

/**
 * Gère l'ajout d'un modèle sous forme de tag.
 */
function handleAddModelTag() {
    const { newModelInput, providerModelsContainer } = DOMElements;
    const modelName = newModelInput.value.trim();
    
    if (modelName) {
        // Vérifie si le modèle existe déjà
        const existingModels = getModelsFromTags();
        if (!existingModels.includes(modelName)) {
            // Crée et ajoute un nouveau tag
            const tag = document.createElement('span');
            tag.className = 'badge bg-secondary d-inline-flex align-items-center me-2 mb-2';
            tag.style.padding = '0.5em 0.75em';
            tag.style.fontSize = '90%';

            const modelText = document.createElement('span');
            modelText.textContent = modelName;
            tag.appendChild(modelText);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-close btn-close-white';
            removeBtn.style.marginLeft = '0.5em';
            removeBtn.style.fontSize = '60%';
            removeBtn.setAttribute('aria-label', `Remove ${modelName}`);
            removeBtn.addEventListener('click', () => tag.remove());

            tag.appendChild(removeBtn);
            providerModelsContainer.appendChild(tag);
        }
        
        // Réinitialise le champ de saisie
        newModelInput.value = '';
        newModelInput.focus();
    }
}
