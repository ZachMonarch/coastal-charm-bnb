import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageSquare, RefreshCw, Send, Inbox, Mail, MailOpen, Plus, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import PageHero from '@/components/shared/PageHero';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  parent_message_id: string | null;
  created_at: string;
}

export default function VendorMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', content: '' });
  const [replyContent, setReplyContent] = useState('');

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['vendor-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, subject, content, is_read, parent_message_id, created_at')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id
  });

  // Get admin users to send messages to
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);
      
      if (error) throw error;
      return data?.map(r => r.user_id) || [];
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-messages'] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ subject, content, parentId }: { subject: string; content: string; parentId?: string }) => {
      if (adminUsers.length === 0) {
        throw new Error('No admin available to receive messages');
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: adminUsers[0],
          subject,
          content,
          parent_message_id: parentId || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Message sent successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-messages'] });
      setIsComposeDialogOpen(false);
      setIsReplyDialogOpen(false);
      setNewMessage({ subject: '', content: '' });
      setReplyContent('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === user?.id) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleSendNewMessage = () => {
    if (!newMessage.subject.trim() || !newMessage.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    sendMessageMutation.mutate(newMessage);
  };

  const handleReply = () => {
    if (!replyContent.trim() || !selectedMessage) {
      toast.error('Please enter a reply message');
      return;
    }
    sendMessageMutation.mutate({
      subject: `Re: ${selectedMessage.subject}`,
      content: replyContent,
      parentId: selectedMessage.id
    });
  };

  const receivedMessages = messages.filter(m => m.recipient_id === user?.id);
  const sentMessages = messages.filter(m => m.sender_id === user?.id);
  const unreadCount = receivedMessages.filter(m => !m.is_read).length;

  if (isLoading) {
    return (
      <PrivatePageWrapper title="Messages">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="Messages">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <PageHero
          title="Messages"
          description="Communicate with property managers and admin"
          icon={MessageSquare}
          variant="gradient"
        />

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-primary" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive">{unreadCount} new</Badge>
                  )}
                </CardTitle>
                <CardDescription>Your messages with administrators</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Message to Admin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={newMessage.subject}
                          onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                          placeholder="Enter message subject"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Message</Label>
                        <Textarea
                          id="content"
                          value={newMessage.content}
                          onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                          placeholder="Type your message here..."
                          rows={6}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsComposeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendNewMessage} disabled={sendMessageMutation.isPending}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Messages List */}
              <Card className="border">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    All Messages ({messages.length})
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="h-[500px]">
                  <CardContent className="p-0">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Send a message to admin to get started
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {messages.map((message) => {
                          const isSent = message.sender_id === user?.id;
                          return (
                            <button
                              key={message.id}
                              onClick={() => handleViewMessage(message)}
                              className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                                selectedMessage?.id === message.id ? 'bg-muted/50' : ''
                              } ${!message.is_read && !isSent ? 'bg-primary/5' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${
                                  isSent ? 'bg-success/20' : (!message.is_read ? 'bg-primary/20' : 'bg-muted')
                                }`}>
                                  {isSent ? (
                                    <Send className="h-4 w-4 text-success" />
                                  ) : message.is_read ? (
                                    <MailOpen className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Mail className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium truncate">
                                      {isSent ? 'To: Admin' : 'From: Admin'}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className={`text-sm truncate ${!message.is_read && !isSent ? 'font-medium' : ''}`}>
                                    {message.subject}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {message.content.substring(0, 80)}...
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
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
                            {selectedMessage.sender_id === user?.id ? 'To: Admin' : 'From: Admin'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedMessage.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {selectedMessage.sender_id === user?.id ? 'Sent' : 'Received'}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">{selectedMessage.subject}</h3>
                      </div>

                      <div className="p-4 bg-muted/20 rounded-lg min-h-[200px]">
                        <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>

                      {selectedMessage.sender_id !== user?.id && (
                        <Button onClick={() => setIsReplyDialogOpen(true)} className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                      )}
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
                <p className="font-medium">Re: {selectedMessage?.subject}</p>
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
              <Button onClick={handleReply} disabled={sendMessageMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PrivatePageWrapper>
  );
}
