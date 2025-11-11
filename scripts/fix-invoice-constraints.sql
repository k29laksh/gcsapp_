-- Check if there are any invoices with invalid createdBy references
SELECT i.id, i.invoiceNumber, i.createdBy, u.id as user_exists
FROM invoices i
LEFT JOIN users u ON i.createdBy = u.id
WHERE i.createdBy IS NOT NULL AND u.id IS NULL;

-- Check if there are any invoices with invalid customer references
SELECT i.id, i.invoiceNumber, i.customerId, c.id as customer_exists
FROM invoices i
LEFT JOIN customers c ON i.customerId = c.id
WHERE c.id IS NULL;

-- Check if there are any invoices with invalid project references
SELECT i.id, i.invoiceNumber, i.projectId, p.id as project_exists
FROM invoices i
LEFT JOIN projects p ON i.projectId = p.id
WHERE i.projectId IS NOT NULL AND p.id IS NULL;

-- Get current user IDs to verify session user exists
SELECT id, email, name FROM users;
