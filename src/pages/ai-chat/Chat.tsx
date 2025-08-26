import React from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
 import { McpLiveLogger } from '@/components/mcp-logs/McpLiveLogger';
import { cn } from '@/lib/utils';

const AIChat: React.FC = () => (
  <div className="flex h-[92vh] w-full overflow-hidden relative bg-black mx-auto my-[4vh] rounded-xl border border-white/5 shadow-2xl">
    {/* Gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-80 pointer-events-none" />
    
    {/* Subtle grid pattern overlay */}
    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
    
    {/* Left sidebar with subtle border */}
    <div className={cn(
      "w-64 relative z-10 border-r border-white/10",
      "transition-all duration-300 ease-in-out",
      "shadow-[5px_0_15px_rgba(0,0,0,0.1)]"
    )}>
      <ChatSidebar />
    </div>
    
    {/* Main chat area with improved spacing */}
    <div className="flex-1 flex flex-col overflow-hidden relative z-10">
      <div className="flex-1 p-4 sm:p-6 pb-8 flex flex-col overflow-hidden max-h-[80vh]">
        <ChatWindow />
      </div>
    </div>
    
    {/* Status panel з відновленим розташуванням */}
 
    
    {/* MCP Live Logger for SQL queries */}
    <McpLiveLogger />
  </div>
);

export { AIChat };
export default AIChat;