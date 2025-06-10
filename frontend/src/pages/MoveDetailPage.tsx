
import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMoves } from '../hooks/useMoves';
import { usePackages } from '../hooks/usePackages';
import { Move, Package, PackageType, LocationStatus, PickupLocation, AuditLogEntry, User } from '../types';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { Spinner } from '../components/Common/Spinner';
import { PackageForm } from '../components/Packages/PackageForm';
import { PackageListItem } from '../components/Packages/PackageListItem';
import { PackageDetailModal } from '../components/Packages/PackageDetailModal';
import { QrCodeScanner } from '../components/Packages/QrCodeScanner';
import { generatePdfLabel } from '../services/pdfService';
// import { QrCodeGenerator } from '../components/Packages/QrCodeGenerator'; // QrCodeGenerator is used inside PackageListItem and PackageDetailModal
import { formatDate, calculateVolume } from '../../utils/helpers';
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon, HomeIcon, TruckIcon as MoveTruckIcon, QrCodeIcon, SearchIcon, EyeIcon, FunnelIcon, UsersIcon } from '../components/Common/Icons'; // Removed FilterIcon, added FunnelIcon
import { Input, TextArea } from '../components/Common/Input'; // Separated Select import
import { Select } from '../components/Common/Select'; // Import Select from its own file
import { ActivityLogItem } from '../components/Dashboard/ActivityLogItem';
import { useNotification } from '../contexts/NotificationContext';
import { PACKAGE_TYPES, LOCATION_STATUSES, QR_CODE_PREFIX } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { toCanvas as qrToCanvas } from 'qrcode';


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2
      ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
  >
    {children}
  </button>
);

const UserPermissionForm: React.FC<{
  onSubmit: (email: string, permission: "read" | "write") => void;
  onCancel: () => void;
  existingUsers: User[]; // Mock: list of users in system
}> = ({ onSubmit, onCancel, existingUsers }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<"read" | "write">("read");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter a user's email."); return;
    }
    // Mock: check if user exists in a real app
    onSubmit(email, permission);
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="User Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@example.com" required/>
      {/* Or a select if users were pre-loaded:
      <Select label="Select User" value={email} onChange={e => setEmail(e.target.value)}>
        <option value="">Select a user</option>
        {existingUsers.map(u => <option key={u.id} value={u.email}>{u.name} ({u.email})</option>)}
      </Select>
      */}
      <Select label="Permission" value={permission} onChange={e => setPermission(e.target.value as "read" | "write")}>
        <option value="read">Read-Only</option>
        <option value="write">Read & Write</option>
      </Select>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add User</Button>
      </div>
    </form>
  );
};


const PickupLocationForm: React.FC<{
    onSubmit: (data: Omit<PickupLocation, 'id'>) => void;
    onCancel: () => void;
    initialData?: Omit<PickupLocation, 'id'>;
}> = ({ onSubmit, onCancel, initialData }) => {
    const [address, setAddress] = useState(initialData?.address || '');
    const [notes, setNotes] = useState(initialData?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!address.trim()) {
            alert("Address is required for pickup location.");
            return;
        }
        onSubmit({ address, notes });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <TextArea label="Pickup Address" value={address} onChange={e => setAddress(e.target.value)} required />
            <Input label="Notes (Optional)" value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{initialData ? "Save Changes" : "Add Location"}</Button>
            </div>
        </form>
    );
};


export const MoveDetailPage: React.FC = () => {
  const { moveId } = useParams<{ moveId: string }>();
  const navigate = useNavigate();
  const { getMoveById, addAuditLog: addMoveAuditLog, updateMove, addPickupLocation, updatePickupLocation, deletePickupLocation } = useMoves();
  const { user } = useAuth();
  const { 
    packages, 
    isLoading: packagesLoading, 
    addPackage, 
    updatePackage: updatePkg, 
    deletePackage: deletePkg,
    getNextPackageId,
    fetchPackages,
  } = usePackages(moveId); // Hook is now keyed by moveId

  const [move, setMove] = useState<Move | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [viewingPackage, setViewingPackage] = useState<Package | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);
  const { addNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PackageType | ''>('');
  const [filterStatus, setFilterStatus] = useState<LocationStatus | ''>('');
  
  const [activeTab, setActiveTab] = useState<'packages' | 'details' | 'log' | 'sharing' | 'pickups'>('packages');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<PickupLocation | null>(null);


  useEffect(() => {
    if (moveId) {
      const currentMove = getMoveById(moveId);
      if (currentMove) {
        setMove(currentMove);
        fetchPackages(moveId); // Fetch packages for this move
      } else {
        addNotification("Move not found.", "error");
        navigate('/moves');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveId, getMoveById, navigate, addNotification]); // fetchPackages is stable

  const handleOpenPackageModal = (pkg?: Package) => {
    setEditingPackage(pkg || null);
    setIsPackageModalOpen(true);
  };

  const handleClosePackageModal = () => {
    setIsPackageModalOpen(false);
    setEditingPackage(null);
  };

  const handlePackageFormSubmit = async (pkgData: Package) => {
    if (!moveId) return;
    setIsSubmittingPackage(true);
    try {
      if (editingPackage) {
        await updatePkg(editingPackage.id, pkgData);
        addNotification("Package updated successfully!", "success");
        addMoveAuditLog(moveId, "Package Updated", `Package ID: ${editingPackage.id}`);
      } else {
        await addPackage(moveId, pkgData);
        addNotification("Package created successfully!", "success");
        addMoveAuditLog(moveId, "Package Created", `Package ID: ${pkgData.id}`);
      }
      handleClosePackageModal();
      fetchPackages(moveId); // Re-fetch packages for the current move
    } catch (error) {
      addNotification(error instanceof Error ? error.message : "An error occurred with package.", "error");
    } finally {
      setIsSubmittingPackage(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!moveId) return;
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePkg(packageId);
        addNotification("Package deleted successfully.", "success");
        addMoveAuditLog(moveId, "Package Deleted", `Package ID: ${packageId}`);
        fetchPackages(moveId);
        if (viewingPackage?.id === packageId) setViewingPackage(null); // Close detail modal if current package deleted
      } catch (error) {
        addNotification(error instanceof Error ? error.message : "Failed to delete package.", "error");
      }
    }
  };

  const handleGenerateLabel = async (pkg: Package) => {
    if(!pkg || !pkg.qrCodeValue) {
      addNotification("Package data incomplete for label generation.", "error");
      return;
    }
    const canvas = document.createElement('canvas');
    qrToCanvas(canvas, pkg.qrCodeValue, { width: 256, errorCorrectionLevel: 'H' }, (error: any) => {
      if (error) {
        console.error("QR code generation for PDF failed:", error);
        addNotification("Failed to generate QR code for PDF label.", "error");
        return;
      }
      const dataUrl = canvas.toDataURL();
      generatePdfLabel(pkg, dataUrl);
      addNotification(`PDF label for ${pkg.id} is being generated.`, "info");
      addMoveAuditLog(moveId!, "Label Generated", `Package ID: ${pkg.id}`);
    });
  };

  const handleScanSuccess = (decodedText: string, _decodedResult: any) => {
    setIsScannerModalOpen(false);
    if (decodedText.startsWith(QR_CODE_PREFIX)) {
        const packageId = decodedText.substring(QR_CODE_PREFIX.length);
        const foundPackage = packages.find(p => p.id === packageId);
        if (foundPackage) {
            setViewingPackage(foundPackage);
            addNotification(`Package ${packageId} found and displayed.`, "success");
        } else {
            addNotification(`Package ${packageId} not found in this move.`, "warning");
        }
        setSearchTerm(packageId); // Also set search term
    } else {
        addNotification(`Scanned: ${decodedText}. Not a valid package QR code.`, "info");
        setSearchTerm(decodedText);
    }
  };
  
  const handleShareMove = async (email: string, permission: "read" | "write") => {
    if (!move || !user) return;
    // This is a mock implementation
    const newSharedUser = { userId: email, permission }; // In real app, userId would be an actual ID
    const alreadyShared = move.sharedWith.find(su => su.userId === email);
    let updatedSharedWith;
    if (alreadyShared) {
        updatedSharedWith = move.sharedWith.map(su => su.userId === email ? newSharedUser : su);
    } else {
        updatedSharedWith = [...move.sharedWith, newSharedUser];
    }

    try {
        await updateMove(move.id, { ...move, sharedWith: updatedSharedWith });
        setMove(m => m ? {...m, sharedWith: updatedSharedWith} : null); // Update local move state
        addNotification(`Move shared with ${email} (${permission}).`, "success");
        addMoveAuditLog(move.id, "Move Shared", `User: ${email}, Permission: ${permission}`);
        setIsUserModalOpen(false);
    } catch(err) {
        addNotification("Failed to share move.", "error");
    }
  };

  const handleRemoveSharedUser = async (userEmail: string) => {
     if (!move) return;
     if (window.confirm(`Are you sure you want to remove ${userEmail}'s access to this move?`)) {
        const updatedSharedWith = move.sharedWith.filter(su => su.userId !== userEmail);
        try {
            await updateMove(move.id, { ...move, sharedWith: updatedSharedWith });
            setMove(m => m ? {...m, sharedWith: updatedSharedWith} : null);
            addNotification(`Access removed for ${userEmail}.`, "success");
            addMoveAuditLog(move.id, "User Access Removed", `User: ${userEmail}`);
        } catch(err) {
            addNotification("Failed to remove user access.", "error");
        }
     }
  };
  
  const handlePickupLocationSubmit = async (data: Omit<PickupLocation, 'id'>) => {
    if (!moveId) return;
    try {
        if (editingPickup) {
            await updatePickupLocation(moveId, editingPickup.id, data);
            addNotification("Pickup location updated.", "success");
        } else {
            await addPickupLocation(moveId, data);
            addNotification("Pickup location added.", "success");
        }
        const updatedMoveData = getMoveById(moveId); // Re-fetch move to get updated locations
        if(updatedMoveData) setMove(updatedMoveData);
        setIsPickupModalOpen(false);
        setEditingPickup(null);
    } catch (error) {
        addNotification("Failed to save pickup location.", "error");
    }
  };

  const handleDeletePickupLocation = async (locationId: string) => {
    if (!moveId) return;
    if (window.confirm("Are you sure you want to delete this pickup location?")) {
        try {
            await deletePickupLocation(moveId, locationId);
            addNotification("Pickup location deleted.", "success");
            const updatedMoveData = getMoveById(moveId);
            if(updatedMoveData) setMove(updatedMoveData);
        } catch (error) {
            addNotification("Failed to delete pickup location.", "error");
        }
    }
  };

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const searchTermMatch = searchTerm.trim() === '' ||
        pkg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.contentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.roomOfOrigin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.contents.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const typeMatch = filterType === '' || pkg.type === filterType;
      const statusMatch = filterStatus === '' || pkg.locationStatus === filterStatus;
      return searchTermMatch && typeMatch && statusMatch;
    });
  }, [packages, searchTerm, filterType, filterStatus]);

  const moveProgress = useMemo(() => {
    if (!packages || packages.length === 0) return 0;
    const destinationCount = packages.filter(p => p.locationStatus === LocationStatus.DESTINATION).length;
    return Math.round((destinationCount / packages.length) * 100);
  }, [packages]);

  const totalVolume = useMemo(() => {
    return packages.reduce((sum, pkg) => sum + calculateVolume(pkg.dimensions), 0).toFixed(3);
  }, [packages]);


  if (!move) {
    return <div className="p-8"><Spinner message="Loading move details..." size="lg" /></div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 pb-4 border-b border-gray-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <MoveTruckIcon className="w-8 h-8 mr-3 text-blue-600" />
                    {move.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">From: {move.departureAddress} <MapPinIcon className="w-4 h-4 inline-block text-red-500 ml-1"/> To: {move.arrivalAddress} <MapPinIcon className="w-4 h-4 inline-block text-green-500 ml-1"/></p>
            </div>
            <Button onClick={() => navigate('/moves')} variant="outline" size="sm" className="mt-3 sm:mt-0">Back to Moves</Button>
        </div>
         <div className="mt-4">
            <p className="text-sm text-gray-600">Move Progress: {moveProgress}% ({packages.filter(p=>p.locationStatus === LocationStatus.DESTINATION).length}/{packages.length} packages at destination)</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${moveProgress}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Volume: {totalVolume} m³</p>
        </div>
      </div>

    <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <TabButton active={activeTab === 'packages'} onClick={() => setActiveTab('packages')}>Packages ({packages.length})</TabButton>
            <TabButton active={activeTab === 'pickups'} onClick={() => setActiveTab('pickups')}>Pickup Locations ({move.pickupLocations?.length || 0})</TabButton>
            <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Move Details</TabButton>
            <TabButton active={activeTab === 'sharing'} onClick={() => setActiveTab('sharing')}>Sharing ({move.sharedWith?.length || 0})</TabButton>
            <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')}>Activity Log</TabButton>
        </nav>
    </div>

    {activeTab === 'packages' && (
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Input
              type="search"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon className="w-4 h-4 text-gray-400" />}
              containerClassName="mb-0 flex-grow md:flex-grow-0"
              className="w-full md:w-52"
            />
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value as PackageType | '')} containerClassName="mb-0  flex-grow md:flex-grow-0">
              <option value="">All Types</option>
              {PACKAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </Select>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LocationStatus | '')} containerClassName="mb-0  flex-grow md:flex-grow-0">
              <option value="">All Statuses</option>
              {LOCATION_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
          <div className="flex space-x-2 w-full md:w-auto justify-start md:justify-end mt-2 md:mt-0">
            <Button onClick={() => setIsScannerModalOpen(true)} leftIcon={<QrCodeIcon className="w-5 h-5"/>} variant="outline">Scan QR</Button>
            <Button onClick={() => handleOpenPackageModal()} leftIcon={<PlusIcon className="w-5 h-5"/>}>Add Package</Button>
          </div>
        </div>

        {packagesLoading && <Spinner message="Loading packages..." />}
        {!packagesLoading && filteredPackages.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <MoveTruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {packages.length === 0 ? 'No packages in this move yet.' : 'No packages match your filters.'}
            </h2>
            <p className="text-gray-500 mb-6">
                {packages.length === 0 ? 'Add your first package to get started.' : 'Try adjusting your search or filter criteria.'}
            </p>
            {packages.length === 0 && <Button onClick={() => handleOpenPackageModal()} leftIcon={<PlusIcon className="w-5 h-5"/>}>Add New Package</Button>}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPackages.map(pkg => (
              <PackageListItem
                key={pkg.id}
                pkg={pkg}
                onView={setViewingPackage}
                onEdit={handleOpenPackageModal}
                onDelete={handleDeletePackage}
                onGenerateLabel={handleGenerateLabel}
              />
            ))}
          </div>
        )}
      </div>
    )}

    {activeTab === 'pickups' && (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Additional Pickup Locations</h2>
                <Button onClick={() => { setEditingPickup(null); setIsPickupModalOpen(true);}} leftIcon={<PlusIcon />}>Add Location</Button>
            </div>
            {move.pickupLocations?.length > 0 ? (
                <ul className="space-y-3">
                    {move.pickupLocations.map(loc => (
                        <li key={loc.id} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-700">{loc.address}</p>
                                {loc.notes && <p className="text-sm text-gray-500">{loc.notes}</p>}
                            </div>
                            <div className="space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => { setEditingPickup(loc); setIsPickupModalOpen(true); }}><PencilIcon className="w-4 h-4"/></Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeletePickupLocation(loc.id)}><TrashIcon className="w-4 h-4"/></Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No additional pickup locations added.</p>
            )}
        </div>
    )}

    {activeTab === 'details' && (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Move Information</h2>
        <dl className="divide-y divide-gray-200">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm font-medium text-gray-500">Move Name</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{move.name}</dd></div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm font-medium text-gray-500">Departure Address</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{move.departureAddress}</dd></div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm font-medium text-gray-500">Arrival Address</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{move.arrivalAddress}</dd></div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm font-medium text-gray-500">Created At</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(move.createdAt)}</dd></div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm font-medium text-gray-500">Last Updated</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(move.updatedAt)}</dd></div>
        </dl>
      </div>
    )}
    
    {activeTab === 'sharing' && (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Share Move</h2>
                <Button onClick={() => setIsUserModalOpen(true)} leftIcon={<UsersIcon />}>Add User</Button>
            </div>
            {move.sharedWith?.length > 0 ? (
                <ul className="space-y-3">
                    {move.sharedWith.map(shared => (
                        <li key={shared.userId} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-700">{shared.userId} {/* Replace with user name if available */}</p>
                                <p className="text-sm text-gray-500 capitalize">{shared.permission} Access</p>
                            </div>
                            <Button variant="danger" size="sm" onClick={() => handleRemoveSharedUser(shared.userId)}>Remove</Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">This move is not shared with anyone yet.</p>
            )}
        </div>
    )}

    {activeTab === 'log' && (
        <div className="bg-white p-6 rounded-lg shadow max-h-[600px] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Move Activity Log</h2>
            {move.auditLog && move.auditLog.length > 0 ? (
                 <ul className="divide-y divide-gray-200">
                    {move.auditLog.slice().reverse().map((log: AuditLogEntry, index: number) => (
                        <ActivityLogItem key={index} log={log} />
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No activity recorded for this move yet.</p>
            )}
        </div>
    )}


      <Modal isOpen={isPackageModalOpen} onClose={handleClosePackageModal} title={editingPackage ? 'Edit Package' : 'Create New Package'} size="lg">
        <PackageForm
          moveId={moveId!}
          initialPackage={editingPackage || undefined}
          onSubmit={handlePackageFormSubmit}
          onCancel={handleClosePackageModal}
          getNextPackageId={getNextPackageId}
          isSubmitting={isSubmittingPackage}
        />
      </Modal>

      {viewingPackage && (
        <PackageDetailModal
          pkg={viewingPackage}
          isOpen={!!viewingPackage}
          onClose={() => setViewingPackage(null)}
          onEdit={(pkg) => { setViewingPackage(null); handleOpenPackageModal(pkg);}}
          onDelete={(id) => { setViewingPackage(null); handleDeletePackage(id);}}
          onGenerateLabel={handleGenerateLabel}
        />
      )}
      
      <Modal isOpen={isScannerModalOpen} onClose={() => setIsScannerModalOpen(false)} title="Scan Package QR Code" size="md">
        <QrCodeScanner
            onScanSuccess={handleScanSuccess}
            onScanFailure={(error) => addNotification(`QR Scan Error: ${error}`, "error")}
        />
      </Modal>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Share with User (Mock)">
        <UserPermissionForm 
            onSubmit={handleShareMove}
            onCancel={() => setIsUserModalOpen(false)}
            existingUsers={[]} // Mock: pass actual user list if available
        />
      </Modal>
      
      <Modal isOpen={isPickupModalOpen} onClose={() => { setIsPickupModalOpen(false); setEditingPickup(null); }} title={editingPickup ? "Edit Pickup Location" : "Add Pickup Location"}>
        <PickupLocationForm
            onSubmit={handlePickupLocationSubmit}
            onCancel={() => { setIsPickupModalOpen(false); setEditingPickup(null); }}
            initialData={editingPickup ? { address: editingPickup.address, notes: editingPickup.notes } : undefined}
        />
    </Modal>
    </div>
  );
};
