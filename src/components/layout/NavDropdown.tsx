import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
  icon?: ReactNode;
  className?: string;
}

export default function NavDropdown({ label, items, icon, className }: NavDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
          "text-foreground hover:text-primary hover:bg-primary/5",
          "data-[state=open]:bg-primary/5 data-[state=open]:text-primary",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
          "relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
          "after:w-0 data-[state=open]:after:w-3/4 after:h-0.5 after:bg-primary after:transition-all",
          className
        )}
        aria-label={`${label} menu`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 transition-transform duration-200 data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[220px] bg-popover border border-border shadow-xl z-[500] dark:border-border/50"
      >
        {items.map((item, index) => (
          <DropdownMenuItem key={index} asChild>
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors"
            >
              {item.icon && <span className="text-primary">{item.icon}</span>}
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                )}
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
