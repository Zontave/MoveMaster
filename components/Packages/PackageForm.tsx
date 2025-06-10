
import React, { useState, useEffect, useCallback } from 'react';
import { Package, PackageType, LocationStatus, PackageContentItem, SuggestedItem } from '../../types';
import { Button } from '../Common/Button';
import { Input, TextArea } from '../Common/Input';
import { Select } from '../Common/Select';
import { PACKAGE_TYPES, LOCATION_STATUSES } from '../../constants';
import { generateId, imageFileToDataUrl, MAX_FILE_SIZE_MB } from '../../utils/helpers';
import { PlusIcon, TrashIcon, SparklesIcon, UploadIcon } from '../Common/Icons';
import { getPackageContentSuggestions } from '../../services/geminiService';
import { useNotification } from '../../contexts/NotificationContext';
import { Spinner } from '../Common/Spinner';

interface PackageFormProps {
  moveId: string;
  initialPackage?: Package; // For editing
  onSubmit: (pkg: Package) => Promise<void>;
  onCancel: () => void;
  getNextPackageId: (moveId: string, type: PackageType) => string;
  isSubmitting: boolean;
}

const defaultDimensions = { length: 0, width: 0, height: 0 };

export const PackageForm: React.FC<PackageFormProps> = ({
  moveId,
  initialPackage,
  onSubmit,
  onCancel,
  getNextPackageId,
  isSubmitting,
}) => {
  const [pkg, setPkg] = useState<Partial<Package>>(
    initialPackage
      ? { ...initialPackage }
      : {
          type: PackageType.BOX,
          locationStatus: LocationStatus.DEPARTURE,
          dimensions: { ...defaultDimensions },
          contents: [],
          contentType: '',
          roomOfOrigin: '',
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addNotification } = useNotification();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);

  useEffect(() => {
    if (initialPackage) {
      setPkg({ ...initialPackage });
    } else {
      // Set initial ID when type changes for a new package
      const packageId = getNextPackageId(moveId, pkg.type || PackageType.BOX);
      setPkg(p => ({ ...p, id: packageId }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPackage, moveId, pkg.type, getNextPackageId]); // Added getNextPackageId

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("dimensions.")) {
      const dimKey = name.split(".")[1] as keyof Package['dimensions'];
      setPkg(prev => ({
        ...prev,
        dimensions: { ...(prev?.dimensions || defaultDimensions), [dimKey]: parseFloat(value) || 0 }
      }));
    } else {
      setPkg(prev => ({ ...prev, [name]: value }));
      if (name === 'type' && !initialPackage) { // Update ID if type changes for a new package
        const newPackageId = getNextPackageId(moveId, value as PackageType);
        setPkg(p => ({ ...p, id: newPackageId }));
      }
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleContentItemChange = (index: number, field: keyof PackageContentItem, value: string | number | File) => {
    const updatedContents = [...(pkg.contents || [])];
    if (field === 'photo' && value instanceof File) {
      imageFileToDataUrl(value)
        .then(dataUrl => {
          updatedContents[index] = { ...updatedContents[index], [field]: dataUrl };
           setPkg(prev => ({ ...prev, contents: updatedContents }));
        })
        .catch(err => addNotification(err.message, 'error'));
    } else if (field !== 'photo') {
         updatedContents[index] = { ...updatedContents[index], [field]: value };
         setPkg(prev => ({ ...prev, contents: updatedContents }));
    }
  };

  const addContentItem = () => {
    setPkg(prev => ({
      ...prev,
      contents: [...(prev.contents || []), { id: generateId(), name: '', quantity: 1 }]
    }));
  };

  const removeContentItem = (index: number) => {
    setPkg(prev => ({
      ...prev,
      contents: (prev.contents || []).filter((_, i) => i !== index)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!pkg.id) newErrors.id = "Package ID is required.";
    if (!pkg.contentType?.trim()) newErrors.contentType = "Content type is required.";
    if (!pkg.roomOfOrigin?.trim()) newErrors.roomOfOrigin = "Room of origin is required.";
    if (!pkg.dimensions?.length || pkg.dimensions.length <= 0) newErrors.dimensions_length = "Length must be positive.";
    if (!pkg.dimensions?.width || pkg.dimensions.width <= 0) newErrors.dimensions_width = "Width must be positive.";
    if (!pkg.dimensions?.height || pkg.dimensions.height <= 0) newErrors.dimensions_height = "Height must be positive.";
    (pkg.contents || []).forEach((item, index) => {
      if (!item.name.trim()) newErrors[`content_name_${index}`] = "Item name is required.";
      if (item.quantity <= 0) newErrors[`content_quantity_${index}`] = "Quantity must be positive.";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addNotification("Please correct the errors in the form.", "error");
      return;
    }
    const finalPackageData: Package = {
      ...pkg,
      id: pkg.id!,
      moveId: moveId,
      type: pkg.type!,
      contentType: pkg.contentType!,
      roomOfOrigin: pkg.roomOfOrigin!,
      dimensions: pkg.dimensions!,
      locationStatus: pkg.locationStatus!,
      contents: pkg.contents || [],
      qrCodeValue: `movemaestro://package/${pkg.id}`, // Ensure QR value is set
      auditLog: initialPackage?.auditLog || [], // Preserve existing or init new
      createdAt: initialPackage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await onSubmit(finalPackageData);
  };

  const handleGetSuggestions = async () => {
    if (!pkg.roomOfOrigin || !pkg.type) {
      addNotification("Please select Room of Origin and Package Type to get suggestions.", "warning");
      return;
    }
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const existingContentSummary = (pkg.contents || []).map(c => c.name).join(', ');
      const result = await getPackageContentSuggestions({
        roomOfOrigin: pkg.roomOfOrigin,
        packageType: pkg.type,
        existingContent: existingContentSummary,
      });
      setSuggestions(result);
      if (result.length === 0) {
        addNotification("No specific suggestions found, or AI service might be unavailable.", "info");
      }
    } catch (error) {
      addNotification(error instanceof Error ? error.message : "Failed to get suggestions.", "error");
    } finally {
      setIsSuggesting(false);
    }
  };

  const addSuggestionToContents = (suggestion: SuggestedItem) => {
    const newItem: PackageContentItem = {
      id: generateId(),
      name: suggestion.name,
      quantity: 1,
    };
    setPkg(prev => ({...prev, contents: [...(prev.contents || []), newItem]}));
    // Optionally remove the suggestion from the list or mark as added
    setSuggestions(sugs => sugs.filter(s => s.name !== suggestion.name));
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Package ID" name="id" value={pkg.id || ''} onChange={handleChange} error={errors.id} disabled />
        <Select label="Package Type" name="type" value={pkg.type} onChange={handleChange} error={errors.type}>
          {PACKAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
      </div>

      <Input label="Content Type (e.g., Books, Kitchenware)" name="contentType" value={pkg.contentType || ''} onChange={handleChange} error={errors.contentType} required />
      <Input label="Room of Origin (e.g., Bedroom, Study)" name="roomOfOrigin" value={pkg.roomOfOrigin || ''} onChange={handleChange} error={errors.roomOfOrigin} required />

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Dimensions (cm)</h4>
        <div className="grid grid-cols-3 gap-4">
          <Input type="number" label="Length" name="dimensions.length" value={pkg.dimensions?.length || 0} onChange={handleChange} error={errors.dimensions_length} min="0.1" step="0.1" containerClassName="mb-0" />
          <Input type="number" label="Width" name="dimensions.width" value={pkg.dimensions?.width || 0} onChange={handleChange} error={errors.dimensions_width} min="0.1" step="0.1" containerClassName="mb-0" />
          <Input type="number" label="Height" name="dimensions.height" value={pkg.dimensions?.height || 0} onChange={handleChange} error={errors.dimensions_height} min="0.1" step="0.1" containerClassName="mb-0" />
        </div>
      </div>

      <Select label="Location Status" name="locationStatus" value={pkg.locationStatus} onChange={handleChange} error={errors.locationStatus}>
        {LOCATION_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
      </Select>

      <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-800">Package Contents</h4>
            <Button type="button" variant="ghost" size="sm" onClick={handleGetSuggestions} leftIcon={<SparklesIcon className="w-4 h-4" />} isLoading={isSuggesting}>
                Get AI Suggestions
            </Button>
        </div>
        {isSuggesting && <Spinner message="Fetching suggestions..." size="sm" />}
        {suggestions.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h5 className="text-sm font-medium text-blue-700 mb-1">AI Suggestions:</h5>
            <ul className="list-disc list-inside space-y-1">
              {suggestions.map(sugg => (
                <li key={sugg.name} className="text-sm text-blue-600">
                  {sugg.name} {sugg.reason && <span className="text-xs text-blue-500">({sugg.reason})</span>}
                  <Button type="button" variant="ghost" size="sm" onClick={() => addSuggestionToContents(sugg)} className="ml-2 !p-1 text-blue-500 hover:text-blue-700">
                    <PlusIcon className="w-3 h-3"/> Add
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(pkg.contents || []).map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-end mb-3 p-3 border rounded-md bg-slate-50">
            <Input 
              label="Item Name" 
              name={`content_name_${index}`} 
              value={item.name} 
              onChange={(e) => handleContentItemChange(index, 'name', e.target.value)} 
              error={errors[`content_name_${index}`]}
              containerClassName="col-span-12 sm:col-span-5 mb-0"
              labelClassName="text-xs"
            />
            <Input 
              type="number" 
              label="Quantity" 
              name={`content_quantity_${index}`} 
              value={item.quantity} 
              onChange={(e) => handleContentItemChange(index, 'quantity', parseInt(e.target.value))} 
              error={errors[`content_quantity_${index}`]}
              min="1"
              containerClassName="col-span-6 sm:col-span-3 mb-0"
              labelClassName="text-xs"
            />
            <div className="col-span-6 sm:col-span-3 mb-0">
              <label htmlFor={`content_photo_${index}`} className="block text-xs font-medium text-gray-700 mb-1">Photo (Optional)</label>
              <div className="flex items-center">
                <input 
                  type="file" 
                  id={`content_photo_${index}`}
                  accept="image/*" 
                  onChange={(e) => e.target.files && e.target.files[0] && handleContentItemChange(index, 'photo', e.target.files[0])} 
                  className="hidden" 
                />
                 <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById(`content_photo_${index}`)?.click()} leftIcon={<UploadIcon className="w-4 h-4"/>} className="w-full text-xs">
                    {item.photo ? "Change" : "Upload"}
                  </Button>
              </div>
              {item.photo && <a href={item.photo} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">View Current</a>}
               <p className="text-xs text-gray-500 mt-1">Max {MAX_FILE_SIZE_MB}MB.</p>
            </div>

            <div className="col-span-12 sm:col-span-1 flex justify-end">
              <Button type="button" variant="danger" size="sm" onClick={() => removeContentItem(index)} className="!p-2">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addContentItem} leftIcon={<PlusIcon className="w-4 h-4"/>}>
          Add Content Item
        </Button>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialPackage ? 'Save Changes' : 'Create Package'}
        </Button>
      </div>
    </form>
  );
};
