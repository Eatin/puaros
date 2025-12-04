import axios from 'axios' // 需要安装axios: pnpm add axios
import type { ILLMClient, LLMResponse } from '../../domain/services/ILLMClient.js'
import type { ChatMessage } from '../../domain/value-objects/ChatMessage.js'
import type { LLMConfig } from '../../shared/constants/config.js'
import { IpuaroError } from '../../shared/errors/IpuaroError.js'
import { parseToolCalls } from './ResponseParser.js'

/**
 * OpenAI client implementation for ILLMClient interface.
 * Uses standard OpenAI API interface to work with ipuaro.
 */
export class OpenAIClient implements ILLMClient {
    private readonly apiKey: string
    private readonly apiBase: string
    private readonly model: string
    private readonly contextWindow: number
    private readonly temperature: number
    private readonly customHeaders: Record<string, string>
    private abortController: AbortController | null = null

    /**
     * Create OpenAI client.
     * @param config LLM configuration with additional OpenAI settings
     */
    constructor(config: LLMConfig & { apiKey: string; apiBase?: string }) {
        this.apiKey = config.apiKey
        this.apiBase = config.apiBase ?? 'https://api.openai.com/v1'
        this.model = config.model
        this.contextWindow = config.contextWindow ?? 128000
        this.temperature = config.temperature ?? 0.1
        this.customHeaders = config.headers ?? {}
    }

    /**
     * Send messages to OpenAI and get response.
     */
    async chat(messages: ChatMessage[]): Promise<LLMResponse> {
        this.abortController = new AbortController()

        try {
            const startTime = Date.now()
            const response = await axios.post(
                `${this.apiBase}/chat/completions`,
                {
                    model: this.model,
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    temperature: this.temperature,
                    max_tokens: 4096,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        ...this.customHeaders,
                    },
                    signal: this.abortController.signal,
                }
            )

            const timeMs = Date.now() - startTime
            const choice = response.data.choices[0]
            const originalContent = choice.message.content.trim()
            const tokens = response.data.usage?.completion_tokens ?? 0

            // Parse tool calls from response content
            const parsedResponse = parseToolCalls(originalContent)

            return {
                content: parsedResponse.content,
                toolCalls: parsedResponse.toolCalls,
                tokens,
                timeMs,
                truncated: false,
                stopReason: choice.finish_reason as any,
            }
        } catch (error) {
            throw this.handleError(error)
        } finally {
            this.abortController = null
        }
    }

    /**
     * Count tokens in text (approximate for OpenAI).
     */
    async countTokens(text: string): Promise<number> {
        // Simple approximation for GPT models
        // 1 token ~= 4 chars in English
        return Math.ceil(text.length / 4)
    }

    /**
     * Check if OpenAI service is available.
     */
    async isAvailable(): Promise<boolean> {
        try {
            await axios.get(`${this.apiBase}/models`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    ...this.customHeaders,
                },
                timeout: 5000,
            })
            return true
        } catch {
            return false
        }
    }

    /**
     * Get current model name.
     */
    getModelName(): string {
        return this.model
    }

    /**
     * Get context window size.
     */
    getContextWindowSize(): number {
        return this.contextWindow
    }

    /**
     * Pull model (no-op for OpenAI since models are remote).
     */
    async pullModel(model: string): Promise<void> {
        // No operation needed for OpenAI since models are remote
        return Promise.resolve()
    }

    /**
     * Abort current generation.
     */
    abort(): void {
        if (this.abortController) {
            this.abortController.abort()
            this.abortController = null
        }
    }

    /**
     * Handle and wrap errors.
     */
    private handleError(error: unknown): IpuaroError {
        const message = error instanceof Error ? error.message : String(error)
        
        if (error instanceof axios.AxiosError) {
            if (error.response) {
                const status = error.response.status
                if (status === 401) {
                    return IpuaroError.llm('Invalid OpenAI API key')
                } else if (status === 404) {
                    return IpuaroError.llm(`Model "${this.model}" not found`)
                } else if (status === 429) {
                    return IpuaroError.llm('OpenAI API rate limit exceeded')
                }
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
                return IpuaroError.llm(`Cannot connect to OpenAI at ${this.apiBase}`)
            }
        }

        return IpuaroError.llm(`OpenAI error: ${message}`)
    }
}