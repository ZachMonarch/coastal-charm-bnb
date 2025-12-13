import { useState } from "react";
import { Bell, Send, Users, User, Mail, Megaphone, AlertCircle, CheckCircle2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";

const NOTIFICATION_TYPES = [
  { id: 'award_notice', label: 'Award Notice', icon: CheckCircle2, description: 'Contract/project award notifications' },
  { id: 'project_update', label: 'Project Update', icon: FileText, description: 'Status updates, milestones' },
  { id: 'payment_request', label: 'Payment Request', icon: AlertCircle, description: 'Payment reminders and requests' },
  { id: 'payment_congratulations', label: 'Payment Congratulations', icon: CheckCircle2, description: 'Successful payment confirmation' },
  { id: 'payout_info_request', label: 'Payout Info Request', icon: Mail, description: 'Request payout details from vendor' },
  { id: 'newsletter', label: 'Newsletter', icon: Megaphone, description: 'Custom newsletter content' },
  { id: 'general', label: 'General Notice', icon: Bell, description: 'Generic notifications' },
];

const RECIPIENT_TYPES = [
  { id: 'individual', label: 'Individual User', icon: User },
  { id: 'all_vendors', label: 'All Vendors', icon: Users },
  { id: 'all_tenants', label: 'All Tenants', icon: Users },
  { id: 'all_property_managers', label: 'All Property Managers', icon: Users },
  { id: 'all_users', label: 'All Users', icon: Users },
];

const DELIVERY_OPTIONS = [
  { id: 'in_app', label: 'In-App Only' },
  { id: 'email', label: 'Email Only' },
  { id: 'both', label: 'Both In-App & Email' },
];

interface NotificationFormData {
  notificationType: string;
  recipientType: string;
  individualUserId: string;
  title: string;
  message: string;
  priority: string;
  deliveryMethod: string;
  actionUrl: string;
}

export default function AdminNotificationCenter() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>({
    notificationType: 'general',
    recipientType: 'individual',
    individualUserId: '',
    title: '',
    message: '',
    priority: 'normal',
    deliveryMethod: 'both',
    actionUrl: '',
  });
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<{ id: string; email: string; full_name: string } | null>(null);

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', `%${searchEmail.trim()}%`)
        .limit(1)
        .single();
      
      if (error || !data) {
        toast.error('User not found');
        setFoundUser(null);
        return;
      }
      
      setFoundUser(data);
      setFormData(prev => ({ ...prev, individualUserId: data.id }));
      toast.success(`Found user: ${data.full_name || data.email}`);
    } catch (error) {
      toast.error('Error searching for user');
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    if (formData.recipientType === 'individual' && !formData.individualUserId) {
      toast.error('Please select a recipient user');
      return;
    }

    setSending(true);
    try {
      // Call edge function to send custom notification
      const { data, error } = await supabase.functions.invoke('send-custom-notification', {
        body: {
          notificationType: formData.notificationType,
          recipientType: formData.recipientType,
          individualUserId: formData.individualUserId,
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          deliveryMethod: formData.deliveryMethod,
          actionUrl: formData.actionUrl,
        }
      });

      if (error) throw error;

      toast.success(`Notification sent successfully! ${data?.sentCount || ''} recipients`);
      
      // Reset form
      setFormData({
        notificationType: 'general',
        recipientType: 'individual',
        individualUserId: '',
        title: '',
        message: '',
        priority: 'normal',
        deliveryMethod: 'both',
        actionUrl: '',
      });
      setFoundUser(null);
      setSearchEmail('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const selectedTypeInfo = NOTIFICATION_TYPES.find(t => t.id === formData.notificationType);

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Admin Notification Center
          </CardTitle>
          <CardDescription>
            Send custom notifications and emails to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="compose" className="space-y-6">
            <TabsList>
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6">
              {/* Notification Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Notification Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {NOTIFICATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.notificationType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, notificationType: type.id }))}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="text-sm font-medium">{type.label}</p>
                      </button>
                    );
                  })}
                </div>
                {selectedTypeInfo && (
                  <p className="text-sm text-muted-foreground">{selectedTypeInfo.description}</p>
                )}
              </div>

              {/* Recipient Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Recipients</Label>
                <Select 
                  value={formData.recipientType} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, recipientType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.recipientType === 'individual' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                      />
                      <Button type="button" variant="outline" onClick={handleSearchUser}>
                        Search
                      </Button>
                    </div>
                    {foundUser && (
                      <Badge variant="secondary" className="gap-2">
                        <User className="h-3 w-3" />
                        {foundUser.full_name || foundUser.email}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Notification title..."
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your notification message..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionUrl">Action URL (optional)</Label>
                  <Input
                    id="actionUrl"
                    placeholder="/dashboard or https://..."
                    value={formData.actionUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                  />
                </div>
              </div>

              {/* Priority & Delivery */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Priority</Label>
                  <RadioGroup
                    value={formData.priority}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="text-muted-foreground">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal">Normal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="text-warning">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="urgent" id="urgent" />
                      <Label htmlFor="urgent" className="text-destructive">Urgent</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Delivery Method</Label>
                  <RadioGroup
                    value={formData.deliveryMethod}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, deliveryMethod: v }))}
                    className="flex gap-4"
                  >
                    {DELIVERY_OPTIONS.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  size="lg" 
                  onClick={handleSendNotification}
                  disabled={sending || !formData.title || !formData.message}
                >
                  {sending ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Project Award', type: 'award_notice', title: 'Congratulations! Project Awarded', message: 'You have been awarded the project. Please review the contract details.' },
                  { name: 'Payment Reminder', type: 'payment_request', title: 'Payment Reminder', message: 'You have a pending payment. Please complete the payment to continue.' },
                  { name: 'Project Update', type: 'project_update', title: 'Project Status Update', message: 'There has been an update to your project. Please check the details.' },
                  { name: 'Welcome Message', type: 'general', title: 'Welcome to Monarch', message: 'Welcome to Monarch Property Management! We are excited to have you on board.' },
                ].map((template) => (
                  <Card 
                    key={template.name} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      notificationType: template.type,
                      title: template.title,
                      message: template.message,
                    }))}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
