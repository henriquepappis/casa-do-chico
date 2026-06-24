import React, { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getUser, clearAuth } from '../lib/auth';

type NavItem = "visao" | "mesas" | "cardapio" | "historico" | "usuarios";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  current?: NavItem;
  onNavigate?: (item: NavItem) => void;
}

export default function DashboardLayout({ children, onLogout, current = "mesas", onNavigate }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    onLogout();
  };

  const navItems: { id: NavItem; label: string; icon: string; donoOnly?: boolean }[] = [
    { id: "visao", label: "Visão Geral", icon: "🏠", donoOnly: true },
    { id: "mesas", label: "Mesas", icon: "🪑" },
    { id: "cardapio", label: "Cardápio", icon: "📋", donoOnly: true },
    { id: "historico", label: "Relatórios", icon: "📊", donoOnly: true },
    { id: "usuarios", label: "Usuários", icon: "👥", donoOnly: true },
  ];

  const go = (item: NavItem) => {
    setIsOpen(false);
    onNavigate?.(item);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-4">
          <img
            src="/logo.jpeg"
            alt="Casa do Chico"
            className="w-10 h-10 object-cover flex-shrink-0"
          />
          <div>
            <h1 className="text-lg font-bold text-display-sm leading-tight">Casa do Chico</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Admin</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4">
            Operações
          </div>
          {navItems
            .filter((item) => !item.donoOnly || user?.role === 'DONO')
            .map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left',
                  current === item.id
                    ? 'bg-sidebar-accent/20 text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
        </div>
      </nav>

      {/* Footer com usuário */}
      <div className="p-6 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-sm font-bold uppercase" style={{ color: '#dc2626' }}>
            {user?.username?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.username}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.role === 'DONO' ? 'Dono' : 'Garçom'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2 text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex w-80 flex-col border-r border-border">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Casa do Chico" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-sm">Casa do Chico</span>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
