-- Check for orphaned task records with invalid phase references
SELECT 
    t.id as task_id,
    t.title,
    t.phaseId,
    t.projectId,
    p.name as project_name
FROM "Task" t
LEFT JOIN "ProjectPhase" pp ON t.phaseId = pp.id
LEFT JOIN "Project" p ON t.projectId = p.id
WHERE t.phaseId IS NOT NULL 
  AND pp.id IS NULL;

-- Check for orphaned task records with invalid project references
SELECT 
    t.id as task_id,
    t.title,
    t.projectId
FROM "Task" t
LEFT JOIN "Project" p ON t.projectId = p.id
WHERE p.id IS NULL;

-- Check for orphaned task records with invalid assignee references
SELECT 
    t.id as task_id,
    t.title,
    t.assignedToId
FROM "Task" t
LEFT JOIN "Employee" e ON t.assignedToId = e.id
WHERE t.assignedToId IS NOT NULL 
  AND e.id IS NULL;

-- Fix orphaned phase references by setting them to NULL
UPDATE "Task" 
SET phaseId = NULL 
WHERE phaseId IS NOT NULL 
  AND phaseId NOT IN (SELECT id FROM "ProjectPhase");

-- Fix orphaned assignee references by setting them to NULL
UPDATE "Task" 
SET assignedToId = NULL 
WHERE assignedToId IS NOT NULL 
  AND assignedToId NOT IN (SELECT id FROM "Employee");

-- Show summary of fixes applied
SELECT 
    'Tasks with fixed phase references' as fix_type,
    COUNT(*) as count
FROM "Task" 
WHERE phaseId IS NULL;
