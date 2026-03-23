import { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/layout/PageHeader';
import { CreateExtensionModal } from '@/components/extensions/CreateExtensionModal';
import { ExtensionsList } from '@/components/extensions/ExtensionsList';
import { EditExtensionModal } from '@/components/extensions/EditExtensionModal';
import { DeleteExtensionModal } from '@/components/extensions/DeleteExtensionModal';
import { Extension } from '@/types/extensions';

export const AIExtensionsPage = () => {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch extensions
  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/extentions');
      if (!response.ok) {
        throw new Error(`Error fetching extensions: ${response.statusText}`);
      }
      const data = await response.json();
      // The backend returns {extentions: Extension[]}, not Extension[] directly
      setExtensions(data.extentions || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch extensions:', err);
      setError(err.message || 'Failed to load extensions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  // Filter extensions based on search query
  const filteredExtensions = extensions.filter(ext => 
    ext.table_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ext.descriptions.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle edit extension
  const handleEditClick = (extension: Extension) => {
    setSelectedExtension(extension);
    setIsEditModalOpen(true);
  };

  // Handle delete extension
  const handleDeleteClick = (extension: Extension) => {
    setSelectedExtension(extension);
    setIsDeleteModalOpen(true);
  };

  // Handle create extension success
  const handleCreateSuccess = () => {
    fetchExtensions();
    setIsCreateModalOpen(false);
  };

  // Handle edit extension success
  const handleEditSuccess = () => {
    fetchExtensions();
    setIsEditModalOpen(false);
  };

  // Handle delete extension success
  const handleDeleteSuccess = () => {
    fetchExtensions();
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="AI Розширення" 
        description="Створюйте та керуйте розширеннями для вашого AI чату"
        className="mb-6"
      />

      {/* Search and actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук розширень..."
            className="pl-10 bg-white/5 border-white/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Нове розширення
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Завантаження розширень...</p>
        </div>
      ) : (
        // Extensions list
        <ExtensionsList 
          extensions={filteredExtensions} 
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      )}

      {/* Create modal */}
      <CreateExtensionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit modal */}
      {selectedExtension && (
        <EditExtensionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          extension={selectedExtension}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete modal */}
      {selectedExtension && (
        <DeleteExtensionModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          extension={selectedExtension}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default AIExtensionsPage;
