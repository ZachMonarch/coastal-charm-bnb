#!/bin/bash
# Critical Script: Replace SELECT * with explicit column selections
# Phase 7 Requirement: Prevent excessive database egress

echo "🔍 Finding all SELECT * queries..."

# Find all files with SELECT * 
FILES=$(grep -rl "\.select('\*')" src --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v "stories")

TOTAL=$(echo "$FILES" | wc -l)
echo "📊 Found $TOTAL files with SELECT * queries"
echo ""

# Common table column mappings (add more as needed)
declare -A TABLE_COLUMNS=(
  ["audit_logs"]="id, user_id, action, table_name, record_id, created_at"
  ["system_health"]="id, service_name, status, response_time_ms, checked_at"
  ["rate_limits"]="id, identifier, endpoint, requests_count, window_start"
  ["notifications"]="id, user_id, title, message, type, read, created_at"
  ["projects"]="id, title, status, category, priority, budget_min, budget_max, created_at, assigned_vendor_id"
  ["properties"]="id, title, address, city, state, price, bedrooms, bathrooms, property_type, status, image_urls"
  ["vendor_profiles"]="id, vendor_id, business_name, trade_specialty, service_areas, rating_score, verified"
  ["vendor_payments"]="id, vendor_id, project_id, amount, status, payment_date, created_at"
  ["invoices"]="id, invoice_number, amount, status, due_date, client_name, created_at"
  ["contracts"]="id, title, contract_number, status, contract_value, start_date, end_date, vendor_id"
  ["bookings"]="id, property_id, user_id, check_in_date, check_out_date, guests, total_amount, status"
)

echo "⚠️  MANUAL REVIEW REQUIRED:"
echo "This script identifies SELECT * queries but cannot automatically fix them all."
echo "Each table requires specific column selection based on the component's needs."
echo ""
echo "📋 Files requiring manual fixes:"
echo "================================"

for FILE in $FILES; do
  echo ""
  echo "📄 $FILE"
  
  # Show the context of SELECT * usage
  grep -n "\.select('\*')" "$FILE" | while read -r line; do
    LINE_NUM=$(echo "$line" | cut -d: -f1)
    echo "   Line $LINE_NUM: $(echo "$line" | cut -d: -f2-)"
    
    # Try to identify the table
    TABLE=$(sed -n "${LINE_NUM}p" "$FILE" | grep -oP "from\(['\"](\w+)['\"]" | grep -oP "'\w+'" | tr -d "'")
    
    if [ -n "$TABLE" ] && [ -n "${TABLE_COLUMNS[$TABLE]}" ]; then
      echo "   💡 Suggested columns for '$TABLE':"
      echo "      ${TABLE_COLUMNS[$TABLE]}"
    fi
  done
done

echo ""
echo "================================"
echo "✅ Review complete. Total files: $TOTAL"
echo ""
echo "📝 Next Steps:"
echo "1. Review each file listed above"
echo "2. Replace .select('*') with explicit columns"
echo "3. Test that components still function correctly"
echo "4. Verify egress reduction in Supabase dashboard"
echo ""
echo "💡 Pro tip: Use this pattern:"
echo "   .select('id, name, status') // Only what you need"
echo "   .select('*') // ❌ NEVER use this"
