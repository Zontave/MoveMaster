
import React from 'react';
import { Package, PackageType, LocationStatus } from '../../types';
import { formatDate, calculateVolume } from '../../utils/helpers';
import { QrCodeGenerator } from './QrCodeGenerator';
import { Button } from '../Common/Button';
import { EyeIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon, PackageIcon as BoxIcon } from '../Common/Icons'; // Renamed PackageIcon to BoxIcon to avoid conflict

interface PackageListItemProps {
  pkg: Package;
  onView: (pkg: Package) => void;
  onEdit: (pkg: Package) => void;
  onDelete: (pkgId: string) => void;
  onGenerateLabel: (pkg: Package) => void;
}

const getStatusColor = (status: LocationStatus): string => {
  switch (status) {
    case LocationStatus.DEPARTURE: return 'bg-yellow-100 text-yellow-800';
    case LocationStatus.TRANSIT: return 'bg-blue-100 text-blue-800';
    case LocationStatus.DESTINATION: return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPackageTypeIcon = (type: PackageType) => {
    // Customize icons per type if desired
    return <BoxIcon className="w-5 h-5 mr-2 text-slate-700" />;
};

export const PackageListItem: React.FC<PackageListItemProps> = ({ pkg, onView, onEdit, onDelete, onGenerateLabel }) => {
  const volume = calculateVolume(pkg.dimensions).toFixed(3);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-grow mb-3 sm:mb-0">
            <div className="flex items-center mb-1">
                {getPackageTypeIcon(pkg.type)}
                <h3 className="text-lg font-semibold text-blue-700">{pkg.id.toUpperCase()} - {pkg.contentType}</h3>
            </div>
          
          <p className="text-sm text-gray-600">Origin: {pkg.roomOfOrigin}</p>
          <p className="text-sm text-gray-600">
            Dimensions: {pkg.dimensions.length}x{pkg.dimensions.width}x{pkg.dimensions.height} cm (Volume: {volume} m³)
          </p>
          <p className="text-sm text-gray-500">Last updated: {formatDate(pkg.updatedAt)}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-start sm:items-end space-y-2 sm:space-y-0 sm:space-x-2 sm:flex-row">
           <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.locationStatus)}`}>
            {pkg.locationStatus}
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-3 sm:mb-0">
          <QrCodeGenerator value={pkg.qrCodeValue} size={80} />
        </div>
        <div className="flex space-x-2 flex-wrap justify-center sm:justify-end">
          <Button variant="ghost" size="sm" onClick={() => onView(pkg)} leftIcon={<EyeIcon className="w-4 h-4"/>}>View</Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(pkg)} leftIcon={<PencilIcon className="w-4 h-4"/>}>Edit</Button>
          <Button variant="outline" size="sm" onClick={() => onGenerateLabel(pkg)} leftIcon={<DocumentArrowDownIcon className="w-4 h-4"/>}>Label</Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(pkg.id)} leftIcon={<TrashIcon className="w-4 h-4"/>}>Delete</Button>
        </div>
      </div>
    </div>
  );
};
