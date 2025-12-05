import { useState } from 'react';
import type { 
  CreateEntryCommand, 
  UpdateEntryCommand, 
  EditScope, 
  DeleteScope, 
  EntrySeriesDetailDTO,
  EntrySeriesDTO,
  DeleteEntryResponseDTO,
  OccurrenceEditResponseDTO,
  FutureEditResponseDTO,
  EntireEditResponseDTO
} from '@/types';

interface UseEntryMutationsResult {
  createEntry: (data: CreateEntryCommand) => Promise<EntrySeriesDTO>;
  updateEntry: (
    id: string, 
    data: UpdateEntryCommand, 
    scope: EditScope, 
    date: string
  ) => Promise<OccurrenceEditResponseDTO | FutureEditResponseDTO | EntireEditResponseDTO>;
  deleteEntry: (id: string, scope: DeleteScope, date: string) => Promise<DeleteEntryResponseDTO>;
  fetchEntryDetails: (id: string) => Promise<EntrySeriesDetailDTO>;
  isMutating: boolean;
  error: string | null;
}

export const useEntryMutations = (): UseEntryMutationsResult => {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async <T>(url: string, options: RequestInit): Promise<T> => {
    setIsMutating(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'An error occurred');
      }

      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const createEntry = async (data: CreateEntryCommand) => {
    return handleRequest<EntrySeriesDTO>('/api/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const updateEntry = async (id: string, data: UpdateEntryCommand, scope: EditScope, date: string) => {
    const query = new URLSearchParams({ scope });
    if (scope !== 'entire') {
      query.append('date', date);
    }
    return handleRequest<OccurrenceEditResponseDTO | FutureEditResponseDTO | EntireEditResponseDTO>(
      `/api/entries/${id}?${query.toString()}`, 
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  };

  const deleteEntry = async (id: string, scope: DeleteScope, date: string) => {
    const query = new URLSearchParams({ scope });
    if (scope !== 'entire') {
      query.append('date', date);
    }
    return handleRequest<DeleteEntryResponseDTO>(`/api/entries/${id}?${query.toString()}`, {
      method: 'DELETE',
    });
  };

  const fetchEntryDetails = async (id: string) => {
    return handleRequest<EntrySeriesDetailDTO>(`/api/entries/${id}`, {
      method: 'GET',
      headers: { "Cache-Control": "no-cache" }
    });
  };

  return {
    createEntry,
    updateEntry,
    deleteEntry,
    fetchEntryDetails,
    isMutating,
    error,
  };
};
