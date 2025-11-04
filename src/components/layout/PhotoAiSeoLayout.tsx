import { Outlet } from 'react-router-dom';
import PhotoAiSeoSidebar from './PhotoAiSeoSidebar';

export default function PhotoAiSeoLayout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-100/50 dark:from-slate-950 dark:via-cyan-950 dark:to-blue-950">
      <PhotoAiSeoSidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
