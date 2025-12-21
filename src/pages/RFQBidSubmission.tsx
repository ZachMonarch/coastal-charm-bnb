import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, DollarSign, Award, Briefcase, FileUp, FileCheck, Loader2, Save, Send } from 'lucide-react';
import { useRFQDetail } from '@/hooks/useRFQDetail';
import { useBidSubmission, BidFormData } from '@/hooks/useBidSubmission';
import BidFormSection from '@/components/rfq/BidFormSection';
import CertificationMultiSelect from '@/components/rfq/CertificationMultiSelect';
import ReferenceEditor from '@/components/rfq/ReferenceEditor';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

export default function RFQBidSubmission() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rfq, isLoading: rfqLoading } = useRFQDetail(id);
  const { 
    existingBid, loadingBid, submitBid, isSubmitting, 
    uploadCertification, getInitialFormData, CERTIFICATION_OPTIONS 
  } = useBidSubmission(id);

  const [formData, setFormData] = useState<BidFormData | null>(null);

  useEffect(() => {
    if (!loadingBid) {
      setFormData(getInitialFormData());
    }
  }, [loadingBid, existingBid]);

  if (rfqLoading || loadingBid || !formData) return <LoadingSpinner />;
  if (!rfq) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold mb-2">RFQ Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const updateCompanyInfo = (field: keyof BidFormData['company_info'], value: string | number) => {
    setFormData(prev => prev ? { ...prev, company_info: { ...prev.company_info, [field]: value } } : prev);
  };

  const updatePricing = (field: keyof BidFormData['pricing'], value: number) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newPricing = { ...prev.pricing, [field]: value };
      if (field === 'equipment_cost' || field === 'installation_cost') {
        newPricing.total_installation = newPricing.equipment_cost + newPricing.installation_cost;
      }
      return { ...prev, pricing: newPricing };
    });
  };

  const handleSubmit = (status: 'draft' | 'submitted') => {
    if (!formData) return;
    if (status === 'submitted' && !formData.terms_accepted) {
      toast.error('Please accept the terms to submit your bid');
      return;
    }
    submitBid({ formData, status }, {
      onSuccess: () => {
        if (status === 'submitted') navigate(`/vendor/rfq/${id}`);
      }
    });
  };

  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(`/vendor/rfq/${id}`)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to RFQ Details
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Submit Bid</h1>
          <p className="text-muted-foreground">{rfq.title}</p>
        </div>

        <div className="space-y-6">
          {/* Section A: Company Information */}
          <BidFormSection title="Company Information" sectionId="company" icon={<Building2 className="h-5 w-5" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input value={formData.company_info.company_name} onChange={e => updateCompanyInfo('company_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact Name *</Label>
                <Input value={formData.company_info.contact_name} onChange={e => updateCompanyInfo('contact_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.company_info.contact_email} onChange={e => updateCompanyInfo('contact_email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input type="tel" value={formData.company_info.contact_phone} onChange={e => updateCompanyInfo('contact_phone', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input value={formData.company_info.address} onChange={e => updateCompanyInfo('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.company_info.city} onChange={e => updateCompanyInfo('city', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={formData.company_info.state} onChange={e => updateCompanyInfo('state', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input value={formData.company_info.zip_code} onChange={e => updateCompanyInfo('zip_code', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>License Number *</Label>
                <Input value={formData.company_info.license_number} onChange={e => updateCompanyInfo('license_number', e.target.value)} />
              </div>
            </div>
          </BidFormSection>

          {/* Section B: Pricing */}
          <BidFormSection title="Pricing" sectionId="pricing" icon={<DollarSign className="h-5 w-5" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Equipment Cost ($) *</Label>
                <Input type="number" value={formData.pricing.equipment_cost || ''} onChange={e => updatePricing('equipment_cost', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Installation/Labor Cost ($) *</Label>
                <Input type="number" value={formData.pricing.installation_cost || ''} onChange={e => updatePricing('installation_cost', Number(e.target.value))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Total Installation Cost</Label>
                <Input type="text" value={`$${formData.pricing.total_installation.toLocaleString()}`} readOnly className="bg-muted font-semibold text-lg" />
              </div>
              <div className="space-y-2">
                <Label>Annual Maintenance ($)</Label>
                <Input type="number" value={formData.pricing.annual_maintenance || ''} onChange={e => updatePricing('annual_maintenance', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Warranty (Years)</Label>
                <Select value={String(formData.pricing.warranty_years)} onValueChange={v => updatePricing('warranty_years', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(y => <SelectItem key={y} value={String(y)}>{y} Year{y > 1 ? 's' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </BidFormSection>

          {/* Section C: Certifications */}
          <BidFormSection title="Certifications & Qualifications" sectionId="certifications" icon={<Award className="h-5 w-5" />}>
            <CertificationMultiSelect
              certifications={formData.certifications}
              options={CERTIFICATION_OPTIONS}
              onChange={certs => setFormData(prev => prev ? { ...prev, certifications: certs } : prev)}
              onUploadFile={uploadCertification}
            />
          </BidFormSection>

          {/* Section D: Experience */}
          <BidFormSection title="Experience & References" sectionId="experience" icon={<Briefcase className="h-5 w-5" />}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Experience Summary *</Label>
                <Textarea
                  value={formData.experience.summary}
                  onChange={e => setFormData(prev => prev ? { ...prev, experience: { ...prev.experience, summary: e.target.value } } : prev)}
                  placeholder="Describe your company's relevant experience..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Proposed Timeline *</Label>
                <Input
                  value={formData.experience.proposed_timeline}
                  onChange={e => setFormData(prev => prev ? { ...prev, experience: { ...prev.experience, proposed_timeline: e.target.value } } : prev)}
                  placeholder="e.g., 8-10 months"
                />
              </div>
              <ReferenceEditor
                references={formData.experience.references}
                onChange={refs => setFormData(prev => prev ? { ...prev, experience: { ...prev.experience, references: refs } } : prev)}
              />
            </div>
          </BidFormSection>

          {/* Section F: Terms */}
          <BidFormSection title="Terms & Submission" sectionId="terms" icon={<FileCheck className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="terms"
                  checked={formData.terms_accepted}
                  onCheckedChange={checked => setFormData(prev => prev ? { ...prev, terms_accepted: !!checked } : prev)}
                />
                <Label htmlFor="terms" className="cursor-pointer leading-relaxed">
                  I acknowledge that I have read and understood the RFQ requirements, and confirm that all information provided is accurate. I agree to the terms and conditions of this bid submission.
                </Label>
              </div>
            </div>
          </BidFormSection>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4">
            <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit('submitted')} disabled={isSubmitting || !formData.terms_accepted}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Submit Bid
            </Button>
          </div>
        </div>
      </div>
    </OptimizedProtectedRoute>
  );
}
