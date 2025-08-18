import { useState, useCallback, useRef } from 'react';

interface TaskProgressData {
  status?: 'init' | 'started' | 'finished' | 'error' | 'done';
  type?: 'ping' | 'pong';
  table?: string;
  updated_prices?: number;
  error?: string;
  total_updated_prices?: number;
  results?: Array<{ name: string; updated_prices: number }>;
  total_tables?: number;
  tables?: string[];
  processed_tables?: number;
}

interface UseTaskWebSocketReturn {
  isConnected: boolean;
  isRunning: boolean;
  progress: number;
  currentTables: string[]; // Changed to array
  completedTables: string[];
  totalTables: number;
  totalUpdatedPrices: number;
  supplierPrices: Array<{ name: string; updated_prices: number }>; // Add per-supplier tracking
  errors: Array<{ table: string; error: string }>;
  isComplete: boolean;
  startTask: (taskId: number) => void;
  resetProgress: () => void;
}

export const useTaskWebSocket = (): UseTaskWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTables, setCurrentTables] = useState<string[]>([]); // Changed to array
  const [completedTables, setCompletedTables] = useState<string[]>([]);
  const [totalTables, setTotalTables] = useState(0);
  const [totalUpdatedPrices, setTotalUpdatedPrices] = useState(0);
  const [supplierPrices, setSupplierPrices] = useState<Array<{ name: string; updated_prices: number }>>([]);
  const [errors, setErrors] = useState<Array<{ table: string; error: string }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const tablesInProgress = useRef<Set<string>>(new Set());
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setCurrentTables([]); // Reset array
    setCompletedTables([]);
    setTotalTables(0);
    setTotalUpdatedPrices(0);
    setSupplierPrices([]);
    setErrors([]);
    setIsComplete(false);
    setIsRunning(false);
    tablesInProgress.current.clear();
  }, []);

  const startTask = useCallback((taskId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    resetProgress();
    setIsRunning(true);

    // Clear any existing intervals
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.hostname === '185.233.44.234' ? '8002' : '80';
    const wsUrl = `${protocol}//${host}:${port}/tasks/ws/task/${taskId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected for task:', taskId);
      
      // Set up keepalive ping every 30 seconds
      keepAliveRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
          console.log('Sent keepalive ping');
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data: TaskProgressData = JSON.parse(event.data);
        
        // Handle ping/pong for keepalive
        if (data.type === 'pong') {
          console.log('Received pong from server');
          return;
        }
        
        console.log('WebSocket message:', data);

        if (data.status === 'init') {
          console.log('Received init status:', data);
          if (data.total_tables) {
            setTotalTables(data.total_tables);
          }
          if (data.tables) {
            console.log('Tables to process:', data.tables);
          }
        }
        else if (data.status === 'started' && data.table) {
          tablesInProgress.current.add(data.table);
          setCurrentTables(Array.from(tablesInProgress.current)); // Update current tables array
          console.log(`Started processing: ${data.table}`);
        } 
        else if (data.status === 'finished' && data.table) {
          console.log(`Finished processing: ${data.table}, updated prices: ${data.updated_prices}`);
          
          // Remove from in-progress and add to completed
          tablesInProgress.current.delete(data.table);
          
          setCompletedTables(prev => {
            if (!prev.includes(data.table!)) {
              const newCompleted = [...prev, data.table!];
              
              // Update progress based on known total
              if (totalTables > 0) {
                const newProgress = (newCompleted.length / totalTables) * 100;
                console.log(`Progress update: ${newCompleted.length}/${totalTables} = ${newProgress}%`);
                setProgress(newProgress);
              }
              
              return newCompleted;
            }
            return prev;
          });
          
          // Add updated prices (ensure it's a number)
          if (data.updated_prices !== undefined && data.updated_prices !== null) {
            const pricesCount = typeof data.updated_prices === 'number' ? data.updated_prices : 0;
            console.log(`Adding ${pricesCount} prices from ${data.table}`);
            
            // Update total prices
            setTotalUpdatedPrices(prev => {
              const newTotal = prev + pricesCount;
              console.log(`Total prices: ${prev} + ${pricesCount} = ${newTotal}`);
              return newTotal;
            });
            
            // Update per-supplier prices
            setSupplierPrices(prev => {
              const existing = prev.find(s => s.name === data.table);
              if (existing) {
                return prev.map(s => 
                  s.name === data.table 
                    ? { ...s, updated_prices: s.updated_prices + pricesCount }
                    : s
                );
              } else {
                return [...prev, { name: data.table!, updated_prices: pricesCount }];
              }
            });
          }
          
          // Update current tables array
          setCurrentTables(Array.from(tablesInProgress.current));
        }
        else if (data.status === 'error' && data.table) {
          console.log(`Error processing: ${data.table}, error: ${data.error}`);
          setErrors(prev => [...prev, { table: data.table!, error: data.error || 'Unknown error' }]);
          tablesInProgress.current.delete(data.table);
          
          // Still count as "completed" for progress purposes
          setCompletedTables(prev => {
            if (!prev.includes(data.table!)) {
              const newCompleted = [...prev, data.table!];
              if (totalTables > 0) {
                setProgress((newCompleted.length / totalTables) * 100);
              }
              return newCompleted;
            }
            return prev;
          });
          
          // Update current tables array
          setCurrentTables(Array.from(tablesInProgress.current));
        }
        else if (data.status === 'done') {
          console.log('Task completed:', data);
          setIsComplete(true);
          setIsRunning(false);
          setProgress(100);
          setCurrentTables([]); // Clear current tables
          
          if (data.total_updated_prices !== undefined) {
            setTotalUpdatedPrices(data.total_updated_prices);
          }
          
          console.log(`Final results - Processed: ${data.processed_tables || 'unknown'}, Total: ${data.total_tables || totalTables}, Updated prices: ${data.total_updated_prices}`);
          
          // Auto-hide progress bar after 8 seconds
          setTimeout(() => {
            resetProgress();
          }, 8000);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrors(prev => [...prev, { table: 'Connection', error: 'WebSocket connection error' }]);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
      
      // Clear keepalive interval
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      
      // If task is still running and connection was lost unexpectedly, try to reconnect
      if (isRunning && !isComplete && event.code !== 1000) {
        console.log('Attempting to reconnect in 5 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Reconnecting WebSocket...');
          startTask(taskId);
        }, 5000);
      } else {
        setIsRunning(false);
      }
    };
  }, [totalTables, completedTables.length, resetProgress]);

  return {
    isConnected,
    isRunning,
    progress,
    currentTables, // Return array instead of single table
    completedTables,
    totalTables,
    totalUpdatedPrices,
    supplierPrices,
    errors,
    isComplete,
    startTask,
    resetProgress,
  };
};
