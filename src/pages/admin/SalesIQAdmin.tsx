import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  DEFAULT_SALESIQ_CONFIG,
  getSalesIQConfig,
  saveSalesIQConfig,
  setConsent,
  type SalesIQConfig,
} from '@/lib/salesiq';

export default function SalesIQAdmin() {
  const [cfg, setCfg] = useState<SalesIQConfig>(() => getSalesIQConfig());

  const save = () => {
    saveSalesIQConfig(cfg);
    toast.success('Zoho SalesIQ settings updated');
  };

  const reset = () => {
    setCfg(DEFAULT_SALESIQ_CONFIG);
    saveSalesIQConfig(DEFAULT_SALESIQ_CONFIG);
    toast.success('Restored default settings');
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Chat (Zoho SalesIQ)</h1>
        <p className="text-muted-foreground">
          Update the SalesIQ widget configuration without redeploying.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Widget Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="widgetCode">Widget code (from Zoho embed snippet `wc=`)</Label>
            <Input
              id="widgetCode"
              value={cfg.widgetCode}
              onChange={(e) => setCfg({ ...cfg, widgetCode: e.target.value.trim() })}
              spellCheck={false}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Paste only the long alphanumeric value after <code>wc=</code> in the script URL.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="enabled" className="text-base">Enable widget</Label>
              <p className="text-xs text-muted-foreground">Turn the chat widget on or off globally.</p>
            </div>
            <Switch
              id="enabled"
              checked={cfg.enabled}
              onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="consent" className="text-base">Require visitor consent (GDPR)</Label>
              <p className="text-xs text-muted-foreground">
                When on, the widget loads only after the visitor accepts the chat-cookie banner.
              </p>
            </div>
            <Switch
              id="consent"
              checked={cfg.requireConsent}
              onCheckedChange={(v) => setCfg({ ...cfg, requireConsent: v })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>Save changes</Button>
            <Button variant="outline" onClick={reset}>Restore defaults</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setConsent('granted');
                toast.success('Consent granted for this browser');
              }}
            >
              Force-grant consent (this browser)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
