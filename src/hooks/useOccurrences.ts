import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { DashboardFilters } from '@/components/dashboard/entries/schema';
import type { OccurrenceDTO, OccurrenceListResponseDTO } from '@/types';

export const useOccurrences = (filters: DashboardFilters) => {
  const [occurrences, setOccurrences] = useState<OccurrenceDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Keep track of pagination if we implement "Load More", 
  // but for now let's fetch all within range or use default limit
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 100,
    total: 0
  });

  const fetchOccurrences = useCallback(async (reset = false) => {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        from_date: format(filters.dateRange.from, 'yyyy-MM-dd'),
        to_date: format(filters.dateRange.to, 'yyyy-MM-dd'),
        limit: pagination.limit.toString(),
        offset: reset ? '0' : pagination.offset.toString(),
      });

      if (filters.entryType !== 'all') {
        queryParams.append('entry_type', filters.entryType);
      }

      const response = await fetch(`/api/occurrences?${queryParams.toString()}`, {
        headers: { "Cache-Control": "no-cache" }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch occurrences');
      }

      const data: OccurrenceListResponseDTO = await response.json();
      
      setOccurrences(prev => reset ? data.data : [...prev, ...data.data]);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        offset: reset ? data.data.length : prev.offset + data.data.length
      }));
      setHasMore(data.pagination.offset + data.data.length < data.pagination.total);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  // Reset and fetch when filters change
  useEffect(() => {
    // Reset pagination and occurrences
    setPagination(prev => ({ ...prev, offset: 0 }));
    // We pass reset=true to fetchOccurrences
    fetchOccurrences(true);
  }, [filters.dateRange.from, filters.dateRange.to, filters.entryType]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchOccurrences(false);
    }
  };

  const refresh = () => {
    fetchOccurrences(true);
  };

  return {
    occurrences,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};


