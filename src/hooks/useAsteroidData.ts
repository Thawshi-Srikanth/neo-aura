
import useSWRInfinite from 'swr/infinite';
import { fetcher, getAsteroidsUrl, type ApiResponse } from '../api/asteroidApi';
import type { Asteroid } from '../types/asteroid';

export const useAsteroidData = (size: number = 20) => {
    const { data, error, size: page, setSize, isValidating } = useSWRInfinite<ApiResponse>(
        (index) => getAsteroidsUrl(index, size),
        fetcher
    );

    const asteroids: Asteroid[] = data ? data.flatMap(response => response.near_earth_objects) : [];
    const isLoading = !data && !error;
    const isReachingEnd = data ? data[data.length - 1]?.page.number >= data[data.length - 1]?.page.total_pages : false;

    const loadMore = () => {
        if (!isReachingEnd && !isValidating) {
            setSize(page + 1);
        }
    };

    return {
        asteroids,
        isLoading,
        isError: error,
        isReachingEnd,
        loadMore,
    };
};
