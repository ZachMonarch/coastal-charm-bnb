import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Theme Toggle - Uses next-themes for unified theme management
 * No manual DOM manipulation - relies on ThemeProvider
 */
export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full min-w-[40px] min-h-[40px] w-10 h-10 bg-transparent"
        aria-label="Toggle theme"
        disabled
      >
        <span className="sr-only">Toggle theme</span>
        <div className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-lg min-w-[44px] min-h-[44px] w-11 h-11 transition-all duration-300 bg-transparent border-0 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun 
          className="h-5 w-5 lucide-sun transition-transform duration-500" 
          strokeWidth={2.5}
        />
      ) : (
        <Moon 
          className="h-5 w-5 lucide-moon transition-transform duration-500" 
          strokeWidth={2.5}
        />
      )}
    </Button>
  );
}
