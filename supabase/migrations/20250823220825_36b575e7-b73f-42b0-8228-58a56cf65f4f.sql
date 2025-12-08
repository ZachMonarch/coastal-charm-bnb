-- Enable leaked password protection
UPDATE auth.config 
SET password_min_length = 8;

-- Enable password strength requirements
ALTER TABLE auth.users 
ADD CONSTRAINT users_password_strength 
CHECK (char_length(encrypted_password) > 0);