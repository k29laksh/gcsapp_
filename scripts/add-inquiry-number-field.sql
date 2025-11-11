-- Add inquiryNumber field to Inquiry table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Inquiry' AND column_name = 'inquiryNumber'
    ) THEN
        ALTER TABLE "Inquiry" ADD COLUMN "inquiryNumber" TEXT;
        
        -- Create unique index on inquiryNumber
        CREATE UNIQUE INDEX IF NOT EXISTS "Inquiry_inquiryNumber_key" ON "Inquiry"("inquiryNumber");
        
        -- Update existing inquiries with generated numbers
        WITH numbered_inquiries AS (
            SELECT id, 
                   'INQ' || TO_CHAR(EXTRACT(YEAR FROM "createdAt"), 'FM00') || 
                   LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::TEXT, 4, '0') as generated_number
            FROM "Inquiry" 
            WHERE "inquiryNumber" IS NULL
        )
        UPDATE "Inquiry" 
        SET "inquiryNumber" = numbered_inquiries.generated_number
        FROM numbered_inquiries 
        WHERE "Inquiry".id = numbered_inquiries.id;
        
        -- Make inquiryNumber NOT NULL after updating existing records
        ALTER TABLE "Inquiry" ALTER COLUMN "inquiryNumber" SET NOT NULL;
    END IF;
END $$;
