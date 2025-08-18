import { useEffect, useState } from "react";
import { Plus, MoreVertical, Search, Settings, Archive, MessageSquare, DollarSign } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/Select";
import { ModelsPricingModal } from "@/components/chat/ModelsPricingModal";

import { cn } from "@/lib/utils";

export const ChatSidebar = () => {
  const { chats, models, fetchChats, fetchModels, createChat, deleteChat, renameChat, selectChat, currentChatId } = useChatStore();
  const [openNew, setOpenNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [newModel, setNewModel] = useState<string>("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // close menu on outside click
  useEffect(() => {
    const handler = () => setMenuOpenId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    fetchChats();
    fetchModels();
  }, [fetchChats, fetchModels]);

  const handleCreate = async () => {
    if (!newName || !newModel) return;
    await createChat(newName, newModel);
    setOpenNew(false);
    setNewName("");
    setNewModel("");
  };
  
  // Filter chats by search term
  const filteredChats = chats.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden sidebar">
      {/* Header with logo and actions */}
      <div className="p-4 border-b border-white/10 backdrop-blur-sm bg-black/20 flex justify-between items-center">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 text-purple-400 mr-2" />
          <h2 className="font-semibold text-foreground text-lg">AI Чат</h2>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full h-8 w-8 hover:bg-white/10"
            title="Налаштування"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full h-8 w-8 hover:bg-white/10"
            title="Архів чатів"
          >
            <Archive className="w-4 h-4 text-gray-400" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full h-8 w-8 hover:bg-white/10 bg-green-500/20" 
            onClick={() => setPricingModalOpen(true)}
            title="Ціни на моделі"
          >
            <DollarSign className="w-4 h-4 text-green-400" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full h-8 w-8 hover:bg-white/10 bg-purple-500/20" 
            onClick={() => setOpenNew(true)}
            title="Новий чат"
          >
            <Plus className="w-4 h-4 text-purple-400" />
          </Button>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="p-3 border-b border-white/10">
        <div className={cn(
          "flex items-center px-3 py-1.5 rounded-full transition-all",
          "bg-white/5 border border-white/10",
          isSearchFocused && "ring-1 ring-purple-500/50 border-purple-500/30 bg-white/10"
        )}>
          <Search className={cn(
            "w-4 h-4 mr-2 transition-colors", 
            isSearchFocused ? "text-purple-400" : "text-gray-500"
          )} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Пошук чатів..."
            className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 text-sm h-6 p-0"
          />
        </div>
      </div>
      
      {/* Chat list with scrolling */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-1">
          {filteredChats.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {search ? "Чатів не знайдено" : "Немає чатів"}
            </div>
          )}
          
          {filteredChats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "relative group flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-all",
              "border border-transparent",
              currentChatId === chat.id 
                ? "bg-purple-500/20 border-purple-500/30" 
                : "hover:bg-white/5"
            )}
            onClick={() => selectChat(chat.id)}
          >
            {/* Active indicator */}
            {currentChatId === chat.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 rounded-full" />
            )}
            
            {/* Model icon */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-white/10 mr-3">
              {(() => {
                const m = models.find((mo) => mo.name === chat.model);
                return m ? (
                  <img src={m.icon} alt={m.name} className="w-4 h-4" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                );
              })()}
            </div>
            
            {/* Chat name */}
            <span className={cn(
              "truncate text-sm flex-1",
              currentChatId === chat.id ? "text-purple-100" : "text-gray-300"
            )}>
              {chat.name}
            </span>
            
            {/* Actions button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
              }}
              className={cn(
                "p-1 rounded-full hover:bg-white/10 transition-all",
                "opacity-0 group-hover:opacity-100",
                menuOpenId === chat.id && "opacity-100 bg-white/10"
              )}
            >
              <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
            </button>
            
            {/* Context menu */}
            {menuOpenId === chat.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 top-full mt-1.5 z-50 w-44 p-1.5 rounded-md shadow-lg backdrop-blur-xl bg-gray-900/90 border border-white/10"
              >
                <button
                  onClick={() => {
                    const newName = prompt("Нова назва чату", chat.name);
                    if (newName) renameChat(chat.id, newName);
                    setMenuOpenId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-200 hover:bg-white/10 transition-colors flex items-center"
                >
                  Перейменувати
                </button>
                <button
                  onClick={() => {
                    if (confirm("Видалити чат?")) deleteChat(chat.id);
                    setMenuOpenId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-md text-red-400 hover:bg-red-500/20 transition-colors flex items-center"
                >
                  Видалити
                </button>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
      
      {filteredChats.length === 0 && !search && (
        <div className="p-4 flex justify-center">
          <Button 
            onClick={() => setOpenNew(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Новий чат
          </Button>
        </div>
      )}
      
      {/* New Chat Dialog with improved styling */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-sm bg-gray-900 border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-center font-medium">Новий чат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1.5 block">Назва чату</label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Введіть назву чату..." 
                className="bg-white/5 border-white/10 focus-visible:ring-purple-500/40" 
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1.5 block">Модель AI</label>
              <Select value={newModel} onValueChange={(v) => setNewModel(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 focus:ring-purple-500/40">
                  <SelectValue placeholder="Оберіть модель AI" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border border-white/10">
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.name} className="focus:bg-white/10 cursor-pointer">
                      <div className="flex items-center">
                        {m.icon && <img src={m.icon} alt={m.name} className="w-4 h-4 mr-2" />}
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 border-white/10 hover:bg-white/5 text-gray-300"
              onClick={() => setOpenNew(false)}
            >
              Скасувати
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              onClick={handleCreate}
              disabled={!newName || !newModel}
            >
              Створити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Models Pricing Modal */}
      <ModelsPricingModal 
        open={pricingModalOpen} 
        onOpenChange={setPricingModalOpen} 
      />
    </div>
  );
};
