// js/storage.js

// --- Constants ---
export const STORAGE_KEY_AGENTS = 'myIAAssistantAgents';
export const STORAGE_KEY_PROVIDERS = 'myIAAssistantProviders';
export const STORAGE_KEY_SETTINGS = 'myIAAssistantSettings';

/**
 * Retrieves the current settings.
 * Settings are always stored in chrome.storage.local.
 * @returns {Promise<object>} A promise that resolves to the settings object.
 */
export async function getSettings() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY_SETTINGS]);
        // Define default settings to ensure all keys are present
        return {
            useSync: false,
            darkMode: false,
            language: 'auto',
            ...(result[STORAGE_KEY_SETTINGS] || {})
        };
    } catch (error) {
        console.error('Error retrieving settings:', error);
        // Return default settings on error
        return { useSync: false, darkMode: false, language: 'auto' };
    }
}

/**
 * Saves the settings object.
 * Settings are always stored in chrome.storage.local.
 * @param {object} settings - The settings object to save.
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
    try {
        // Ensure only valid keys are saved
        const validSettings = {
            useSync: settings.useSync || false,
            darkMode: settings.darkMode || false,
            language: settings.language || 'auto'
        };
        await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: validSettings });
        console.log('Settings saved successfully via shared module.');
    } catch (error) {
        console.error('Error saving settings via shared module:', error);
    }
}


/**
 * Determines the correct storage area (sync or local) based on settings.
 * @returns {Promise<chrome.storage.StorageArea>}
 */
async function getStorageArea() {
    const settings = await getSettings();
    return settings.useSync ? chrome.storage.sync : chrome.storage.local;
}


/**
 * A generic function to retrieve data (agents or providers) from the correct storage area.
 * @param {string} key - The storage key for the data to retrieve.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of items.
 */
export async function getData(key) {
    try {
        const storageArea = await getStorageArea();
        const result = await storageArea.get([key]);
        return result[key] || [];
    } catch (error) {
        console.error(`Error retrieving data for key ${key}:`, error);
        return []; // Return an empty array on error
    }
}

/**
 * A generic function to save data (agents or providers) to the correct storage area.
 * @param {string} key - The storage key for the data.
 * @param {Array<object>} data - The data to save.
 * @returns {Promise<void>}
 */
export async function saveData(key, data) {
    try {
        const storageArea = await getStorageArea();
        await storageArea.set({ [key]: data });
        console.log(`Data saved successfully for key ${key} via shared module.`);
    } catch (error) {
        console.error(`Error saving data for key ${key} via shared module:`, error);
    }
}


/**
 * Retrieves all agents from the appropriate storage area.
 * @returns {Promise<Array<object>>} A promise that resolves to the array of agents.
 */
export const getAgents = () => getData(STORAGE_KEY_AGENTS);

/**
 * Saves the agents array to the appropriate storage area.
 * @param {Array<object>} agents - The array of agents to save.
 * @returns {Promise<void>}
 */
export const saveAgents = (agents) => saveData(STORAGE_KEY_AGENTS, agents);


/**
 * Retrieves all providers from the appropriate storage area.
 * @returns {Promise<Array<object>>} A promise that resolves to the array of providers.
 */
export const getProviders = () => getData(STORAGE_KEY_PROVIDERS);

/**
 * Saves the providers array to the appropriate storage area.
 * @param {Array<object>} providers - The array of providers to save.
 * @returns {Promise<void>}
 */
export const saveProviders = (providers) => saveData(STORAGE_KEY_PROVIDERS, providers);
