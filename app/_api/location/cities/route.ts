import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get("state")

  if (!state) {
    return NextResponse.json({ error: "State code is required" }, { status: 400 })
  }

  let cities = []

  // Return cities based on state code
  if (state === "MH") {
    cities = [
      "Mumbai",
      "Pune",
      "Nagpur",
      "Thane",
      "Nashik",
      "Aurangabad",
      "Solapur",
      "Kolhapur",
      "Amravati",
      "Navi Mumbai",
    ]
  } else if (state === "DL") {
    cities = ["New Delhi", "Delhi", "Noida", "Gurgaon", "Faridabad", "Ghaziabad"]
  } else if (state === "KA") {
    cities = [
      "Bangalore",
      "Mysore",
      "Hubli",
      "Mangalore",
      "Belgaum",
      "Gulbarga",
      "Davanagere",
      "Bellary",
      "Bijapur",
      "Shimoga",
    ]
  } else if (state === "TN") {
    cities = [
      "Chennai",
      "Coimbatore",
      "Madurai",
      "Tiruchirappalli",
      "Salem",
      "Tirunelveli",
      "Tiruppur",
      "Vellore",
      "Erode",
      "Thoothukudi",
    ]
  } else if (state === "GJ") {
    cities = [
      "Ahmedabad",
      "Surat",
      "Vadodara",
      "Rajkot",
      "Bhavnagar",
      "Jamnagar",
      "Junagadh",
      "Gandhinagar",
      "Anand",
      "Navsari",
    ]
  } else if (state === "CA") {
    cities = [
      "Los Angeles",
      "San Francisco",
      "San Diego",
      "Sacramento",
      "San Jose",
      "Fresno",
      "Oakland",
      "Bakersfield",
      "Anaheim",
      "Santa Ana",
    ]
  } else if (state === "NY") {
    cities = [
      "New York City",
      "Buffalo",
      "Rochester",
      "Yonkers",
      "Syracuse",
      "Albany",
      "New Rochelle",
      "Mount Vernon",
      "Schenectady",
      "Utica",
    ]
  } else if (state === "TX") {
    cities = [
      "Houston",
      "San Antonio",
      "Dallas",
      "Austin",
      "Fort Worth",
      "El Paso",
      "Arlington",
      "Corpus Christi",
      "Plano",
      "Laredo",
    ]
  } else {
    // Default to empty array for other states
    cities = []
  }

  return NextResponse.json(cities)
}
