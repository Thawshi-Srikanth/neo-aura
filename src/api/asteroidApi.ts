
import { type Asteroid } from '../types/asteroid';

const API_KEY = import.meta.env.VITE_NASA_API_KEY || '6JgssMLO8fnh4Jh3RULUL8aT5ZfOBXSwUryhtwXx';
const API_URL = 'https://api.nasa.gov/neo/rest/v1/neo/browse';

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
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('An error occurred while fetching the data.');
    }
    return response.json();
};

export const getAsteroidsUrl = (page: number, size: number = 20) => {
    return `${API_URL}?page=${page}&size=${size}&api_key=${API_KEY}`;
};
