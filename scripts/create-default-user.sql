-- Create a default admin user if none exists
INSERT INTO users (id, email, name, password, role, createdAt, updatedAt)
SELECT 
  'default-admin-user',
  'admin@gcs.com',
  'System Admin',
  '$2a$12$LQv3c1yqBwEHxPiNWpYesu.dScDmO.YGLkMVqBVHoFiecBq2o0H6.',  -- password: admin123
  'ADMIN',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gcs.com');

-- Update any orphaned invoices to use the default user
UPDATE invoices 
SET createdBy = 'default-admin-user'
WHERE createdBy IS NOT NULL 
  AND createdBy NOT IN (SELECT id FROM users);
