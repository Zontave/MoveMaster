
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoves } from '../hooks/useMoves';
import { Move, AuditLogEntry, PickupLocation } from '../types';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { Input, TextArea } from '../components/Common/Input';
import { Spinner } from '../components/Common/Spinner';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, TruckIcon, UsersIcon, MapPinIcon } from '../components/Common/Icons';
import { formatDate } from '../utils/helpers';
import { useNotification } from '../contexts/NotificationContext';

const MoveCard: React.FC<{ move: Move; onView: (id: string) => void; onEdit: (move: Move) => void; onDelete: (id: string) => void }> = 
  ({ move, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-blue-700 mb-2">{move.name}</h3>
          <span className="text-xs text-gray-500">ID: {move.id.substring(0,8)}...</span>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-center"><MapPinIcon className="w-4 h-4 mr-2 text-red-500" /> <strong>From:</strong> {move.departureAddress}</p>
          <p className="flex items-center"><MapPinIcon className="w-4 h-4 mr-2 text-green-500" /> <strong>To:</strong> {move.arrivalAddress}</p>
          <p className="flex items-center"><TruckIcon className="w-4 h-4 mr-2 text-slate-500" /> <strong>Packages:</strong> {move.packagesCount || 0}</p>
          <p className="flex items-center"><UsersIcon className="w-4 h-4 mr-2 text-slate-500" /> <strong>Shared:</strong> {move.sharedWith?.length || 0} users</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">Last updated: {formatDate(move.updatedAt)}</p>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onView(move.id)} leftIcon={<EyeIcon className="w-4 h-4"/>}>View</Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(move)} leftIcon={<PencilIcon className="w-4 h-4"/>}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(move.id)} leftIcon={<TrashIcon className="w-4 h-4"/>}>Delete</Button>
      </div>
    </div>
  );
};

interface MoveFormState {
  name: string;
  departureAddress: string;
  arrivalAddress: string;
}

const MoveForm: React.FC<{
  initialData?: MoveFormState;
  onSubmit: (data: MoveFormState) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState<MoveFormState>(initialData || { name: '', departureAddress: '', arrivalAddress: '' });
  const [errors, setErrors] = useState<Partial<MoveFormState>>({});

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof MoveFormState]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const validate = () => {
    const newErrors: Partial<MoveFormState> = {};
    if (!formData.name.trim()) newErrors.name = "Move name is required.";
    if (!formData.departureAddress.trim()) newErrors.departureAddress = "Departure address is required.";
    if (!formData.arrivalAddress.trim()) newErrors.arrivalAddress = "Arrival address is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Move Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
      <TextArea label="Departure Address" name="departureAddress" value={formData.departureAddress} onChange={handleChange} error={errors.departureAddress} required />
      <TextArea label="Arrival Address" name="arrivalAddress" value={formData.arrivalAddress} onChange={handleChange} error={errors.arrivalAddress} required />
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Save Changes' : 'Create Move'}
        </Button>
      </div>
    </form>
  );
};


export const MovesPage: React.FC = () => {
  const { moves, isLoading, addMove, updateMove, deleteMove, fetchMoves } = useMoves();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMove, setEditingMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMoves();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch moves on mount

  const handleOpenModal = (move?: Move) => {
    setEditingMove(move || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMove(null);
  };

  const handleFormSubmit = async (data: MoveFormState) => {
    setIsSubmitting(true);
    try {
      if (editingMove) {
        await updateMove(editingMove.id, data);
        addNotification("Move updated successfully!", "success");
      } else {
        await addMove(data);
        addNotification("Move created successfully!", "success");
      }
      handleCloseModal();
      fetchMoves(); // Refresh list
    } catch (error) {
      addNotification(error instanceof Error ? error.message : "An error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMove = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this move and all its associated packages? This action cannot be undone.')) {
      try {
        await deleteMove(id);
        // Note: usePackages hook manages packages for a *specific* moveId. Deleting a move here
        // means packages for that moveId in localStorage might become orphaned if not handled.
        // For this demo, we assume packages are implicitly removed or handled by backend if it existed.
        // Or, we'd need a mechanism to clear localStorage for `movemaestro-packages-${id}`.
        localStorage.removeItem(`movemaestro-packages-${id}`); // Manual cleanup for demo
        addNotification("Move deleted successfully.", "success");
        fetchMoves(); // Refresh list
      } catch (error) {
        addNotification(error instanceof Error ? error.message : "Failed to delete move.", "error");
      }
    }
  };

  const filteredMoves = useMemo(() => {
    if (!searchTerm.trim()) return moves;
    return moves.filter(move => 
      move.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      move.departureAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      move.arrivalAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [moves, searchTerm]);

  if (isLoading && moves.length === 0) {
    return <div className="p-8"><Spinner message="Loading your moves..." size="lg" /></div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Your Moves</h1>
        <div className="flex space-x-3 items-center">
            <Input 
                type="search"
                placeholder="Search moves..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                containerClassName="mb-0"
                className="w-full sm:w-64"
            />
            <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="w-5 h-5"/>}>
                New Move
            </Button>
        </div>
      </div>

      {isLoading && <Spinner message="Refreshing moves..." size="md" />}

      {!isLoading && filteredMoves.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <TruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? 'No moves match your search.' : 'No moves yet!'}
          </h2>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first move.'}
          </p>
          {!searchTerm && <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="w-5 h-5"/>}>Create New Move</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMoves.map(move => (
            <MoveCard
              key={move.id}
              move={move}
              onView={(id) => navigate(`/moves/${id}`)}
              onEdit={handleOpenModal}
              onDelete={handleDeleteMove}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMove ? 'Edit Move' : 'Create New Move'}
        size="lg"
      >
        <MoveForm
          initialData={editingMove ? { name: editingMove.name, departureAddress: editingMove.departureAddress, arrivalAddress: editingMove.arrivalAddress } : undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
};
