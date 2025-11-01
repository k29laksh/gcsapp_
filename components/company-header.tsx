interface CompanyHeaderProps {
  className?: string
}

export function CompanyHeader({ className }: CompanyHeaderProps) {
  return (
    <div className={`text-center border-b-2 border-gray-800 pb-4 mb-6 ${className || ""}`}>
      <div className="text-xl font-bold mb-2">GLOBAL CONSULTANCY SERVICES</div>
      <div className="text-lg font-semibold mb-2">MARINE & OFFSHORE</div>
      <div className="border-t border-b border-gray-600 py-2 my-2">
        <div className="text-sm">016, Loha Bhavan 93, Loha Bhavan, P D'Mello Road, Carnac Bunder,</div>
        <div className="text-sm">Masjid (East), Mumbai, Maharashtra, India. Pincode - 400 009</div>
      </div>
      <div className="text-sm space-y-1">
        <div>Email: admin@globalconsultancyservices.net, globalconsultancyservices@gmail.com</div>
        <div>Web: www.globalconsultancyservices.net | Tel: +919869990250</div>
        <div>MSME Reg. No.: UDYAM-MH-19-0015824</div>
      </div>
      <div className="mt-3 text-xs">
        <div className="font-semibold">ISO 9001:2015 Certified by IRQS</div>
        <div>Ship Design | Marine & Offshore Consultant | Marine Fire Protection Systems & Solutions</div>
      </div>
    </div>
  )
}
