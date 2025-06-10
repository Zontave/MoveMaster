
import React from 'react';
import { Package, PackageContentItem, AuditLogEntry } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { QrCodeGenerator } from './QrCodeGenerator';
import { formatDate, calculateVolume } from '../../utils/helpers';
import { ActivityLogItem } from '../Dashboard/ActivityLogItem';
import { EyeIcon, PencilIcon, TrashIcon, MapPinIcon, HomeIcon, TruckIcon as TransitIcon, CheckCircleIcon } from '../Common/Icons';

interface PackageDetailModalProps {
  pkg: Package | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (pkg: Package) => void;
  onDelete: (pkgId: string) => void;
  onGenerateLabel: (pkg: Package) => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-gray-500 flex items-center">
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value}</dd>
  </div>
);

const LocationStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status.includes("Departure")) return <HomeIcon className="w-5 h-5 text-yellow-500" />;
  if (status.includes("Transit")) return <TransitIcon className="w-5 h-5 text-blue-500" />;
  if (status.includes("Destination")) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
  return <MapPinIcon className="w-5 h-5 text-gray-400" />;
}


export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ pkg, isOpen, onClose, onEdit, onDelete, onGenerateLabel }) => {
  if (!pkg) return null;

  const volume = calculateVolume(pkg.dimensions).toFixed(3);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Package Details: ${pkg.id.toUpperCase()}`} size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <dl className="divide-y divide-gray-200">
              <DetailItem label="Type" value={pkg.type} />
              <DetailItem label="Content Type" value={pkg.contentType} />
              <DetailItem label="Room of Origin" value={pkg.roomOfOrigin} />
              <DetailItem label="Dimensions (LxWxH cm)" value={`${pkg.dimensions.length} x ${pkg.dimensions.width} x ${pkg.dimensions.height}`} />
              <DetailItem label="Volume" value={`${volume} m³`} />
              <DetailItem label="Location Status" value={pkg.locationStatus} icon={<LocationStatusIcon status={pkg.locationStatus}/>} />
              <DetailItem label="Created At" value={formatDate(pkg.createdAt)} />
              <DetailItem label="Last Updated" value={formatDate(pkg.updatedAt)} />
            </dl>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2">
            <QrCodeGenerator value={pkg.qrCodeValue} size={160} />
            <p className="text-xs text-gray-500">{pkg.qrCodeValue}</p>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">Contents:</h4>
          {pkg.contents.length > 0 ? (
            <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
              {pkg.contents.map((item: PackageContentItem) => (
                <li key={item.id} className="text-sm text-gray-700">
                  {item.name} (Quantity: {item.quantity})
                  {item.photo && (
                    <a href={item.photo} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline text-xs">(View Photo)</a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No content items listed.</p>
          )}
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">Audit Log:</h4>
          {pkg.auditLog && pkg.auditLog.length > 0 ? (
            <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {pkg.auditLog.slice().reverse().map((log: AuditLogEntry, index: number) => ( // Show newest first
                  <ActivityLogItem key={index} log={log} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No audit trail available.</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <Button variant="outline" onClick={() => onGenerateLabel(pkg)}>Generate Label</Button>
        <Button variant="primary" onClick={() => { onEdit(pkg); onClose(); }}>Edit Package</Button>
        <Button variant="danger" onClick={() => { onDelete(pkg.id); onClose(); }}>Delete Package</Button>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

