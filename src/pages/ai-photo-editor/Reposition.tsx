import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Move } from 'lucide-react';

export default function AIPhotoEditorReposition() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/ai-photo-editor">Назад</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Move className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Розташування</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Переміщення та вирівнювання елементів на зображенні</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Скоро буде доступно</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ця функція в розробці.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
