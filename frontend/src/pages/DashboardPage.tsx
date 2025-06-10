
import React, { useEffect, useMemo, useState, ChangeEvent } from 'react';
import { useMoves } from '../hooks/useMoves';
import { usePackages } from '../hooks/usePackages'; // We need a way to get ALL packages for dashboard stats
import { Move, Package, LocationStatus, AuditLogEntry } from '../types';
import { SummaryCard } from '../components/Dashboard/SummaryCard';
import { Spinner } from '../components/Common/Spinner';
import { HomeIcon, TruckIcon, PackageIcon, QrCodeIcon, SearchIcon, EyeIcon } from '../components/Common/Icons';
import { calculateVolume } from '../../utils/helpers'; // formatDate removed as not used directly here
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Common/Input';
import { QrCodeScanner } from '../components/Packages/QrCodeScanner';
import { Modal } from '../components/Common/Modal';
import { PackageDetailModal } from '../components/Packages/PackageDetailModal';
import { generatePdfLabel } from '../services/pdfService';
// import { QrCodeGenerator } from '../components/Packages/QrCodeGenerator'; // Not directly used for generation here
import { ActivityLogItem } from '../components/Dashboard/ActivityLogItem';
import { useNotification } from '../contexts/NotificationContext';
import { QR_CODE_PREFIX } from '../constants';
import { Button } from '../components/Common/Button'; // Added Button import
import { toCanvas as qrToCanvas } from 'qrcode'; // Added qrcode import

// Helper to get all packages from localStorage - this is a hack for dashboard.
// In a real app, this would be an API call.
const getAllPackagesFromLocalStorage = (): Package[] => {
    let allPackages: Package[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('movemaestro-packages-')) {
            try {
                const packagesInMove = JSON.parse(localStorage.getItem(key) || '[]') as Package[];
                allPackages = allPackages.concat(packagesInMove);
            } catch (e) {
                console.error(`Error parsing packages for key ${key}:`, e);
            }
        }
    }
    return allPackages;
};


export const DashboardPage: React.FC = () => {
  const { moves, isLoading: movesLoading, fetchMoves: refreshMovesHook } = useMoves();
  // For dashboard, we need all packages across all moves.
  // The usePackages hook is per-move. So we'll fetch them manually for this page.
  const [allPackages, setAllPackages] = useState<Package[]>(getAllPackagesFromLocalStorage());
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<Package | null>(null);
  // For package modal actions - need relevant hooks if actions are performed from dashboard
  // This is a simplified version; proper edit/delete from dashboard would need more context/hooks
  const { deletePackage: deletePackageHook, fetchPackages: refreshPackagesForMove } = usePackages(viewingPackage?.moveId);


  const refreshAllPackages = () => {
    setIsLoadingPackages(true);
    // Simulate fetching all packages
    setTimeout(() => {
        setAllPackages(getAllPackagesFromLocalStorage());
        setIsLoadingPackages(false);
    }, 300);
  };
  
  useEffect(() => {
    refreshMovesHook();
    refreshAllPackages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalMoves = moves.length;
  const totalPackages = allPackages.length;

  const packagesByType = useMemo(() => {
    return allPackages.reduce((acc, pkg) => {
      acc[pkg.type] = (acc[pkg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allPackages]);

  const overallProgress = useMemo(() => {
    if (totalPackages === 0) return 0;
    const atDestination = allPackages.filter(p => p.locationStatus === LocationStatus.DESTINATION).length;
    return Math.round((atDestination / totalPackages) * 100);
  }, [allPackages, totalPackages]);

  const totalVolumeAll = useMemo(() => {
    return allPackages.reduce((sum, pkg) => sum + calculateVolume(pkg.dimensions), 0).toFixed(2);
  }, [allPackages]);

  const recentActivity = useMemo(() => {
    let combinedLogs: AuditLogEntry[] = [];
    moves.forEach(move => combinedLogs.push(...(move.auditLog || [])));
    allPackages.forEach(pkg => combinedLogs.push(...(pkg.auditLog || [])));
    return combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }, [moves, allPackages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const foundPackage = allPackages.find(p => 
        p.id.toLowerCase() === searchTerm.toLowerCase() || 
        p.contents.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (foundPackage) {
        setViewingPackage(foundPackage);
    } else {
        addNotification(`Package "${searchTerm}" not found.`, "info");
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerModalOpen(false);
    if (decodedText.startsWith(QR_CODE_PREFIX)) {
        const packageId = decodedText.substring(QR_CODE_PREFIX.length);
        const foundPackage = allPackages.find(p => p.id === packageId);
        if (foundPackage) {
            setViewingPackage(foundPackage);
            addNotification(`Package ${packageId} found.`, "success");
        } else {
            addNotification(`Package ${packageId} not found across all moves.`, "warning");
        }
        setSearchTerm(packageId);
    } else {
        addNotification(`Scanned: ${decodedText}. Not a MoveMaestro QR code.`, "info");
        setSearchTerm(decodedText);
    }
  };

  const handleGenerateLabelFromDashboard = async (pkg: Package) => {
    if(!pkg || !pkg.qrCodeValue) {
      addNotification("Package data incomplete.", "error"); return;
    }
    const canvas = document.createElement('canvas');
    qrToCanvas(canvas, pkg.qrCodeValue, { width: 256, errorCorrectionLevel: 'H' }, (error: any) => {
      if (error) {
        addNotification("Failed to generate QR for PDF.", "error"); return;
      }
      generatePdfLabel(pkg, canvas.toDataURL());
    });
  };

  const handleDeletePackageFromDashboard = async (packageId: string) => {
    if (!viewingPackage || viewingPackage.id !== packageId) return; 
    
    if (window.confirm('Are you sure you want to delete this package?')) {
        try {
            await deletePackageHook(packageId); 
            addNotification("Package deleted successfully.", "success");
            setViewingPackage(null);
            refreshAllPackages(); 
            if (viewingPackage.moveId) refreshPackagesForMove(viewingPackage.moveId);
        } catch (error) {
            addNotification(error instanceof Error ? error.message : "Failed to delete package.", "error");
        }
    }
  };


  if (movesLoading || isLoadingPackages) {
    return <div className="p-8"><Spinner message="Loading dashboard..." size="lg" /></div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Total Moves" value={totalMoves} icon={<TruckIcon />} color="text-blue-500 border-blue-500" onClick={() => navigate('/moves')} />
        <SummaryCard title="Total Packages" value={totalPackages} icon={<PackageIcon />} color="text-green-500 border-green-500" />
        <SummaryCard title="Overall Progress" value={`${overallProgress}%`} icon={<HomeIcon />} unit="Moved" color="text-purple-500 border-purple-500" />
        <SummaryCard title="Total Volume" value={totalVolumeAll} unit="m³" icon={<EyeIcon />} color="text-yellow-500 border-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search and Quick Actions */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Find a Package</h2>
          <form onSubmit={handleSearch} className="space-y-3">
            <Input
              type="search"
              placeholder="Enter Package ID or Content Name"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon className="w-4 h-4 text-gray-400" />}
              containerClassName="mb-0"
            />
            <div className="flex space-x-2">
                <Button type="submit" className="flex-1">Search</Button>
                <Button type="button" variant="outline" onClick={() => setIsScannerModalOpen(true)} leftIcon={<QrCodeIcon className="w-5 h-5"/>} className="flex-1">
                    Scan QR
                </Button>
            </div>
          </form>
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-600 mb-2">Quick Actions</h3>
            <Button onClick={() => navigate('/moves')} variant="outline" className="w-full mb-2">Manage Moves</Button>
            {/* A "Create Package" here would need to select a move first, or go to a generic package creation flow */}
            {/* <Button onClick={() => { /* needs logic to select move * / }} variant="outline" className="w-full">Create New Package</Button> */}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {recentActivity.map((log, index) => (
                <ActivityLogItem key={`${log.timestamp}-${index}`} log={log} />
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent activity to display.</p>
          )}
        </div>
      </div>
      
      {/* Packages by Type - could be a chart */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Packages by Type</h2>
        {Object.keys(packagesByType).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(packagesByType).map(([type, count]) => (
                <div key={type} className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-slate-700">{count}</p>
                <p className="text-sm text-slate-500">{type}</p>
                </div>
            ))}
            </div>
        ) : (
            <p className="text-gray-500">No packages to categorize.</p>
        )}
      </div>


      {viewingPackage && (
        <PackageDetailModal
          pkg={viewingPackage}
          isOpen={!!viewingPackage}
          onClose={() => setViewingPackage(null)}
          onEdit={(pkgToEdit: Package) => { // Explicitly type pkgToEdit
            // Edit from dashboard is tricky as PackageForm needs moveId context and getNextPackageId
            // For simplicity, navigate to the move detail page for editing.
            addNotification("To edit, please navigate to the package within its move.", "info");
            setViewingPackage(null);
            navigate(`/moves/${pkgToEdit.moveId}?scrollToPackage=${pkgToEdit.id}`);
          }}
          onDelete={handleDeletePackageFromDashboard}
          onGenerateLabel={handleGenerateLabelFromDashboard}
        />
      )}
      
      <Modal isOpen={isScannerModalOpen} onClose={() => setIsScannerModalOpen(false)} title="Scan Package QR Code" size="md">
        <QrCodeScanner
            onScanSuccess={handleScanSuccess}
            onScanFailure={(error) => addNotification(`QR Scan Error: ${error}`, "error")}
        />
      </Modal>

    </div>
  );
};
