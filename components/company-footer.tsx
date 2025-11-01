interface CompanyFooterProps {
  className?: string
}

export function CompanyFooter({ className }: CompanyFooterProps) {
  return (
    <div className={`border-t-2 border-gray-800 pt-4 mt-6 text-sm ${className || ""}`}>
      <div className="mb-4">
        <div className="font-semibold mb-2">
          Payment Terms: Interest @ 21% Per annum will be charged if not paid within 30 days
        </div>
        <div className="text-xs">or specifically agreed in Contract.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="space-y-1">
            <div>
              <span className="font-semibold">GST No.:</span> 27AINPA9487A1Z4
            </div>
            <div>
              <span className="font-semibold">HSN/SAC:</span> 998391
            </div>
            <div>
              <span className="font-semibold">PAN No.:</span> AINPA9487A
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="font-semibold">Bank: ICICI BANK LTD.</div>
            <div>
              <span className="font-semibold">Branch & IFSC:</span> VIKHROLI (EAST) & ICIC0001249
            </div>
            <div>
              <span className="font-semibold">Account No.:</span> 124905500046
            </div>
            <div>
              <span className="font-semibold">Account Name:</span> GLOBAL CONSULTANCY SERVICES
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-semibold">For, GLOBAL CONSULTANCY SERVICES</div>
          <div className="mt-8">
            <div className="border-t border-gray-400 pt-2 inline-block">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  )
}
