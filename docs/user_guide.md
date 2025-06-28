# User Guide - My IA Assistant

This guide will help you install, configure, and use the "My IA Assistant" Chrome extension.

## Table of Contents

- [User Guide - My IA Assistant](#user-guide---my-ia-assistant)
  - [Table of Contents](#table-of-contents)
  - [1. Introduction](#1-introduction)
  - [2. Installation](#2-installation)
  - [3. Interface Overview](#3-interface-overview)
    - [The Popup](#the-popup)
    - [The Options Page](#the-options-page)
  - [4. Initial Setup: Providers](#4-initial-setup-providers)
    - [Adding a Provider](#adding-a-provider)
    - [Editing/Deleting a Provider](#editingdeleting-a-provider)
  - [5. Creating and Managing AI Agents](#5-creating-and-managing-ai-agents)
    - [Adding an Agent](#adding-an-agent)
    - [Understanding Agent Fields](#understanding-agent-fields)
    - [Editing/Deleting an Agent](#editingdeleting-an-agent)
  - [6. Daily Agent Usage](#6-daily-agent-usage)
    - [Selecting Text and Launching the Agent](#selecting-text-and-launching-the-agent)
    - [Using the Popup](#using-the-popup)
  - [7. Advanced Settings](#7-advanced-settings)
    - [Dark Mode](#dark-mode)
    - [Local vs. Synced Storage](#local-vs-synced-storage)
  - [8. Configuration Import and Export](#8-configuration-import-and-export)
    - [Exporting](#exporting)
    - [Importing](#importing)
  - [9. Troubleshooting and FAQ](#9-troubleshooting-and-faq)

---

## 1. Introduction

"My IA Assistant" is a Google Chrome extension designed to let you create and use custom artificial intelligence (AI) agents. These agents can interact with the text you select on any web page to analyze, summarize, rephrase, or perform any other contextual action you define.

## 2. Installation

As the extension is not yet published on the Chrome Web Store, here is how to install it for development:

1.  **Download the code**: Clone or download this repository to your computer.
2.  **Open Chrome**: Go to the extensions page by typing `chrome://extensions/` in the address bar.
3.  **Enable Developer Mode**: Check the "Developer mode" switch in the top right corner of the page.
4.  **Load the extension**: Click the "Load unpacked" button and select the project's root folder (the one containing the `manifest.json` file).
5.  **All set!** The "My IA Assistant" icon should now appear in your Chrome toolbar.

## 3. Interface Overview

### The Popup

The popup is the main interface for interacting with your agents. It contains:

*   **Selected text area**: Displays the text you have selected on the page.
*   **Agent selector**: Allows you to choose which AI agent to use.
*   **"Query Agent" button**: Sends the request to the selected agent.
*   **Response area**: Displays the agent's response.
*   **Action buttons**: Copy the response, clear the fields, and open the options page.

### The Options Page

The options page allows you to configure the extension. It is organized into several tabs:

*   **Agents**: Manage your AI agents (create, edit, delete).
*   **Providers**: Configure API providers (OpenAI, OpenRouter, etc.).
*   **Settings**: Manage general settings like dark mode and storage.
*   **Import/Export**: Save and restore your configuration.

## 4. Initial Setup: Providers

Before you can create an agent, you must configure at least one API provider. This provider is what gives you access to the AI models.

### Adding a Provider

1.  Go to the "Providers" tab and click "Add Provider".
2.  Fill in the fields:
    *   **Name**: A name to recognize the provider (e.g., "My OpenAI Account").
    *   **API Key**: Your secret API key.
    *   **Endpoint URL**: Leave empty for default OpenAI, or specify a URL for compatible providers (e.g., OpenRouter).
    *   **Available Models**: List the models you want to use (e.g., `gpt-4`, `gpt-3.5-turbo`).
3.  Save.

### Editing/Deleting a Provider

Use the "Edit" and "Delete" buttons next to each provider in the list to modify or remove them.

## 5. Creating and Managing AI Agents

### Adding an Agent

1.  Go to the "Agents" tab and click "Add Agent".
2.  Fill out the form with your agent's information.

### Understanding Agent Fields

*   **Name**: A name for your agent (e.g., "English to French Translator").
*   **Provider**: Choose the API provider this agent should use.
*   **Model**: Specify the AI model (e.g., `gpt-4`).
*   **System Prompt**: Instructions for the AI (e.g., "You are an expert translator.").
*   **User Prompt**: The task to be performed. Use `{{selected_text}}` to insert the selected text.
*   **Advanced Settings**: Parameters like `temperature` to control the AI's creativity. These settings override the provider's defaults.

### Editing/Deleting an Agent

Use the "Edit" and "Delete" buttons next to each agent to modify or remove them.

## 6. Daily Agent Usage

### Selecting Text and Launching the Agent

1.  On a web page, select the text you want to analyze.
2.  Right-click and choose "My IA Assistant" from the context menu.
3.  Click the extension's icon in the Chrome toolbar to open the popup.

### Using the Popup

1.  In the popup, the selected text will appear.
2.  Choose the agent you want to use from the dropdown menu.
3.  Click "Query Agent" to get a response.
4.  Use the buttons to copy the response or clear the fields.

## 7. Advanced Settings

### Dark Mode

Enable or disable dark mode from the "Settings" tab to adjust the interface to your preference.

### Local vs. Synced Storage

*   **Local**: Your data is stored only on your current computer.
*   **Sync**: Your data is synchronized across all your Chrome devices via your Google account. Be mindful of Chrome's storage quotas.

Switching between the two modes does not automatically migrate data.

## 8. Configuration Import and Export

### Exporting

In the "Import/Export" tab, click "Export Configuration" to download a JSON file containing all your agents, providers, and settings.

### Importing

Click "Import Configuration", select a JSON file, and confirm. **Warning: Importing will replace your entire current configuration.**

## 9. Troubleshooting and FAQ

*   **API Error**: Check that your API key and endpoint URL are correct in the "Providers" tab.
*   **Agent not found**: Make sure the agent is configured correctly and linked to a valid provider.
*   **The popup doesn't open**: After right-clicking, you must click the extension's icon to open it. This is the normal behavior for Manifest V3.