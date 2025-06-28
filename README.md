# My IA Assistant - Chrome Extension

This is a personal project developed for my own use. I'm sharing it in the hope that it might be useful to others.

Please keep in mind that I'm not a Chrome extension or JavaScript developer, so there might be some rough edges.

## Description

"My IA Assistant" is a Google Chrome extension that allows you to create and use custom artificial intelligence (AI) agents to quickly interact with selected text on any web page. Easily analyze, summarize, rephrase, or perform any other contextual action on text content using your own AI agents.

## Key Features

*   **Custom AI Agents:** Create multiple agents with specific system/user prompts, models (GPT-4, GPT-3.5, etc.), and advanced settings (temperature, etc.).
*   **Multiple Providers:** Configure different AI API providers (OpenAI, OpenRouter, or any compatible one) with their own API keys and endpoints.
*   **Quick Interaction:** Select text on a page, right-click, choose "My IA Assistant", then click the extension icon to open the popup.
*   **Contextual Popup:**
    *   Displays the selected text (or the entire page text if nothing is selected).
    *   Allows choosing the AI agent to use.
    *   Shows the AI's response with a copy button.
    *   Persists the text and response if the popup is closed and reopened (via localStorage).
*   **Comprehensive Options Page:** Manage your agents, providers, and general settings (dark mode, local/sync storage).
*   **Import/Export:** Save and restore your entire configuration (agents, providers, settings) via a JSON file.
*   **Dark Mode:** Interface adaptable to light or dark themes.

## Installation (Development)

1.  Clone or download this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" in the top right corner.
4.  Click "Load unpacked".
5.  Select the root project folder (the folder containing `manifest.json`).
6.  The "My IA Assistant" extension should now appear in your extensions list and its icon in the toolbar.

## Quick Start

1.  **Configure a Provider:**
    *   Click the extension icon > Options (or right-click the icon > Options).
    *   Go to the "Providers" tab.
    *   Click "Add Provider", fill in the information (Name, API Key, Endpoint if necessary, Available Models if known). Save.
2.  **Create an Agent:**
    *   Go to the "Agents" tab.
    *   Click "Add Agent".
    *   Give it a name, choose the created provider, specify a model (if not listed, enter it manually after checking its availability with the provider), write your system and user prompts (use `{{selected_text}}` in the user prompt to insert the page text). Configure advanced settings if needed. Save.
3.  **Use the Agent:**
    *   On a web page, select some text.
    *   Right-click and choose "My IA Assistant".
    *   Click the extension icon in the toolbar.
    *   The popup opens with the selected text.
    *   Choose the desired agent from the dropdown list.
    *   Click "Query Agent".
    *   The response appears in the lower text area. You can copy it or clear the fields.

---

For more detailed information, please refer to the following guides:

*   **[User Guide](./docs/user_guide.md)**: To learn how to install, configure, and use the extension.
*   **[Technical Guide](./docs/technical_guide.md)**: To understand the architecture and contribute to the project.