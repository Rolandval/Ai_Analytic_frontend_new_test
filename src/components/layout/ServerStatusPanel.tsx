import { useState, useEffect } from 'react';

interface DatabaseStatus {
  mysql: string;
  postgresql: string;
  mssql: string;
}

interface HealthResponse {
  status: string;
  databases: DatabaseStatus;
}

export const ServerStatusPanel = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false); // Згорнуто за замовчуванням

  useEffect(() => {
    const abortController = new AbortController();

    const fetchHealth = async () => {
      try {
        const response = await fetch('/health', { signal: abortController.signal });
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch server health:', error);
        }
      }
    };

    fetchHealth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, []);

  // Get status indicator color based on connection status
  const getStatusColor = (status: string) => {
    if (status === 'connected') return 'bg-green-500';
    if (status.startsWith('error')) return 'bg-red-500';
    return 'bg-yellow-500'; // unknown
  };

  return (
    <div className="absolute bottom-4 left-4 z-30">
      <div className="flex flex-col items-start">
        <button 
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-black/70 transition-all"
          onClick={() => setIsOpen(!isOpen)} // Додано стан для показу/приховування панелі
        >
          <span>MCP сервери</span>
          <div className={`w-2 h-2 rounded-full ${health ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </button>
        
        {isOpen && (
  <div className="mt-2 p-3 rounded-lg bg-black/70 backdrop-blur-lg shadow-xl border border-white/10 text-white w-52 animate-fadeIn transition-all duration-200">
    <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Статус баз даних</h3>

    {!health ? ( 
      <div className="text-gray-400 text-sm">Завантаження...</div>
    ) : ( 
      <div className="space-y-2.5">
        {Object.entries(health.databases).map(([db, status]) => {
          const isConnected = status === 'connected';
          return (
            <div key={db} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`}></div>
                <span className="text-sm capitalize">{db}</span>
              </div>
              <span 
                className={`text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
              >
                {isConnected ? 'підключено' : 'помилка'}
              </span>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

      </div>
    </div>
  );
};

export default ServerStatusPanel;
