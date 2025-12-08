import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const analysis = useMemo(() => {
    const requirements: Requirement[] = [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { label: "Contains a number", met: /\d/.test(password) },
      { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const score = requirements.filter((r) => r.met).length;
    
    let strength: "weak" | "fair" | "good" | "strong" = "weak";
    let color = "bg-destructive";
    
    if (score >= 5) {
      strength = "strong";
      color = "bg-success";
    } else if (score >= 4) {
      strength = "good";
      color = "bg-primary";
    } else if (score >= 3) {
      strength = "fair";
      color = "bg-warning";
    }

    return { requirements, score, strength, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                analysis.score >= segment ? analysis.color : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs">
          <span className={cn(
            "font-medium capitalize",
            analysis.strength === "weak" && "text-destructive",
            analysis.strength === "fair" && "text-warning",
            analysis.strength === "good" && "text-primary",
            analysis.strength === "strong" && "text-success"
          )}>
            {analysis.strength}
          </span>
          <span className="text-muted-foreground">
            {analysis.score}/5 requirements
          </span>
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {analysis.requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 transition-colors",
              req.met ? "text-success" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
