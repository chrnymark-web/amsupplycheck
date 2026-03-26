import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Clock, 
  Search, 
  Globe, 
  Bell, 
  Mail, 
  Save,
  RefreshCw,
  Settings,
  Calendar,
  Zap
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiscoveryConfigData {
  id: string;
  schedule_cron: string;
  search_queries: string[];
  regions_enabled: string[];
  notifications_enabled: boolean;
  email_recipients: string[];
  daily_digest_enabled: boolean;
  alert_on_failure: boolean;
  auto_approve_threshold: number;
}

const SCHEDULE_OPTIONS = [
  { value: '0 2 1 * *', label: 'Monthly (1st at 02:00 UTC)' },
  { value: '0 2 * * *', label: 'Daily at 02:00 UTC' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 */12 * * *', label: 'Every 12 hours' },
  { value: '0 2 * * 0', label: 'Weekly (Sunday 02:00 UTC)' },
  { value: '0 2 * * 1,4', label: 'Twice a week (Mon & Thu)' },
];

const REGION_OPTIONS = ['Europe', 'North America', 'Asia', 'South America', 'Australia', 'Africa'];

export function DiscoveryConfig() {
  const [config, setConfig] = useState<DiscoveryConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queriesText, setQueriesText] = useState('');
  const [emailsText, setEmailsText] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const { data, error } = await supabase
      .from('discovery_config')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
      return;
    }

    if (data) {
      setConfig({
        ...data,
        auto_approve_threshold: data.auto_approve_threshold ?? 85,
      } as DiscoveryConfigData);
      setQueriesText((data.search_queries || []).join('\n'));
      setEmailsText((data.email_recipients || []).join('\n'));
    }
    setLoading(false);
  }

  async function saveConfig() {
    if (!config) return;

    setSaving(true);
    const queries = queriesText.split('\n').map(q => q.trim()).filter(Boolean);
    const emails = emailsText.split('\n').map(e => e.trim()).filter(Boolean);

    const { error } = await supabase
      .from('discovery_config')
      .update({
        schedule_cron: config.schedule_cron,
        search_queries: queries,
        regions_enabled: config.regions_enabled,
        notifications_enabled: config.notifications_enabled,
        email_recipients: emails,
        daily_digest_enabled: config.daily_digest_enabled,
        alert_on_failure: config.alert_on_failure,
        auto_approve_threshold: config.auto_approve_threshold,
      })
      .eq('id', config.id);

    if (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } else {
      toast.success('Configuration saved');
    }
    setSaving(false);
  }

  function getNextRunTime(cron: string): string {
    // Parse cron to estimate next run
    const parts = cron.split(' ');
    const hour = parseInt(parts[1]) || 2;
    const now = new Date();
    const next = new Date();
    next.setUTCHours(hour, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next.toLocaleString('da-DK', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No configuration found
        </CardContent>
      </Card>
    );
  }

  const scheduleLabel = SCHEDULE_OPTIONS.find(o => o.value === config.schedule_cron)?.label || config.schedule_cron;

  return (
    <div className="space-y-6">
      {/* Auto-Approval Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Auto-Approval
          </CardTitle>
          <CardDescription>
            Automatically approve high-confidence suppliers without manual review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Auto-Approve Threshold</Label>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {config.auto_approve_threshold}%
              </Badge>
            </div>
            <Slider
              value={[config.auto_approve_threshold]}
              onValueChange={([v]) => setConfig({ ...config, auto_approve_threshold: v })}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% (More auto-approvals)</span>
              <span>100% (Disabled)</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Suppliers with confidence ≥ {config.auto_approve_threshold}% will be automatically 
              approved and validated. Set to 100% to disable auto-approval.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule
          </CardTitle>
          <CardDescription>
            Configure when the discovery system runs automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Run Frequency</Label>
              <Select 
                value={config.schedule_cron} 
                onValueChange={(v) => setConfig({ ...config, schedule_cron: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Next run: {getNextRunTime(config.schedule_cron)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Queries Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Queries
          </CardTitle>
          <CardDescription>
            Define the search queries used to discover new suppliers (one per line)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={queriesText}
            onChange={(e) => setQueriesText(e.target.value)}
            placeholder="industrial 3D printing services company&#10;metal additive manufacturing company&#10;..."
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {queriesText.split('\n').filter(q => q.trim()).length} queries configured
          </p>
        </CardContent>
      </Card>

      {/* Regions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regions
          </CardTitle>
          <CardDescription>
            Select which regions to include in the search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {REGION_OPTIONS.map(region => {
              const isEnabled = config.regions_enabled.includes(region);
              return (
                <Badge
                  key={region}
                  variant={isEnabled ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setConfig({
                      ...config,
                      regions_enabled: isEnabled
                        ? config.regions_enabled.filter(r => r !== region)
                        : [...config.regions_enabled, region]
                    });
                  }}
                >
                  {region}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure email notifications for discovery events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails when new suppliers are discovered
              </p>
            </div>
            <Switch
              checked={config.notifications_enabled}
              onCheckedChange={(v) => setConfig({ ...config, notifications_enabled: v })}
            />
          </div>

          {config.notifications_enabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of pending suppliers
                  </p>
                </div>
                <Switch
                  checked={config.daily_digest_enabled}
                  onCheckedChange={(v) => setConfig({ ...config, daily_digest_enabled: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Alert on Failure</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified if a discovery run fails
                  </p>
                </div>
                <Switch
                  checked={config.alert_on_failure}
                  onCheckedChange={(v) => setConfig({ ...config, alert_on_failure: v })}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Recipients
                </Label>
                <Textarea
                  value={emailsText}
                  onChange={(e) => setEmailsText(e.target.value)}
                  placeholder="email1@example.com&#10;email2@example.com"
                  rows={3}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  One email per line
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
