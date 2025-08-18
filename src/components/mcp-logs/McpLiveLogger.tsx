import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Database, ArrowDownCircle } from 'lucide-react';
import useWebSocket from 'react-use-websocket';

interface LogMessage {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  database?: string;
}

export const McpLiveLogger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  const ws_url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/chat/ws/mcp-logs`;
  
  const { lastMessage } = useWebSocket(ws_url, {
    onOpen: () => {
      console.log('WebSocket connected');
      setConnected(true);
    },
    onClose: () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    },
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000
  });
  
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data);
        // Генеруємо унікальний ID для кожного повідомлення
        const newLog: LogMessage = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: Object.keys(data)[0],
          message: data[Object.keys(data)[0]],
          database: Object.keys(data)[0]
        };
        
        setLogs((prevLogs) => [...prevLogs.slice(-99), newLog]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage]);
  
  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);
  
  // Handle scroll to detect when user manually scrolls up
  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };
  
  const clearLogs = () => setLogs([]);
  
  const handleToggle = () => setIsOpen(!isOpen);

  // Функція для визначення класу CSS на основі типу бази даних
  const getDatabaseClass = (type?: string) => {
    switch(type) {
      case 'mysql': return 'text-green-500';
      case 'postgresql': return 'text-blue-500';
      case 'mssql': return 'text-yellow-500';
      case 'qdrant': return 'text-purple-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      {/* Кнопка для показу/приховування логів */}
      <Button
        onClick={handleToggle}
        className={`fixed bottom-4 right-4 z-50 rounded-full p-3 ${connected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
        title="MCP Live Logs"
      >
        <Database size={20} className="text-white" />
      </Button>
      
      {/* Модальне вікно з логами */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[500px] rounded-lg bg-gray-900 border border-gray-700 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              <Database size={20} className="text-yellow-400 mr-2" />
              <h3 className="text-white font-medium">MCP Live Logs</h3>
              <span className={`ml-3 inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={clearLogs}
                variant="ghost"
                className="h-8 px-2 text-gray-400 hover:text-white"
                title="Clear logs"
              >
                Clear
              </Button>
              {!autoScroll && (
                <Button
                  onClick={() => setAutoScroll(true)}
                  variant="ghost"
                  className="h-8 px-2 text-gray-400 hover:text-white"
                  title="Scroll to bottom"
                >
                  <ArrowDownCircle size={16} />
                </Button>
              )}
              <Button
                onClick={handleToggle}
                variant="ghost"
                className="h-8 px-2 text-gray-400 hover:text-white"
                title="Close"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
          
          <div 
            className="p-2 overflow-y-auto bg-gray-950 text-sm font-mono h-[400px]" 
            ref={logContainerRef}
            onScroll={handleScroll}
          >
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                Очікування SQL-запитів...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="mb-1 py-1 px-2 border-l-4 border-gray-700 hover:bg-gray-900">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`font-semibold ${getDatabaseClass(log.database)}`}>
                      {log.database?.toUpperCase()}
                    </span>
                  </div>
                  <pre className="mt-1 text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    {log.message}
                  </pre>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  );
};

export default McpLiveLogger;
