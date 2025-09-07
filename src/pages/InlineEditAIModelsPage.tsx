import { useState, useEffect, useRef } from 'react';
import { Plus, Search, AlertCircle, Loader2, Save, X, Trash, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/hooks/use-toast';
import { ChatModel, ChatModelCreatePayload } from '@/types/chatModels';
import { getChatModels, createChatModel, updateChatModel, deleteChatModel } from '@/services/chatModelsService';
 
type EditableRow = {
  id?: number;
  name: string;
  openrouter_model: string;
  max_tokens_count: number;
  input_tokens_price: number;
  output_tokens_price: number;
  icon: string;
  isNew?: boolean;
  isEditing?: boolean;
};

export const AIModelsPage = () => {
  const [models, setModels] = useState<ChatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
   

  const [editableRows, setEditableRows] = useState<Record<string, EditableRow>>({});
  const [newRow, setNewRow] = useState<EditableRow | null>(null);
  
  // Стан для видалення
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<ChatModel | null>(null);

  // Ref для автофокусу на новий рядок
  const newRowRef = useRef<HTMLInputElement>(null);
  
  // Fetch models on component mount
  const fetchModels = async () => {
    try {
      setLoading(true);
      const data = await getChatModels();
      setModels(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch models:', err);
      setError(err.message || 'Failed to load models');
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити моделі",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchModels();
  }, []);

  // Filter models based on search query
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Почати редагування моделі
  const startEditing = (model: ChatModel) => {
    setEditableRows({
      ...editableRows,
      [model.id]: {
        id: model.id,
        name: model.name,
        openrouter_model: model.openrouter_model || '',
        max_tokens_count: model.max_tokens_count || 4096,
        input_tokens_price: model.input_tokens_price,
        output_tokens_price: model.output_tokens_price,
        icon: model.icon,
        isEditing: true
      }
    });
  };

  // Скасувати редагування
  const cancelEditing = (id: number) => {
    const newEditableRows = { ...editableRows };
    delete newEditableRows[id];
    setEditableRows(newEditableRows);
  };

  // Зберегти відредаговану модель
  const saveEditedModel = async (id: number) => {
    const editedRow = editableRows[id];
    if (!editedRow) return;

    try {
      const payload: ChatModelCreatePayload = {
        name: editedRow.name,
        openrouter_model: editedRow.openrouter_model,
        max_tokens_count: editedRow.max_tokens_count,
        input_tokens_price: editedRow.input_tokens_price,
        output_tokens_price: editedRow.output_tokens_price,
        icon_url: editedRow.icon
      };

      await updateChatModel(id, payload);
      
      toast({
        title: "Успіх",
        description: "Модель оновлено успішно",
      });
      
      // Оновити локальний стан
      setModels(models.map(model => 
        model.id === id 
          ? { 
              ...model, 
              name: editedRow.name,
              openrouter_model: editedRow.openrouter_model,
              max_tokens_count: editedRow.max_tokens_count,
              input_tokens_price: editedRow.input_tokens_price,
              output_tokens_price: editedRow.output_tokens_price,
              icon: editedRow.icon
            } 
          : model
      ));
      
      // Очистити редагований рядок
      cancelEditing(id);
    } catch (err: any) {
      toast({
        title: "Помилка",
        description: err.message || "Не вдалося оновити модель",
        variant: "destructive"
      });
    }
  };

  // Додати новий рядок для створення
  const addNewRow = () => {
    if (newRow) return; // Якщо новий рядок вже додано, нічого не робимо
    
    setNewRow({
      name: '',
      openrouter_model: '',
      max_tokens_count: 4096,
      input_tokens_price: 0,
      output_tokens_price: 0,
      icon: '',
      isNew: true,
      isEditing: true
    });
    
    // Фокус на перше поле після рендерингу
    setTimeout(() => {
      newRowRef.current?.focus();
    }, 0);
  };

  // Скасувати створення нового рядка
  const cancelNewRow = () => {
    setNewRow(null);
  };

  // Зберегти новий рядок
  const saveNewRow = async () => {
    if (!newRow) return;
    
    try {
      const payload: ChatModelCreatePayload = {
        name: newRow.name,
        openrouter_model: newRow.openrouter_model,
        max_tokens_count: newRow.max_tokens_count,
        input_tokens_price: newRow.input_tokens_price,
        output_tokens_price: newRow.output_tokens_price,
        icon_url: newRow.icon
      };

      await createChatModel(payload);
      
      toast({
        title: "Успіх",
        description: "Модель створено успішно",
      });
      
      // Оновити список
      fetchModels();
      
      // Очистити новий рядок
      setNewRow(null);
    } catch (err: any) {
      toast({
        title: "Помилка",
        description: err.message || "Не вдалося створити модель",
        variant: "destructive"
      });
    }
  };

  // Змінити значення поля для редагованого рядка
  const handleEditRowChange = (id: number, field: keyof EditableRow, value: string | number) => {
    setEditableRows({
      ...editableRows,
      [id]: {
        ...editableRows[id],
        [field]: value
      }
    });
  };

  // Змінити значення поля для нового рядка
  const handleNewRowChange = (field: keyof EditableRow, value: string | number) => {
    if (!newRow) return;
    
    setNewRow({
      ...newRow,
      [field]: value
    });
  };

  // Підготувати модель до видалення
  const prepareDelete = (model: ChatModel) => {
    setModelToDelete(model);
    setDeleteDialogOpen(true);
  };

  // Видалити модель
  const handleDeleteModel = async () => {
    if (!modelToDelete) return;
    
    try {
      await deleteChatModel(modelToDelete.id);
      
      toast({
        title: "Успіх",
        description: "Модель видалено успішно",
      });
      
      // Оновити список
      fetchModels();
      
      // Закрити діалог
      setDeleteDialogOpen(false);
      setModelToDelete(null);
    } catch (err: any) {
      toast({
        title: "Помилка",
        description: err.message || "Не вдалося видалити модель",
        variant: "destructive"
      });
    }
  };

  // Рендеринг рядка в режимі редагування
  const renderEditableRow = (row: EditableRow, isNew = false) => {
    const ref = isNew ? newRowRef : undefined;
    
    return (
      <tr className="bg-primary/5 border-primary/20">
        <td>
          <Input
            ref={ref}
            placeholder="URL іконки"
            value={row.icon}
            onChange={(e) => isNew 
              ? handleNewRowChange('icon', e.target.value) 
              : handleEditRowChange(row.id!, 'icon', e.target.value)
            }
            className="w-full"
          />
        </td>
        <td>
          <Input
            placeholder="Назва моделі"
            value={row.name}
            onChange={(e) => isNew 
              ? handleNewRowChange('name', e.target.value) 
              : handleEditRowChange(row.id!, 'name', e.target.value)
            }
            className="w-full"
          />
        </td>
        <td>
          <Input
            placeholder="OpenRouter модель"
            value={row.openrouter_model}
            onChange={(e) => isNew 
              ? handleNewRowChange('openrouter_model', e.target.value) 
              : handleEditRowChange(row.id!, 'openrouter_model', e.target.value)
            }
            className="w-full"
          />
        </td>
        <td>
          <Input
            type="number"
            placeholder="Токени"
            value={row.max_tokens_count}
            onChange={(e) => isNew 
              ? handleNewRowChange('max_tokens_count', parseInt(e.target.value)) 
              : handleEditRowChange(row.id!, 'max_tokens_count', parseInt(e.target.value))
            }
            className="w-full"
          />
        </td>
        <td>
          <Input
            type="number"
            step="0.000001"
            placeholder="Ціна вх."
            value={row.input_tokens_price}
            onChange={(e) => isNew 
              ? handleNewRowChange('input_tokens_price', parseFloat(e.target.value)) 
              : handleEditRowChange(row.id!, 'input_tokens_price', parseFloat(e.target.value))
            }
            className="w-full"
          />
        </td>
        <td>
          <Input
            type="number"
            step="0.000001"
            placeholder="Ціна вих."
            value={row.output_tokens_price}
            onChange={(e) => isNew 
              ? handleNewRowChange('output_tokens_price', parseFloat(e.target.value)) 
              : handleEditRowChange(row.id!, 'output_tokens_price', parseFloat(e.target.value))
            }
            className="w-full"
          />
        </td>
        <td>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => isNew ? saveNewRow() : saveEditedModel(row.id!)}
              className="h-8 w-8 text-green-500"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => isNew ? cancelNewRow() : cancelEditing(row.id!)}
              className="h-8 w-8 text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="AI моделі" 
        description="Керуйте моделями AI для вашого чату"
        className="mb-6"
      />

      {/* Search and actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук моделей..."
            className="pl-10 bg-white/5 border-white/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
          <p className="text-muted-foreground">Завантаження моделей...</p>
        </div>
      ) : (
        // Models table
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <th>Іконка</th>
                <th>Назва</th>
                <th>Модель OpenRouter</th>
                <th>Макс. токенів</th>
                <th>Ціна вхідних токенів</th>
                <th>Ціна вихідних токенів</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {/* Рядок для створення нової моделі */}
              {newRow && renderEditableRow(newRow, true)}
              
              {/* Існуючі моделі */}
              {filteredModels.length === 0 && !newRow ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <p className="text-muted-foreground">Немає доступних моделей</p>
                  </td>
                </tr>
              ) : (
                filteredModels.map((model) => {
                  // Якщо рядок в режимі редагування
                  if (editableRows[model.id]) {
                    return renderEditableRow(editableRows[model.id]);
                  }
                  
                  // Звичайний рядок
                  return (
                    <tr key={model.id}>
                      <td>
                        {model.icon && (
                          <img 
                            src={model.icon} 
                            alt={model.name} 
                            className="w-8 h-8 rounded-full" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                            }}
                          />
                        )}
                      </td>
                      <td>{model.name}</td>
                      <td>{model.openrouter_model || 'Не вказано'}</td>
                      <td>{model.max_tokens_count || 'Не вказано'}</td>
                      <td>${model.input_tokens_price}</td>
                      <td>${model.output_tokens_price}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => startEditing(model)}
                            className="h-8 w-8"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => prepareDelete(model)}
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* Кнопка для додавання нового рядка */}
              {!newRow && (
                <tr>
                  <td colSpan={7} className="text-center py-2 hover:bg-primary/10">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full text-primary"
                      onClick={addNewRow}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Додати нову модель
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Видалити AI модель</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Ви впевнені, що хочете видалити модель <strong>{modelToDelete?.name}</strong>? 
              Це видалення не можна буде скасувати.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Скасувати
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteModel}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIModelsPage;
