import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Home, Users, Building2, FileText, Settings, BarChart, DollarSign, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: any;
  action: () => void;
  keywords: string[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandItem[] = [
    // Global Navigation
    {
      id: 'nav-home',
      title: 'Home',
      description: 'Go to homepage',
      icon: Home,
      action: () => navigate('/'),
      keywords: ['home', 'index', 'main'],
    },
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Go to your dashboard',
      icon: BarChart,
      action: () => navigate(user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/dashboard'),
      keywords: ['dashboard', 'overview', 'home'],
    },
    {
      id: 'nav-properties',
      title: 'Properties',
      description: 'View all properties',
      icon: Building2,
      action: () => navigate('/properties'),
      keywords: ['properties', 'buildings', 'real estate'],
    },
    
    // Admin Only
    ...(user?.role === 'admin' ? [
      {
        id: 'admin-users',
        title: 'User Management',
        description: 'Manage system users',
        icon: Users,
        action: () => navigate('/admin?tab=users'),
        keywords: ['users', 'admin', 'management', 'accounts'],
      },
      {
        id: 'admin-vendors',
        title: 'Vendor Management',
        description: 'Manage vendors',
        icon: Wrench,
        action: () => navigate('/admin?tab=vendors'),
        keywords: ['vendors', 'contractors', 'suppliers'],
      },
      {
        id: 'admin-rfq',
        title: 'RFQ Management',
        description: 'Manage RFQs',
        icon: FileText,
        action: () => navigate('/admin?tab=projects'),
        keywords: ['rfq', 'request', 'quotation', 'bids'],
      },
      {
        id: 'admin-payments',
        title: 'Payment Management',
        description: 'Manage payments',
        icon: DollarSign,
        action: () => navigate('/admin?tab=payments'),
        keywords: ['payments', 'invoices', 'finance', 'billing'],
      },
      {
        id: 'admin-security',
        title: 'Security Settings',
        description: 'Security & monitoring',
        icon: Settings,
        action: () => navigate('/admin?tab=testing'),
        keywords: ['security', 'settings', 'config', 'admin'],
      },
    ] : []),
    
    // Vendor Only
    ...(user?.role === 'vendor' ? [
      {
        id: 'vendor-projects',
        title: 'My Projects',
        description: 'View your projects',
        icon: FileText,
        action: () => navigate('/vendor/projects'),
        keywords: ['projects', 'work', 'assignments'],
      },
      {
        id: 'vendor-rfq',
        title: 'RFQ Opportunities',
        description: 'Browse available RFQs',
        icon: FileText,
        action: () => navigate('/vendor/rfq'),
        keywords: ['rfq', 'opportunities', 'bids'],
      },
      {
        id: 'vendor-payments',
        title: 'Payments',
        description: 'View payment history',
        icon: DollarSign,
        action: () => navigate('/vendor/payments'),
        keywords: ['payments', 'invoices', 'billing'],
      },
      {
        id: 'vendor-documents',
        title: 'Documents',
        description: 'Manage your documents',
        icon: FileText,
        action: () => navigate('/vendor/documents'),
        keywords: ['documents', 'files', 'uploads'],
      },
    ] : []),
    
    // Settings (All users)
    {
      id: 'settings',
      title: 'Settings',
      description: 'Account settings',
      icon: Settings,
      action: () => navigate('/settings'),
      keywords: ['settings', 'preferences', 'account', 'profile'],
    },
  ];

  const filteredCommands = search
    ? commands.filter((command) => {
        const searchLower = search.toLowerCase();
        return (
          command.title.toLowerCase().includes(searchLower) ||
          command.description?.toLowerCase().includes(searchLower) ||
          command.keywords.some((keyword) => keyword.includes(searchLower))
        );
      })
    : commands;

  const runCommand = useCallback((command: CommandItem) => {
    setOpen(false);
    command.action();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {filteredCommands.map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={() => runCommand(command)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{command.title}</span>
                  {command.description && (
                    <span className="text-xs text-muted-foreground">{command.description}</span>
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
