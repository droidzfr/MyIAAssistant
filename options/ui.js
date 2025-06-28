// options/ui.js
import { getProviders, getAgents } from '../js/storage.js';
import { localization } from './localization.js';

// Cache DOM elements to avoid repeated lookups
export const DOMElements = {
    // General
    agentModal: new bootstrap.Modal(document.getElementById('agentModal')),
    providerModal: new bootstrap.Modal(document.getElementById('providerModal')),

    // Agents Tab
    agentListContainer: document.getElementById('agentListContainer'),
    agentForm: document.getElementById('agentForm'),
    agentModalLabel: document.getElementById('agentModalLabel'),
    agentProviderSelect: document.getElementById('agentProvider'),
    agentModelSelect: document.getElementById('agentModelSelect'),

    // Providers Tab
    providerListContainer: document.getElementById('providerListContainer'),
    providerForm: document.getElementById('providerForm'),
    providerModalLabel: document.getElementById('providerModalLabel'),
    providerModelsContainer: document.getElementById('providerModelsContainer'),
    newModelInput: document.getElementById('newModelInput'),
    addModelButton: document.getElementById('addModelButton'),

    // Settings Tab
    syncStorageSwitch: document.getElementById('syncStorageSwitch'),
    darkModeSwitch: document.getElementById('darkModeSwitch'),
    languageSelect: document.getElementById('languageSelect'),

    // Import/Export Tab
    importAllButton: document.getElementById('importAllButton'),
    exportAllButton: document.getElementById('exportAllButton'),
    importAllFile: document.getElementById('importAllFile')
};

/**
 * Applies translations to the static HTML elements based on data-i18n attributes.
 */
export function localizeHtml() {
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
        } else {
            console.warn(`i18n message not found for key: ${key}`);
        }
    });
}

/**
 * Renders the list of providers.
 * @param {Array<Object>} providers - The list of providers to render.
 */
export function renderProviderList(providers) {
    const { providerListContainer } = DOMElements;
    providerListContainer.innerHTML = '';
    if (!providers || providers.length === 0) {
        providerListContainer.innerHTML = `<p>${localization.getMessage("optionsNoProvidersConfigured")}</p>`;
        return;
    }

    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';
    providers.forEach(provider => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';
        const maskedApiKey = provider.apiKey ? `${provider.apiKey.substring(0, 4)}...${provider.apiKey.substring(provider.apiKey.length - 4)}` : localization.getMessage("optionsValueNotAvailable");
        item.innerHTML = `
            <div class="me-auto">
                <h6 class="mb-1">${provider.name}</h6>
                <small class="text-muted">${localization.getMessage("optionsProviderApiKeyLabel")} ${maskedApiKey}</small>
            </div>
            <div class="mt-2 mt-md-0">
                <button class="btn btn-sm btn-outline-secondary me-2 edit-provider-btn" data-provider-id="${provider.id}" title="${localization.getMessage("optionsButtonEdit")}"><i class="bi bi-pencil"></i> <span class="d-none d-md-inline">${localization.getMessage("optionsButtonEdit")}</span></button>
                <button class="btn btn-sm btn-outline-danger delete-provider-btn" data-provider-id="${provider.id}" title="${localization.getMessage("optionsButtonDelete")}"><i class="bi bi-trash"></i> <span class="d-none d-md-inline">${localization.getMessage("optionsButtonDelete")}</span></button>
            </div>`;
        listGroup.appendChild(item);
    });
    providerListContainer.appendChild(listGroup);
}

/**
 * Renders the list of agents.
 * @param {Array<Object>} agents - The list of agents to render.
 */
export async function renderAgentList(agents) {
    const { agentListContainer } = DOMElements;
    agentListContainer.innerHTML = '';
    if (!agents || agents.length === 0) {
        agentListContainer.innerHTML = `<p>${localization.getMessage("optionsNoAgentsConfigured")}</p>`;
        return;
    }

    const providers = await getProviders();
    const providerMap = providers.reduce((map, p) => ({ ...map, [p.id]: p.name }), {});

    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';
    agents.forEach(agent => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';
        const providerName = providerMap[agent.provider] || agent.provider || localization.getMessage("optionsValueNotAvailable");
        item.innerHTML = `
            <div class="me-auto">
                <h6 class="mb-1">${agent.name}</h6>
                <small class="text-muted">${localization.getMessage("optionsAgentModelLabel")} ${agent.model || localization.getMessage("optionsValueNotAvailable")} | ${localization.getMessage("optionsAgentProviderLabel")} ${providerName}</small>
            </div>
            <div class="mt-2 mt-md-0">
                <button class="btn btn-sm btn-outline-secondary me-2 edit-agent-btn" data-agent-id="${agent.id}" title="${localization.getMessage("optionsButtonEdit")}"><i class="bi bi-pencil"></i> <span class="d-none d-md-inline">${localization.getMessage("optionsButtonEdit")}</span></button>
                <button class="btn btn-sm btn-outline-danger delete-agent-btn" data-agent-id="${agent.id}" title="${localization.getMessage("optionsButtonDelete")}"><i class="bi bi-trash"></i> <span class="d-none d-md-inline">${localization.getMessage("optionsButtonDelete")}</span></button>
            </div>`;
        listGroup.appendChild(item);
    });
    agentListContainer.appendChild(listGroup);
}

/**
 * Populates the provider dropdown in the agent modal.
 * @param {string} [currentValue] - The current value to select.
 */
export async function populateProviderSelect(currentValue) {
    const { agentProviderSelect } = DOMElements;
    const providers = await getProviders();
    agentProviderSelect.innerHTML = `<option selected value="">${localization.getMessage("optionsSelectChooseProvider")}</option>`;
    providers.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        agentProviderSelect.appendChild(option);
    });
    if (currentValue && providers.some(p => p.id === currentValue)) {
        agentProviderSelect.value = currentValue;
    }
}

/**
 * Populates the model dropdown based on the selected provider.
 * @param {string} providerId - The ID of the selected provider.
 * @param {string} [selectedModel] - The model to pre-select.
 */
export async function populateAgentModelSelect(providerId, selectedModel = '') {
    const { agentModelSelect } = DOMElements;
    agentModelSelect.innerHTML = ''; // Clear

    if (!providerId) {
        agentModelSelect.innerHTML = `<option value="" selected>${localization.getMessage("optionsModalPlaceholderChooseProviderFirst")}</option>`;
        agentModelSelect.disabled = true;
        return;
    }

    const providers = await getProviders();
    const provider = providers.find(p => p.id === providerId);

    if (provider && provider.models && provider.models.length > 0) {
        agentModelSelect.innerHTML = `<option value="" selected>${localization.getMessage("optionsSelectChooseModel")}</option>`;
        provider.models.forEach(modelName => {
            const option = document.createElement('option');
            option.value = modelName;
            option.textContent = modelName;
            agentModelSelect.appendChild(option);
        });
        agentModelSelect.disabled = false;
        if (selectedModel && provider.models.includes(selectedModel)) {
            agentModelSelect.value = selectedModel;
        }
    } else {
        agentModelSelect.innerHTML = `<option value="" selected>${localization.getMessage("optionsSelectNoModelDefined")}</option>`;
        agentModelSelect.disabled = true;
    }
}

/**
 * Applies the current theme (dark/light) to the document.
 * @param {Object} settings - The current settings object.
 */
export function applyTheme(settings) {
    if (settings.darkMode) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-bs-theme');
    }
}

/**
 * Crée un élément tag pour un modèle.
 * @param {string} modelName - Le nom du modèle à afficher dans le tag.
 * @returns {HTMLElement} - L'élément HTML du tag.
 */
function createModelTag(modelName) {
    const tag = document.createElement('span');
    // Utilise des classes Bootstrap pour le style du tag
    tag.className = 'badge bg-secondary d-inline-flex align-items-center me-2 mb-2';
    tag.style.padding = '0.5em 0.75em';
    tag.style.fontSize = '90%';

    const modelText = document.createElement('span');
    modelText.textContent = modelName;
    tag.appendChild(modelText);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    // Style du bouton de suppression
    removeBtn.className = 'btn-close btn-close-white';
    removeBtn.style.marginLeft = '0.5em';
    removeBtn.style.fontSize = '60%';
    removeBtn.setAttribute('aria-label', `Remove ${modelName}`);
    removeBtn.dataset.modelName = modelName; // Permet de l'identifier dans le handler
    removeBtn.addEventListener('click', function() {
        tag.remove();
    });

    tag.appendChild(removeBtn);
    return tag;
}

/**
 * Affiche les modèles sous forme de tags dans le conteneur dédié.
 * @param {string[]} models - La liste des noms de modèles.
 */
export function renderModelTags(models = []) {
    const { providerModelsContainer } = DOMElements;
    if (!providerModelsContainer) return;
    
    providerModelsContainer.innerHTML = ''; // Vide les anciens tags
    if (!models || models.length === 0) return;

    models.forEach(modelName => {
        if (modelName && modelName.trim()) {
            const tag = createModelTag(modelName.trim());
            providerModelsContainer.appendChild(tag);
        }
    });
}

/**
 * Récupère la liste des modèles depuis les tags affichés dans l'interface.
 * @returns {string[]} La liste des noms de modèles.
 */
export function getModelsFromTags() {
    const { providerModelsContainer } = DOMElements;
    if (!providerModelsContainer) return [];
    
    const models = [];
    const tags = providerModelsContainer.querySelectorAll('.badge');
    tags.forEach(tag => {
        // Le nom du modèle est dans le premier enfant (span) du tag
        const modelName = tag.querySelector('span').textContent;
        if (modelName && modelName.trim()) {
            models.push(modelName.trim());
        }
    });
    return models;
}
