// options/importExport.js
import { getSettings, saveSettings, getProviders, saveProviders, getAgents, saveAgents } from '../js/storage.js';
import { renderAgentList, renderProviderList } from './ui.js';

/**
 * Handles the export of all application data to a JSON file.
 */
export async function handleExportAll() {
    try {
        const settings = await getSettings();
        const providers = await getProviders();
        const agents = await getAgents();

        const configData = {
            version: 1,
            settings,
            providers,
            agents
        };

        const jsonString = JSON.stringify(configData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `my-ia-assistant-config_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(chrome.i18n.getMessage("optionsLogConfigExported"));
        alert(chrome.i18n.getMessage("optionsAlertConfigExportedSuccess"));
    } catch (error) {
        console.error(chrome.i18n.getMessage("optionsLogErrorExportingConfig"), error);
        alert(chrome.i18n.getMessage("optionsAlertErrorExportingConfig"));
    }
}

/**
 * Handles the file selection and initiates the import process.
 * @param {Event} event - The file input change event.
 */
export function handleImportFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            if (!config || !config.settings || !config.providers || !config.agents) {
                throw new Error(chrome.i18n.getMessage("optionsErrorInvalidImportFileStructure"));
            }

            if (confirm(chrome.i18n.getMessage("optionsConfirmImportConfig", file.name))) {
                importConfiguration(config);
            }
        } catch (error) {
            console.error(chrome.i18n.getMessage("optionsLogErrorImportingConfig"), error);
            alert(chrome.i18n.getMessage("optionsAlertErrorImportingConfig", { errorMessage: error.message }));
        }
    };
    reader.onerror = () => {
        alert(chrome.i18n.getMessage("optionsErrorReadingFile"));
    };
    reader.readAsText(file);

    // Reset file input to allow importing the same file again
    event.target.value = '';
}

/**
 * Saves the imported configuration data to storage and re-renders the UI.
 * @param {Object} config - The configuration object to import.
 */
async function importConfiguration(config) {
    try {
        await saveSettings(config.settings);
        await saveProviders(config.providers);
        await saveAgents(config.agents);

        // Re-render UI with imported data
        await renderProviderList(config.providers);
        await renderAgentList(config.agents);
        // You might need to reload the page or update settings UI controls as well

        alert(chrome.i18n.getMessage("optionsAlertConfigImportedSuccess"));
        // Consider reloading the page to ensure all settings (like theme, language) are applied
        window.location.reload();
    } catch (error) {
        console.error(chrome.i18n.getMessage("optionsLogErrorImportingConfig"), error);
        alert(chrome.i18n.getMessage("optionsAlertErrorImportingConfig", { errorMessage: error.message }));
    }
}
