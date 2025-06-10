
import { useState, useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import { Move, AuditLogEntry, PickupLocation } from '../types';
import { generateId } from '../utils/helpers';
import { MOCK_USER_ID } from '../constants'; // Assuming a mock user for now

const MOVES_STORAGE_KEY = 'movemaestro-moves';

export interface UseMovesReturn {
  moves: Move[];
  isLoading: boolean;
  error: string | null;
  fetchMoves: () => void;
  getMoveById: (id: string) => Move | undefined;
  addMove: (moveData: Omit<Move, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'auditLog' | 'pickupLocations' | 'sharedWith'>) => Promise<Move>;
  updateMove: (id: string, updates: Partial<Omit<Move, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'auditLog'>>) => Promise<Move>;
  deleteMove: (id: string) => Promise<void>;
  addAuditLog: (moveId: string, action: string, details?: string) => void;
  addPickupLocation: (moveId: string, locationData: Omit<PickupLocation, 'id'>) => Promise<void>;
  updatePickupLocation: (moveId: string, locationId: string, updates: Partial<PickupLocation>) => Promise<void>;
  deletePickupLocation: (moveId: string, locationId: string) => Promise<void>;
}

export const useMoves = (): UseMovesReturn => {
  const [storedMoves, setStoredMoves] = useLocalStorage<Move[]>(MOVES_STORAGE_KEY, []);
  const [moves, setMoves] = useState<Move[]>(storedMoves);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMoves(storedMoves);
  }, [storedMoves]);

  const fetchMoves = useCallback(() => {
    setIsLoading(true);
    setError(null);
    // Simulate API call
    setTimeout(() => {
      setMoves(storedMoves);
      setIsLoading(false);
    }, 300);
  }, [storedMoves]);

  const getMoveById = useCallback((id: string) => {
    return moves.find(m => m.id === id);
  }, [moves]);

  const addAuditLogInternal = (move: Move, action: string, details?: string): Move => {
    const newLogEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId: MOCK_USER_ID, // Replace with actual user ID in a real app
      details,
    };
    return { ...move, auditLog: [...move.auditLog, newLogEntry], updatedAt: new Date().toISOString() };
  };

  const addMove = useCallback(async (moveData: Omit<Move, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'auditLog' | 'pickupLocations' | 'sharedWith'>): Promise<Move> => {
    setIsLoading(true);
    setError(null);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMove: Move = {
          ...moveData,
          id: generateId(),
          userId: MOCK_USER_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          auditLog: [{ timestamp: new Date().toISOString(), action: "Move Created", userId: MOCK_USER_ID }],
          pickupLocations: [],
          sharedWith: [],
        };
        setStoredMoves(prev => [...prev, newMove]);
        setIsLoading(false);
        resolve(newMove);
      }, 500);
    });
  }, [setStoredMoves]);

  const updateMove = useCallback(async (id: string, updates: Partial<Omit<Move, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'auditLog'>>): Promise<Move> => {
    setIsLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let updatedMove: Move | undefined;
        setStoredMoves(prev => {
          const newMoves = prev.map(m => {
            if (m.id === id) {
              updatedMove = addAuditLogInternal({ ...m, ...updates }, "Move Updated", `Fields updated: ${Object.keys(updates).join(', ')}`);
              return updatedMove;
            }
            return m;
          });
          return newMoves;
        });
        setIsLoading(false);
        if (updatedMove) {
          resolve(updatedMove);
        } else {
          reject(new Error("Move not found for update"));
        }
      }, 500);
    });
  }, [setStoredMoves]);

  const deleteMove = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, also delete associated packages or handle cascading deletes.
        // For this frontend demo, we'll just remove the move.
        // Consider implications for packages associated with this moveId if they are stored separately.
        setStoredMoves(prev => prev.filter(m => m.id !== id));
        setIsLoading(false);
        resolve();
      }, 500);
    });
  }, [setStoredMoves]);

  const addAuditLog = useCallback((moveId: string, action: string, details?: string) => {
    setStoredMoves(prev => 
      prev.map(m => m.id === moveId ? addAuditLogInternal(m, action, details) : m)
    );
  }, [setStoredMoves]);

  const addPickupLocation = useCallback(async (moveId: string, locationData: Omit<PickupLocation, 'id'>): Promise<void> => {
    setStoredMoves(prevMoves => 
      prevMoves.map(move => {
        if (move.id === moveId) {
          const newLocation: PickupLocation = { ...locationData, id: generateId() };
          const updatedMove = addAuditLogInternal(
            { ...move, pickupLocations: [...move.pickupLocations, newLocation] },
            "Pickup Location Added",
            `Address: ${newLocation.address}`
          );
          return updatedMove;
        }
        return move;
      })
    );
  }, [setStoredMoves]);

  const updatePickupLocation = useCallback(async (moveId: string, locationId: string, updates: Partial<PickupLocation>): Promise<void> => {
     setStoredMoves(prevMoves => 
      prevMoves.map(move => {
        if (move.id === moveId) {
          const updatedLocations = move.pickupLocations.map(loc => 
            loc.id === locationId ? { ...loc, ...updates } : loc
          );
          const updatedMove = addAuditLogInternal(
            { ...move, pickupLocations: updatedLocations },
            "Pickup Location Updated",
            `Location ID: ${locationId}`
          );
          return updatedMove;
        }
        return move;
      })
    );
  }, [setStoredMoves]);

  const deletePickupLocation = useCallback(async (moveId: string, locationId: string): Promise<void> => {
    setStoredMoves(prevMoves => 
      prevMoves.map(move => {
        if (move.id === moveId) {
          const updatedLocations = move.pickupLocations.filter(loc => loc.id !== locationId);
          const updatedMove = addAuditLogInternal(
            { ...move, pickupLocations: updatedLocations },
            "Pickup Location Deleted",
            `Location ID: ${locationId}`
          );
          return updatedMove;
        }
        return move;
      })
    );
  }, [setStoredMoves]);


  // Initial fetch
  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  return { moves, isLoading, error, fetchMoves, getMoveById, addMove, updateMove, deleteMove, addAuditLog, addPickupLocation, updatePickupLocation, deletePickupLocation };
};
