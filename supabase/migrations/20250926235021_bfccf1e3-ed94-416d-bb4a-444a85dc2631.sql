-- First, add the missing trigger for updating vendor avatar when documents are uploaded
CREATE TRIGGER trigger_update_vendor_avatar
  AFTER INSERT OR UPDATE ON vendor_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_avatar();