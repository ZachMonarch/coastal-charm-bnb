#!/bin/bash

# Script to update all AuthContext imports to OptimizedAuthContext
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/@\/contexts\/AuthContext/@\/contexts\/OptimizedAuthContext/g'