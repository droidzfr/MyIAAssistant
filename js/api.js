// js/api.js

/**
 * Sends a query to the specified AI provider's API.
 * 
 * @param {object} agent - The agent configuration object.
 * @param {object} provider - The provider configuration object.
 * @param {string} text - The text to be processed by the agent.
 * @returns {Promise<string>} A promise that resolves with the AI's response text.
 * @throws {Error} Throws an error if the API request fails or the response is invalid.
 */
export async function queryAI(agent, provider, text) {
    if (!provider.apiKey) {
        throw new Error(`API key for provider "${provider.name}" is missing.`);
    }

    const endpointUrl = provider.endpointUrl || 'https://api.openai.com/v1/chat/completions';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
    };

    // Add specific headers for OpenRouter if applicable
    if (endpointUrl.toLowerCase().includes('openrouter')) {
        headers['HTTP-Referer'] = 'https://github.com/droidzfr/MyIAAssistant'; // Recommended by OpenRouter
        headers['X-Title'] = 'My IA Assistant'; // Recommended by OpenRouter
    }

    const messages = [];
    if (agent.systemPrompt) {
        messages.push({ role: "system", content: agent.systemPrompt });
    }
    let userPrompt = text;
    if (agent.userPrompt) {
        if (agent.userPrompt.includes("{{selected_text}}")) {
            userPrompt = agent.userPrompt.replace("{{selected_text}}", text);
        } else {
            userPrompt = `${agent.userPrompt}\n\n${text}`;
        }
    }
    messages.push({ role: "user", content: userPrompt });

    const body = {
        model: agent.model,
        messages: messages,
        stream: false
    };

    // Add optional numeric parameters if they are valid
    const addNumericParam = (paramName, value) => {
        if (value !== undefined && value !== null && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                body[paramName] = numValue;
            }
        }
    };

    addNumericParam('temperature', agent.temperature);
    addNumericParam('top_p', agent.top_p);
    addNumericParam('presence_penalty', agent.presence_penalty);
    addNumericParam('frequency_penalty', agent.frequency_penalty);

    const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        let errorDetails = `Status: ${response.status} ${response.statusText}.`;
        try {
            const errorBody = await response.json();
            errorDetails += ` Details: ${JSON.stringify(errorBody.error || errorBody)}`;
        } catch (e) {
            const textError = await response.text();
            errorDetails += ` Response: ${textError}`;
        }
        throw new Error(`API request failed. ${errorDetails}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content;

    if (typeof assistantResponse === 'string') {
        return assistantResponse.trim();
    } else {
        throw new Error('Invalid response format from API.');
    }
}
