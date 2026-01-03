
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

  // This effect is to ensure hydration doesn't cause issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  if (!mounted) {
    return null;
  }

  const currentLanguage = languages.find(l => l.code === language);
  
  return (
    <div className="flex items-center">
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger 
          className="w-[60px] md:w-[65px] h-9 md:h-10 min-h-[36px] md:min-h-[40px] border border-border/40 dark:border-border/60 bg-transparent hover:bg-muted/50 hover:border-primary/50 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors" 
          aria-label="Select Language"
        >
          <div className="flex items-center space-x-1 md:space-x-1.5">
            <Globe className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{currentLanguage?.abbr || 'EN'}</span>
          </div>
        </SelectTrigger>
        <SelectContent align="start" className="w-[160px] z-[500] bg-popover border-border dark:border-border/50">
          {languages.map((language) => (
            <SelectItem 
              key={language.code} 
              value={language.code} 
              className="cursor-pointer rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <div className="flex items-center space-x-2">
                <span>{language.flag}</span>
                <span className="text-foreground">{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
