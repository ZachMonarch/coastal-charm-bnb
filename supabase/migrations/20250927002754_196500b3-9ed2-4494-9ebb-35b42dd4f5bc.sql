-- Drop the existing faulty constraint
ALTER TABLE vendor_documents DROP CONSTRAINT IF EXISTS vendor_documents_document_type_check;

-- Update existing data to standardize document types
UPDATE vendor_documents SET document_type = 'certification' WHERE document_type = 'certificate';
UPDATE vendor_documents SET document_type = 'business_license' WHERE document_type = 'license';
UPDATE vendor_documents SET document_type = 'insurance_certificate' WHERE document_type = 'insurance';

-- Create comprehensive constraint with all supported document types
ALTER TABLE vendor_documents 
ADD CONSTRAINT vendor_documents_document_type_check 
CHECK (document_type IN (
  'business_license', 
  'insurance_certificate', 
  'certification', 
  'portfolio', 
  'logo', 
  'profile_image',
  'contract', 
  'invoice', 
  'receipt', 
  'tax_document',
  'identity_document',
  'business_document',
  'other'
));

-- Create the avatar update function
CREATE OR REPLACE FUNCTION public.update_vendor_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_type IN ('logo', 'profile_image') THEN
    UPDATE vendor_profiles 
    SET 
      avatar_url = NEW.file_url,
      public_avatar_url = NEW.file_url,
      updated_at = now()
    WHERE user_id = NEW.vendor_id;
    
    UPDATE profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE id = NEW.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_vendor_avatar ON vendor_documents;
CREATE TRIGGER trigger_update_vendor_avatar
  AFTER INSERT OR UPDATE ON vendor_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_avatar();