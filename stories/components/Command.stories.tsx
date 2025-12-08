import type { Meta, StoryObj } from "@storybook/react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Home, Building, Users, Settings, FileText, Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Command> = {
  title: "Components/Command",
  component: Command,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem>
            <Building className="mr-2 h-4 w-4" />
            <span>Properties</span>
          </CommandItem>
          <CommandItem>
            <Users className="mr-2 h-4 w-4" />
            <span>Tenants</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

const CommandDialogDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>{" "}
          or click the button to open the command menu
        </p>
        <Button onClick={() => setOpen(true)}>Open Command Menu</Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => setOpen(false)}>
              <Home className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Building className="mr-2 h-4 w-4" />
              <span>View Properties</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Users className="mr-2 h-4 w-4" />
              <span>Manage Tenants</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => setOpen(false)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export const Dialog: Story = {
  render: () => <CommandDialogDemo />,
};

export const PropertySearch: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-2xl">
      <CommandInput placeholder="Search properties..." />
      <CommandList>
        <CommandEmpty>No properties found.</CommandEmpty>
        <CommandGroup heading="Available Properties">
          <CommandItem>
            <Building className="mr-2 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Downtown Loft</div>
              <div className="text-xs text-muted-foreground">
                123 Main St • 2 bed, 2 bath • $2,500/mo
              </div>
            </div>
          </CommandItem>
          <CommandItem>
            <Building className="mr-2 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Suburban Home</div>
              <div className="text-xs text-muted-foreground">
                456 Oak Ave • 3 bed, 2 bath • $3,200/mo
              </div>
            </div>
          </CommandItem>
          <CommandItem>
            <Building className="mr-2 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">City Center Studio</div>
              <div className="text-xs text-muted-foreground">
                789 Elm St • Studio • $1,800/mo
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Rented Properties">
          <CommandItem>
            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">Lakeside Condo</div>
              <div className="text-xs text-muted-foreground">
                321 Lake Dr • 2 bed, 1 bath • Occupied
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Search navigation..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Dashboard">
          <CommandItem>
            <Home className="mr-2 h-4 w-4" />
            <span>Overview</span>
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 h-4 w-4" />
            <span>Reports</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Management">
          <CommandItem>
            <Building className="mr-2 h-4 w-4" />
            <span>Properties</span>
          </CommandItem>
          <CommandItem>
            <Users className="mr-2 h-4 w-4" />
            <span>Tenants</span>
          </CommandItem>
          <CommandItem>
            <Users className="mr-2 h-4 w-4" />
            <span>Vendors</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
