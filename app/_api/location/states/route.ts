import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get("country")

  if (!country) {
    return NextResponse.json({ error: "Country code is required" }, { status: 400 })
  }

  let states = []

  // Return states based on country code
  if (country === "IN") {
    states = [
      { code: "MH", name: "Maharashtra" },
      { code: "DL", name: "Delhi" },
      { code: "KA", name: "Karnataka" },
      { code: "TN", name: "Tamil Nadu" },
      { code: "GJ", name: "Gujarat" },
      { code: "UP", name: "Uttar Pradesh" },
      { code: "WB", name: "West Bengal" },
      { code: "TG", name: "Telangana" },
      { code: "RJ", name: "Rajasthan" },
      { code: "MP", name: "Madhya Pradesh" },
      { code: "AP", name: "Andhra Pradesh" },
      { code: "PB", name: "Punjab" },
      { code: "HR", name: "Haryana" },
      { code: "JH", name: "Jharkhand" },
      { code: "OR", name: "Odisha" },
      { code: "KL", name: "Kerala" },
      { code: "AS", name: "Assam" },
      { code: "CT", name: "Chhattisgarh" },
      { code: "BR", name: "Bihar" },
    ]
  } else if (country === "US") {
    states = [
      { code: "AL", name: "Alabama" },
      { code: "AK", name: "Alaska" },
      { code: "AZ", name: "Arizona" },
      { code: "AR", name: "Arkansas" },
      { code: "CA", name: "California" },
      { code: "CO", name: "Colorado" },
      { code: "CT", name: "Connecticut" },
      { code: "DE", name: "Delaware" },
      { code: "FL", name: "Florida" },
      { code: "GA", name: "Georgia" },
      { code: "HI", name: "Hawaii" },
      { code: "ID", name: "Idaho" },
      { code: "IL", name: "Illinois" },
      { code: "IN", name: "Indiana" },
      { code: "IA", name: "Iowa" },
      { code: "KS", name: "Kansas" },
      { code: "KY", name: "Kentucky" },
      { code: "LA", name: "Louisiana" },
      { code: "ME", name: "Maine" },
      { code: "MD", name: "Maryland" },
      { code: "MA", name: "Massachusetts" },
      { code: "MI", name: "Michigan" },
      { code: "MN", name: "Minnesota" },
      { code: "MS", name: "Mississippi" },
      { code: "MO", name: "Missouri" },
      { code: "MT", name: "Montana" },
      { code: "NE", name: "Nebraska" },
      { code: "NV", name: "Nevada" },
      { code: "NH", name: "New Hampshire" },
      { code: "NJ", name: "New Jersey" },
      { code: "NM", name: "New Mexico" },
      { code: "NY", name: "New York" },
      { code: "NC", name: "North Carolina" },
      { code: "ND", name: "North Dakota" },
      { code: "OH", name: "Ohio" },
      { code: "OK", name: "Oklahoma" },
      { code: "OR", name: "Oregon" },
      { code: "PA", name: "Pennsylvania" },
      { code: "RI", name: "Rhode Island" },
      { code: "SC", name: "South Carolina" },
      { code: "SD", name: "South Dakota" },
      { code: "TN", name: "Tennessee" },
      { code: "TX", name: "Texas" },
      { code: "UT", name: "Utah" },
      { code: "VT", name: "Vermont" },
      { code: "VA", name: "Virginia" },
      { code: "WA", name: "Washington" },
      { code: "WV", name: "West Virginia" },
      { code: "WI", name: "Wisconsin" },
      { code: "WY", name: "Wyoming" },
    ]
  } else {
    // Default to empty array for other countries
    states = []
  }

  return NextResponse.json(states)
}
