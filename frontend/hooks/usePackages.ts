
import { useState, useCallback, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import { Package, PackageType, LocationStatus, AuditLogEntry, PackageContentItem } from '../types';
import { generateId } from '../utils/helpers';
import { MOCK_USER_ID, QR_CODE_PREFIX } from '../constants';

const PACKAGES_STORAGE_KEY_PREFIX = 'movemaestro-packages-'; // Append moveId

export interface UsePackagesReturn {
  packages: Package[];
  isLoading: boolean;
  error: string | null;
  fetchPackages: (moveId: string) => void;
  getPackageById: (packageId: string) => Package | undefined;
  addPackage: (moveId: string, packageData: Omit<Package, 'id' | 'moveId' | 'qrCodeValue' | 'createdAt' | 'updatedAt' | 'auditLog'>) => Promise<Package>;
  updatePackage: (packageId: string, updates: Partial<Omit<Package, 'id' | 'moveId' | 'qrCodeValue' | 'createdAt' | 'updatedAt' | 'auditLog'>>) => Promise<Package>;
  deletePackage: (packageId: string) => Promise<void>;
  addPackageAuditLog: (packageId: string, action: string, details?: string) => void;
  getNextPackageId: (moveId: string, type: PackageType) => string;
}

export const usePackages = (currentMoveId?: string): UsePackagesReturn => {
  const storageKey = currentMoveId ? `${PACKAGES_STORAGE_KEY_PREFIX}${currentMoveId}` : '';
  const [storedPackages, setStoredPackages] = useLocalStorage<Package[]>(storageKey, []);
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update local packages state when storedPackages or currentMoveId changes
  useEffect(() => {
    if (currentMoveId) {
      // This effect ensures that if currentMoveId changes, we re-fetch/re-set based on the new key
      // Or if storedPackages for the current key changes (e.g. from another tab)
      setPackages(storedPackages);
    } else {
      setPackages([]); // Clear packages if no move is selected
    }
  }, [storedPackages, currentMoveId]);


  const fetchPackages = useCallback((moveId: string) => {
    if (!moveId) {
      setPackages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    // Simulate API call, in reality this uses the specific storageKey based on moveId
    // which useLocalStorage already handles. We just need to trigger a re-read if needed,
    // but useEffect above should handle it. This fetch is more for symmetry.
    setTimeout(() => {
        // `storedPackages` is already scoped to the currentMoveId due to the key used in useLocalStorage.
        // So, we just set `packages` from `storedPackages`.
        setPackages(storedPackages); 
        setIsLoading(false);
    }, 300);
  }, [storedPackages]);


  const getPackageById = useCallback((packageId: string) => {
    return packages.find(p => p.id === packageId);
  }, [packages]);

  const addPackageAuditLogInternal = (pkg: Package, action: string, details?: string): Package => {
    const newLogEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId: MOCK_USER_ID, 
      details,
    };
    return { ...pkg, auditLog: [...(pkg.auditLog || []), newLogEntry], updatedAt: new Date().toISOString() };
  };

  const getNextPackageId = useCallback((moveId: string, type: PackageType): string => {
    // This needs to look at packages for the specific moveId.
    // The `packages` state variable should already be filtered by currentMoveId.
    const typePackages = packages.filter(p => p.type === type && p.moveId === moveId);
    const count = typePackages.length;
    return `${type.toLowerCase()}${count + 1}`; // e.g., box1, box2, trunk1
  }, [packages]);


  const addPackage = useCallback(async (
    moveId: string, 
    packageData: Omit<Package, 'id' | 'moveId' | 'qrCodeValue' | 'createdAt' | 'updatedAt' | 'auditLog'>
  ): Promise<Package> => {
    if (!currentMoveId || currentMoveId !== moveId) {
        setError("Mismatched moveId or no move selected for adding package.");
        return Promise.reject(new Error("Mismatched moveId or no move selected."));
    }

    setIsLoading(true);
    setError(null);
    return new Promise((resolve) => {
      setTimeout(() => {
        const packageId = getNextPackageId(moveId, packageData.type);
        const newPackage: Package = {
          ...packageData,
          id: packageId,
          moveId: moveId,
          qrCodeValue: `${QR_CODE_PREFIX}${packageId}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          auditLog: [{ timestamp: new Date().toISOString(), action: "Package Created", userId: MOCK_USER_ID }],
        };
        setStoredPackages(prev => [...prev, newPackage]);
        setIsLoading(false);
        resolve(newPackage);
      }, 500);
    });
  }, [setStoredPackages, getNextPackageId, currentMoveId]);

  const updatePackage = useCallback(async (
    packageId: string, 
    updates: Partial<Omit<Package, 'id' | 'moveId' | 'qrCodeValue' | 'createdAt' | 'updatedAt' | 'auditLog'>>
  ): Promise<Package> => {
    if (!currentMoveId) {
        setError("No move selected for updating package.");
        return Promise.reject(new Error("No move selected."));
    }
    setIsLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let updatedPackage: Package | undefined;
        setStoredPackages(prev => {
          const newPackages = prev.map(p => {
            if (p.id === packageId && p.moveId === currentMoveId) {
              updatedPackage = addPackageAuditLogInternal({ ...p, ...updates }, "Package Updated", `Fields updated: ${Object.keys(updates).join(', ')}`);
              return updatedPackage;
            }
            return p;
          });
          return newPackages;
        });
        setIsLoading(false);
        if (updatedPackage) {
          resolve(updatedPackage);
        } else {
          reject(new Error("Package not found for update or mismatched move."));
        }
      }, 500);
    });
  }, [setStoredPackages, currentMoveId]);

  const deletePackage = useCallback(async (packageId: string): Promise<void> => {
    if (!currentMoveId) {
        setError("No move selected for deleting package.");
        return Promise.reject(new Error("No move selected."));
    }
    setIsLoading(true);
    setError(null);
    return new Promise((resolve) => {
      setTimeout(() => {
        setStoredPackages(prev => prev.filter(p => p.id !== packageId || p.moveId !== currentMoveId));
        setIsLoading(false);
        resolve();
      }, 500);
    });
  }, [setStoredPackages, currentMoveId]);
  
  const addPackageAuditLog = useCallback((packageId: string, action: string, details?: string) => {
    if (!currentMoveId) return;
    setStoredPackages(prev => 
      prev.map(p => (p.id === packageId && p.moveId === currentMoveId) ? addPackageAuditLogInternal(p, action, details) : p)
    );
  }, [setStoredPackages, currentMoveId]);


  // Initial fetch when currentMoveId changes or on mount if currentMoveId is set
  useEffect(() => {
    if (currentMoveId) {
      fetchPackages(currentMoveId);
    } else {
      setPackages([]); // Clear packages if no move is selected
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMoveId]); // Removed fetchPackages from dep array to avoid loop, it's stable

  return { packages, isLoading, error, fetchPackages, getPackageById, addPackage, updatePackage, deletePackage, addPackageAuditLog, getNextPackageId };
};
