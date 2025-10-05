
import { type Asteroid } from '../types/asteroid';

const API_URL = 'https://api.nasa.gov/neo/rest/v1/neo/browse';

// API Key Management System
class ApiKeyManager {
    private keys: string[] = [];
    private failedKeys: Set<string> = new Set();
    private lastUsedKeyIndex: number = -1;

    constructor() {
        this.initializeKeys();
    }

    private initializeKeys() {
        // Get keys from single environment variable (comma-separated)
        const keysString = import.meta.env.VITE_NASA_API_KEYS || import.meta.env.VITE_NASA_API_KEY;
        
        if (keysString) {
            // Split by comma and clean up whitespace
            this.keys = keysString.split(',').map((key: string) => key.trim()).filter(Boolean);
        }
        
        // Fallback to default if no keys found
        if (this.keys.length === 0) {
            this.keys = ['demo'];
        }
    }

    getRandomKey(): string {
        const availableKeys = this.keys.filter(key => !this.failedKeys.has(key));
        
        if (availableKeys.length === 0) {
            // Reset failed keys if all are exhausted
            this.failedKeys.clear();
            // Clear URL cache to get fresh keys
            clearUrlCache();
            return this.keys[Math.floor(Math.random() * this.keys.length)];
        }

        return availableKeys[Math.floor(Math.random() * availableKeys.length)];
    }

    markKeyAsFailed(key: string) {
        this.failedKeys.add(key);
    }

    getNextKey(): string {
        this.lastUsedKeyIndex = (this.lastUsedKeyIndex + 1) % this.keys.length;
        return this.keys[this.lastUsedKeyIndex];
    }

    hasAvailableKeys(): boolean {
        return this.keys.some(key => !this.failedKeys.has(key));
    }

    resetFailedKeys() {
        this.failedKeys.clear();
    }
}

const apiKeyManager = new ApiKeyManager();

// URL cache to prevent repeated calls with different keys
const urlCache = new Map<string, string>();

export interface ApiResponse {
    links: {
        next?: string;
        prev?: string;
        self: string;
    };
    page: {
        size: number;
        total_elements: number;
        total_pages: number;
        number: number;
    };
    near_earth_objects: Asteroid[];
}

export const fetcher = async (url: string): Promise<ApiResponse> => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            
            if (response.ok) {
                return response.json();
            }

            // Check if it's an API key related error
            if (response.status === 403 || response.status === 401) {
                // Extract API key from URL and mark it as failed
                const urlObj = new URL(url);
                const apiKey = urlObj.searchParams.get('api_key');
                if (apiKey) {
                    apiKeyManager.markKeyAsFailed(apiKey);
                }
                
                // Try with a different key if available
                if (apiKeyManager.hasAvailableKeys()) {
                    const newKey = apiKeyManager.getRandomKey();
                    const newUrl = url.replace(/api_key=[^&]+/, `api_key=${newKey}`);
                    const retryResponse = await fetch(newUrl);
                    
                    if (retryResponse.ok) {
                        return retryResponse.json();
                    }
                }
            }

            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Network error');
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }

    throw lastError || new Error('Failed to fetch data after multiple attempts');
};

export const getAsteroidsUrl = (page: number, size: number = 20) => {
    const cacheKey = `${page}-${size}`;
    
    // Return cached URL if available
    if (urlCache.has(cacheKey)) {
        return urlCache.get(cacheKey)!;
    }
    
    // Generate new URL with random key and cache it
    const apiKey = apiKeyManager.getRandomKey();
    const url = `${API_URL}?page=${page}&size=${size}&api_key=${apiKey}`;
    urlCache.set(cacheKey, url);
    
    return url;
};

// Function to clear URL cache (useful when all keys fail)
export const clearUrlCache = () => {
    urlCache.clear();
};
