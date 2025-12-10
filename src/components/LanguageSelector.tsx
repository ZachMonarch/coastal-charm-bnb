
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
  flag: string;
};

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
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

  return (
    <div className="flex items-center">
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger 
          className="w-[80px] h-10 min-h-[44px] border border-border bg-card hover:bg-primary/10 hover:border-primary/50 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors shadow-sm" 
          aria-label="Select Language"
        >
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Select language" />
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
