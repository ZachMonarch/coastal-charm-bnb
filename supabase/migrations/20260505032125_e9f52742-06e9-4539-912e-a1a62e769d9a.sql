
REVOKE EXECUTE ON FUNCTION public.get_top_vendors(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_vendor_detail(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.compute_bid_score(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_cross_rfq_bids(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.forfeit_emd(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.refund_emd(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_top_vendors(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_vendor_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_bid_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cross_rfq_bids(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.forfeit_emd(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_emd(uuid, text, text) TO authenticated;
