import { Edit2, Trash2, Code } from 'lucide-react';
import { Extension } from '@/types/extensions';
import { Button } from '@/components/ui/Button';

interface ExtensionsListProps {
  extensions: Extension[];
  onEditClick: (extension: Extension) => void;
  onDeleteClick: (extension: Extension) => void;
}

export const ExtensionsList = ({ extensions, onEditClick, onDeleteClick }: ExtensionsListProps) => {

  return (
    <div className="space-y-6">
      {extensions.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-lg">
          <Code className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">Немає розширень</h3>
          <p className="text-muted-foreground text-sm mb-4">Створіть ваше перше AI розширення для покращення можливостей чату</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {extensions.map((extension) => (
            <div
              key={extension.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                  {extension.table_name}
                </h3>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full opacity-70 hover:opacity-100 hover:bg-white/10 text-blue-400"
                    onClick={() => onEditClick(extension)}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Редагувати</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full opacity-70 hover:opacity-100 hover:bg-white/10 text-red-400"
                    onClick={() => onDeleteClick(extension)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Видалити</span>
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {extension.descriptions}
              </p>
              
              <div className="bg-black/20 rounded p-3 mb-3 max-h-24 overflow-hidden relative">
                <pre className="text-xs text-gray-400 font-mono">
                  <code className="whitespace-pre-wrap line-clamp-3">{extension.db_name}</code>
                </pre>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>База даних: {extension.db_name}</span>
                <span>ID: {extension.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
