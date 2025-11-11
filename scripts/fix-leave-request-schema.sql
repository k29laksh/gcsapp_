-- Fix the LeaveRequest table schema to use proper foreign key relationship

-- First, let's check if the table exists and its current structure
DO $$
BEGIN
    -- Drop the existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LeaveRequest_employeeId_fkey' 
        AND table_name = 'LeaveRequest'
    ) THEN
        ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_employeeId_fkey";
    END IF;

    -- Drop the existing foreign key constraint for leaveTypeId if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LeaveRequest_leaveTypeId_fkey' 
        AND table_name = 'LeaveRequest'
    ) THEN
        ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_leaveTypeId_fkey";
    END IF;

    -- Make sure employeeId column exists and is properly typed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LeaveRequest' AND column_name = 'employeeId'
    ) THEN
        ALTER TABLE "LeaveRequest" ADD COLUMN "employeeId" TEXT;
    END IF;

    -- Remove leaveTypeId column if it exists (we'll use leaveType as string)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LeaveRequest' AND column_name = 'leaveTypeId'
    ) THEN
        ALTER TABLE "LeaveRequest" DROP COLUMN "leaveTypeId";
    END IF;

    -- Make sure leaveType column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LeaveRequest' AND column_name = 'leaveType'
    ) THEN
        ALTER TABLE "LeaveRequest" ADD COLUMN "leaveType" TEXT NOT NULL DEFAULT 'ANNUAL';
    END IF;

    -- Add other required columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LeaveRequest' AND column_name = 'contactDetails'
    ) THEN
        ALTER TABLE "LeaveRequest" ADD COLUMN "contactDetails" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LeaveRequest' AND column_name = 'emergencyContact'
    ) THEN
        ALTER TABLE "LeaveRequest" ADD COLUMN "emergencyContact" TEXT;
    END IF;

    -- Add the foreign key constraint back
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" 
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

END $$;
