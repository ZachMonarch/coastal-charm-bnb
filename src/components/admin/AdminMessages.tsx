import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageSquare, RefreshCw, Search, Send, Inbox, Mail, MailOpen, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  parent_message_id: string | null;
  created_at: string;
  sender_profile?: {
    full_name: string | null;
    email: string;
    role: string | null;
  };
}

export default function AdminMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, sender_id, recipient_id, subject, content, is_read, parent_message_id, created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;

      // Fetch sender profiles separately
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('id', senderIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));

        return (data || []).map(m => ({
          ...m,
          sender_profile: profileMap.get(m.sender_id) || null
        })) as Message[];
      }

      return data as Message[];
    }
  });

  const filteredMessages = messages.filter(msg =>
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.sender_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.sender_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ recipientId, subject, content, parentId }: {
      recipientId: string;
      subject: string;
      content: string;
      parentId?: string;
    }) => {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientId,
          subject,
          content,
          parent_message_id: parentId || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reply sent successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      setIsReplyDialogOpen(false);
      setReplyContent('');
      setSelectedMessage(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reply');
    }
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleReply = () => {
    if (!selectedMessage || !replyContent.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    sendReplyMutation.mutate({
      recipientId: selectedMessage.sender_id,
      subject: `Re: ${selectedMessage.subject}`,
      content: replyContent,
      parentId: selectedMessage.id
    });
  };

  const unreadCount = messages.filter(m => !m.is_read && m.recipient_id === user?.id).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Message Center
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
                )}
              </CardTitle>
              <CardDescription>View and respond to messages from vendors and users</CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Messages List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Messages List */}
            <Card className="border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  All Messages ({filteredMessages.length})
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[500px]">
                <CardContent className="p-0">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No messages found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMessages.map((message) => (
                        <button
                          key={message.id}
                          onClick={() => handleViewMessage(message)}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                            selectedMessage?.id === message.id ? 'bg-muted/50' : ''
                          } ${!message.is_read ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${!message.is_read ? 'bg-primary/20' : 'bg-muted'}`}>
                              {message.is_read ? (
                                <MailOpen className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Mail className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium truncate ${!message.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {message.sender_profile?.full_name || message.sender_profile?.email || 'Unknown'}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className={`text-sm truncate ${!message.is_read ? 'font-medium' : ''}`}>
                                {message.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {message.content.substring(0, 100)}...
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>

            {/* Message Detail */}
            <Card className="border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Message Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {selectedMessage.sender_profile?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedMessage.sender_profile?.email}
                        </p>
                        {selectedMessage.sender_profile?.role && (
                          <Badge variant="outline" className="mt-1 text-xs capitalize">
                            {selectedMessage.sender_profile.role.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">{selectedMessage.subject}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 bg-muted/20 rounded-lg min-h-[200px]">
                      <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                    </div>

                    <Button onClick={() => setIsReplyDialogOpen(true)} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a message to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Replying to:</p>
              <p className="font-medium">{selectedMessage?.sender_profile?.full_name || selectedMessage?.sender_profile?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">Re: {selectedMessage?.subject}</p>
            </div>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={sendReplyMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
