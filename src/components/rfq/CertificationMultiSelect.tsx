import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Certification {
  name: string;
  has_certification: boolean;
  file_path?: string;
  expiry_date?: string;
}

interface CertificationOption {
  id: string;
  label: string;
}

interface CertificationMultiSelectProps {
  certifications: Certification[];
  options: CertificationOption[];
  onChange: (certifications: Certification[]) => void;
  onUploadFile: (file: File, certificationId: string) => Promise<string>;
}

export default function CertificationMultiSelect({
  certifications,
  options,
  onChange,
  onUploadFile
}: CertificationMultiSelectProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const toggleCertification = (certId: string) => {
    const updated = certifications.map(cert => 
      cert.name === certId 
        ? { ...cert, has_certification: !cert.has_certification }
        : cert
    );
    onChange(updated);
  };

  const updateExpiryDate = (certId: string, date: string) => {
    const updated = certifications.map(cert =>
      cert.name === certId
        ? { ...cert, expiry_date: date }
        : cert
    );
    onChange(updated);
  };

  const handleFileUpload = async (certId: string, file: File) => {
    setUploading(certId);
    try {
      const filePath = await onUploadFile(file, certId);
      const updated = certifications.map(cert =>
        cert.name === certId
          ? { ...cert, file_path: filePath }
          : cert
      );
      onChange(updated);
      toast.success('Certificate uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload certificate');
    } finally {
      setUploading(null);
    }
  };

  const removeFile = (certId: string) => {
    const updated = certifications.map(cert =>
      cert.name === certId
        ? { ...cert, file_path: undefined }
        : cert
    );
    onChange(updated);
  };

  const getCertification = (certId: string) => 
    certifications.find(c => c.name === certId) || { name: certId, has_certification: false };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select all certifications your company holds. Upload supporting documents for verification.
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const cert = getCertification(option.id);
          
          return (
            <div
              key={option.id}
              className={`p-4 border rounded-lg transition-colors ${
                cert.has_certification ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={option.id}
                  checked={cert.has_certification}
                  onCheckedChange={() => toggleCertification(option.id)}
                />
                <div className="flex-1 space-y-3">
                  <Label 
                    htmlFor={option.id} 
                    className="font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  
                  {cert.has_certification && (
                    <div className="space-y-3 pt-2">
                      {/* Expiry Date */}
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Expiry Date (if applicable)
                        </Label>
                        <Input
                          type="date"
                          value={cert.expiry_date || ''}
                          onChange={(e) => updateExpiryDate(option.id, e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      {/* File Upload */}
                      {cert.file_path ? (
                        <div className="flex items-center justify-between p-2 bg-success/10 rounded border border-success/20">
                          <div className="flex items-center gap-2 text-sm text-success">
                            <FileCheck className="h-4 w-4" />
                            <span>Certificate uploaded</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(option.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Label
                            htmlFor={`file-${option.id}`}
                            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                          >
                            {uploading === option.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            <span className="text-sm">Upload certificate</span>
                          </Label>
                          <input
                            id={`file-${option.id}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(option.id, file);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Summary */}
      <div className="pt-2">
        <p className="text-sm text-muted-foreground">
          Selected: {certifications.filter(c => c.has_certification).length} of {options.length}
        </p>
      </div>
    </div>
  );
}
