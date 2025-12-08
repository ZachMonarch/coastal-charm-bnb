#!/bin/bash

###############################################################################
# MONARCH PERFORMANCE VALIDATION SCRIPT
# 
# Runs Lighthouse audits on key pages and validates Core Web Vitals
# 
# Usage:
#   ./scripts/performance-validation.sh [environment]
#   
# Environments:
#   - local (default): http://localhost:5173
#   - preview: Vercel preview URL
#   - production: https://monarchpropertymmgt.com
#
# Requirements:
#   - Node.js 18+
#   - Lighthouse CLI: npm install -g @lhci/cli lighthouse
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment configuration
ENV=${1:-local}

case $ENV in
  local)
    BASE_URL="http://localhost:5173"
    ;;
  preview)
    if [ -z "$VERCEL_PREVIEW_URL" ]; then
      echo -e "${RED}Error: VERCEL_PREVIEW_URL environment variable not set${NC}"
      exit 1
    fi
    BASE_URL="https://$VERCEL_PREVIEW_URL"
    ;;
  production)
    BASE_URL="https://monarchpropertymmgt.com"
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENV${NC}"
    echo "Valid options: local, preview, production"
    exit 1
    ;;
esac

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Monarch Performance Validation${NC}"
echo -e "${BLUE}Environment: ${GREEN}$ENV${NC}"
echo -e "${BLUE}Base URL: ${GREEN}$BASE_URL${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# Create reports directory
REPORT_DIR="./lighthouse-reports/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"

# Pages to audit
PAGES=(
  "/"
  "/dashboard"
  "/vendor/dashboard"
  "/gallery"
  "/contact"
)

# Target scores
TARGET_PERFORMANCE=90
TARGET_ACCESSIBILITY=100
TARGET_BEST_PRACTICES=100
TARGET_SEO=90

# Track results
TOTAL_PAGES=${#PAGES[@]}
PASSED=0
FAILED=0

echo -e "${BLUE}Running Lighthouse audits on $TOTAL_PAGES pages...${NC}\n"

# Function to run Lighthouse
run_lighthouse() {
  local page=$1
  local url="${BASE_URL}${page}"
  local safe_name=$(echo "$page" | sed 's/\//_/g' | sed 's/^_//')
  safe_name="${safe_name:-home}"
  local output_file="${REPORT_DIR}/${safe_name}.json"
  local html_file="${REPORT_DIR}/${safe_name}.html"
  
  echo -e "${YELLOW}Auditing: $url${NC}"
  
  # Run Lighthouse
  lighthouse "$url" \
    --output=json \
    --output=html \
    --output-path="${REPORT_DIR}/${safe_name}" \
    --chrome-flags="--headless" \
    --quiet \
    --only-categories=performance,accessibility,best-practices,seo \
    2>&1 | grep -v "Chrome is being controlled"
  
  # Parse results
  local perf_score=$(jq -r '.categories.performance.score * 100' "${output_file}" 2>/dev/null)
  local a11y_score=$(jq -r '.categories.accessibility.score * 100' "${output_file}" 2>/dev/null)
  local bp_score=$(jq -r '.categories["best-practices"].score * 100' "${output_file}" 2>/dev/null)
  local seo_score=$(jq -r '.categories.seo.score * 100' "${output_file}" 2>/dev/null)
  
  # Core Web Vitals
  local fcp=$(jq -r '.audits["first-contentful-paint"].numericValue' "${output_file}" 2>/dev/null)
  local lcp=$(jq -r '.audits["largest-contentful-paint"].numericValue' "${output_file}" 2>/dev/null)
  local cls=$(jq -r '.audits["cumulative-layout-shift"].numericValue' "${output_file}" 2>/dev/null)
  local tbt=$(jq -r '.audits["total-blocking-time"].numericValue' "${output_file}" 2>/dev/null)
  
  # Display results
  echo -e "  Performance:    ${GREEN}${perf_score}${NC}"
  echo -e "  Accessibility:  ${GREEN}${a11y_score}${NC}"
  echo -e "  Best Practices: ${GREEN}${bp_score}${NC}"
  echo -e "  SEO:            ${GREEN}${seo_score}${NC}"
  echo -e "  FCP:            $(echo "$fcp/1000" | bc -l | xargs printf "%.2f")s"
  echo -e "  LCP:            $(echo "$lcp/1000" | bc -l | xargs printf "%.2f")s"
  echo -e "  CLS:            $(printf "%.3f" "$cls")"
  echo -e "  TBT:            ${tbt}ms"
  
  # Check if scores meet targets
  local all_pass=true
  if (( $(echo "$perf_score < $TARGET_PERFORMANCE" | bc -l) )); then
    echo -e "  ${RED}❌ Performance score below target ($TARGET_PERFORMANCE)${NC}"
    all_pass=false
  fi
  if (( $(echo "$a11y_score < $TARGET_ACCESSIBILITY" | bc -l) )); then
    echo -e "  ${RED}❌ Accessibility score below target ($TARGET_ACCESSIBILITY)${NC}"
    all_pass=false
  fi
  if (( $(echo "$bp_score < $TARGET_BEST_PRACTICES" | bc -l) )); then
    echo -e "  ${RED}❌ Best Practices score below target ($TARGET_BEST_PRACTICES)${NC}"
    all_pass=false
  fi
  if (( $(echo "$seo_score < $TARGET_SEO" | bc -l) )); then
    echo -e "  ${RED}❌ SEO score below target ($TARGET_SEO)${NC}"
    all_pass=false
  fi
  
  if [ "$all_pass" = true ]; then
    echo -e "  ${GREEN}✅ All scores meet targets${NC}"
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
  fi
  
  echo -e "  Report: ${BLUE}${html_file}${NC}\n"
}

# Run audits for each page
for page in "${PAGES[@]}"; do
  run_lighthouse "$page"
done

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Total Pages:  $TOTAL_PAGES"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"
echo -e "Reports Dir:  ${BLUE}$REPORT_DIR${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✅ All performance validations passed!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Some validations failed. Review reports for details.${NC}"
  exit 1
fi
