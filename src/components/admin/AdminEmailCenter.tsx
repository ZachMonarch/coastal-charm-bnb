import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, FileText, History, Users } from 'lucide-react';
import SentEmailsTable from './SentEmailsTable';
import EmailComposeForm from './EmailComposeForm';
import VendorInvitesHistory from './VendorInvitesHistory';
import EmailTemplateManager from './EmailTemplateManager';

export default function AdminEmailCenter() {
  const [activeTab, setActiveTab] = useState('sent');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Center
          </h2>
          <p className="text-muted-foreground">
            Manage all email communications, templates, and vendor invitations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList variant="default" className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger variant="default" value="sent" className="gap-2">
            <History className="h-4 w-4" />
            Sent Emails
          </TabsTrigger>
          <TabsTrigger variant="default" value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger variant="default" value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger variant="default" value="invites" className="gap-2">
            <Users className="h-4 w-4" />
            Vendor Invites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent">
          <SentEmailsTable />
        </TabsContent>

        <TabsContent value="compose">
          <EmailComposeForm onEmailSent={() => setActiveTab('sent')} />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplateManager />
        </TabsContent>

        <TabsContent value="invites">
          <VendorInvitesHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
