import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { CreateContactInput, ContactType } from '@/hooks/useVendorContacts';

interface ParsedContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  contact_type: ContactType;
  notes: string;
  source: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

interface BulkContactImportProps {
  existingEmails: string[];
  onImport: (contacts: CreateContactInput[]) => Promise<void>;
}

export default function BulkContactImport({ existingEmails, onImport }: BulkContactImportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\d\s\-+()]{7,20}$/;
    return phoneRegex.test(phone);
  };

  const parseContactType = (value: string): ContactType => {
    const normalized = value?.toLowerCase().trim();
    if (['lead', 'contact', 'partner', 'customer'].includes(normalized)) {
      return normalized as ContactType;
    }
    return 'contact';
  };

  const parseCSV = (content: string): ParsedContact[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      toast.error('CSV must have a header row and at least one data row');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const requiredHeaders = ['name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
      return [];
    }

    const contacts: ParsedContact[] = [];
    const seenEmails = new Set<string>(existingEmails.map(e => e.toLowerCase()));

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const contact: ParsedContact = {
        name: '',
        email: '',
        phone: '',
        company: '',
        contact_type: 'contact',
        notes: '',
        source: 'CSV Import',
        isValid: true,
        isDuplicate: false,
        errors: [],
      };

      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
        switch (header) {
          case 'name':
            contact.name = value;
            break;
          case 'email':
            contact.email = value;
            break;
          case 'phone':
            contact.phone = value;
            break;
          case 'company':
            contact.company = value;
            break;
          case 'type':
          case 'contact_type':
            contact.contact_type = parseContactType(value);
            break;
          case 'notes':
            contact.notes = value;
            break;
          case 'source':
            contact.source = value || 'CSV Import';
            break;
        }
      });

      // Validation
      if (!contact.name) {
        contact.errors.push('Name is required');
        contact.isValid = false;
      }

      if (contact.email && !validateEmail(contact.email)) {
        contact.errors.push('Invalid email format');
        contact.isValid = false;
      }

      if (contact.phone && !validatePhone(contact.phone)) {
        contact.errors.push('Invalid phone format');
        contact.isValid = false;
      }

      // Duplicate detection
      if (contact.email) {
        const emailLower = contact.email.toLowerCase();
        if (seenEmails.has(emailLower)) {
          contact.isDuplicate = true;
          contact.errors.push('Duplicate email');
        } else {
          seenEmails.add(emailLower);
        }
      }

      contacts.push(contact);
    }

    return contacts;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setParsedContacts(parsed);
      setShowDialog(true);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    const validContacts = parsedContacts.filter(c => c.isValid && !c.isDuplicate);
    if (validContacts.length === 0) {
      toast.error('No valid contacts to import');
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const contactsToImport: CreateContactInput[] = validContacts.map(c => ({
        contact_type: c.contact_type,
        name: c.name,
        email: c.email || undefined,
        phone: c.phone || undefined,
        company: c.company || undefined,
        notes: c.notes || undefined,
        source: c.source || 'CSV Import',
        status: 'active',
      }));

      // Import in batches for progress
      const batchSize = 10;
      for (let i = 0; i < contactsToImport.length; i += batchSize) {
        const batch = contactsToImport.slice(i, i + batchSize);
        await onImport(batch);
        setProgress(Math.min(100, ((i + batchSize) / contactsToImport.length) * 100));
      }

      toast.success(`Successfully imported ${validContacts.length} contacts`);
      setShowDialog(false);
      setParsedContacts([]);
    } catch (error: unknown) {
      console.error('Import error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || 'Failed to import contacts');
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,phone,company,type,notes,source\n"John Doe","john@example.com","555-123-4567","ABC Corp","lead","Met at conference","Trade Show 2024"\n"Jane Smith","jane@example.com","555-987-6543","XYZ Inc","customer","Repeat customer","Referral"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedContacts.filter(c => c.isValid && !c.isDuplicate).length;
  const invalidCount = parsedContacts.filter(c => !c.isValid).length;
  const duplicateCount = parsedContacts.filter(c => c.isDuplicate).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Contacts
          </CardTitle>
          <CardDescription>
            Upload a CSV file to import multiple contacts at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
              aria-label="Upload CSV file for bulk contact import"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              aria-describedby="csv-upload-description"
            >
              <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
              Upload CSV
            </Button>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Download Template
            </Button>
          </div>
          <p id="csv-upload-description" className="text-sm text-muted-foreground">
            CSV must include a <code className="bg-muted px-1 rounded">name</code> column. 
            Optional: <code className="bg-muted px-1 rounded">email</code>, <code className="bg-muted px-1 rounded">phone</code>, <code className="bg-muted px-1 rounded">company</code>, <code className="bg-muted px-1 rounded">type</code>, <code className="bg-muted px-1 rounded">notes</code>, <code className="bg-muted px-1 rounded">source</code>
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Review Import</DialogTitle>
            <DialogDescription>
              Review the parsed contacts before importing. Invalid or duplicate entries will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 py-4" role="status" aria-live="polite">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              <span className="text-sm">{validCount} valid</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
              <span className="text-sm">{invalidCount} invalid</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
              <span className="text-sm">{duplicateCount} duplicates</span>
            </div>
          </div>

          {importing && (
            <div className="space-y-2" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
              <Progress value={progress} aria-label="Import progress" />
              <p className="text-sm text-muted-foreground text-center">Importing contacts... {Math.round(progress)}%</p>
            </div>
          )}

          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedContacts.map((contact, index) => (
                  <TableRow key={index} className={!contact.isValid || contact.isDuplicate ? 'bg-muted/50' : ''}>
                    <TableCell>
                      {contact.isValid && !contact.isDuplicate ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : contact.isDuplicate ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{contact.name || '-'}</TableCell>
                    <TableCell>{contact.email || '-'}</TableCell>
                    <TableCell>{contact.phone || '-'}</TableCell>
                    <TableCell>{contact.company || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.contact_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {contact.errors.length > 0 && (
                        <span className="text-sm text-destructive">{contact.errors.join(', ')}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              {importing ? 'Importing...' : `Import ${validCount} Contacts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
