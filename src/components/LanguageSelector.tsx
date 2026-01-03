import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Language = {
  code: string;
  name: string;
  abbr: string;
  flag: string;
};

const languages: Language[] = [
  { code: "en", name: "English", abbr: "EN", flag: "🇬🇧" },
  { code: "it", name: "Italiano", abbr: "IT", flag: "🇮🇹" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  if (!mounted) {
    return null;
  }

  const currentLanguage = languages.find(l => l.code === language);
  const iconColor = isDark ? '#f5f5f5' : '#262626';
  
  return (
    <div className="flex items-center">
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger 
          className="w-[65px] h-10 min-h-[40px] border-0 bg-transparent hover:bg-primary/10 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          aria-label="Select Language"
          style={{ color: iconColor }}
        >
          <div className="flex items-center space-x-1.5">
            <Globe className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-bold">{currentLanguage?.abbr || 'EN'}</span>
          </div>
        </SelectTrigger>
        <SelectContent align="start" className="w-[160px] z-[500] bg-popover border-border">
          {languages.map((lang) => (
            <SelectItem 
              key={lang.code} 
              value={lang.code} 
              className="cursor-pointer rounded-md text-foreground hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <div className="flex items-center space-x-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
