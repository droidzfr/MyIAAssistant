// options/localization.js

let messages = {};

/**
 * Fetches and loads the translation messages for a given language.
 * @param {string} lang - The language code (e.g., 'en', 'fr'). 'auto' will use the browser's UI language.
 */
async function loadMessages(lang) {
    let languageCode = lang;
    if (languageCode === 'auto') {
        languageCode = chrome.i18n.getUILanguage().split('-')[0];
    }

    const url = chrome.runtime.getURL(`_locales/${languageCode}/messages.json`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Could not fetch messages for language: ${languageCode}. Status: ${response.status}`);
        }
        messages = await response.json();
    } catch (error) {
        console.warn(error.message, `Falling back to 'en'.`);
        // Fallback to English if the language file is not found
        if (languageCode !== 'en') {
            await loadMessages('en');
        }
    }
}

/**
 * Gets a translated message for a given key.
 * @param {string} key - The key of the message to retrieve.
 * @param {Array<string>} [substitutions] - An array of strings to substitute for placeholders.
 * @returns {string} The translated message or the key if not found.
 */
function getMessage(key, substitutions = []) {
    if (messages[key]) {
        let message = messages[key].message;
        // Handle placeholders like $1, $2, etc.
        if (substitutions.length > 0) {
            message = message.replace(/\$(\d)/g, (_, index) => {
                const subIndex = parseInt(index, 10) - 1;
                return substitutions[subIndex] || '';
            });
        }
        return message;
    }
    return key; // Return the key as a fallback
}

export const localization = {
    init: loadMessages,
    getMessage: getMessage,
};
