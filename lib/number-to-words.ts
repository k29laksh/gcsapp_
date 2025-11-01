export function numberToWords(num: number): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function convertLessThanOneThousand(n: number): string {
    if (n === 0) return ""

    if (n < 10) return units[n]

    if (n < 20) return teens[n - 10]

    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
    }

    return (
      units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convertLessThanOneThousand(n % 100) : "")
    )
  }

  if (num === 0) return "Zero Rupees Only"

  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)

  let result = ""

  if (rupees > 0) {
    if (rupees < 1000) {
      result = convertLessThanOneThousand(rupees)
    } else if (rupees < 100000) {
      result = convertLessThanOneThousand(Math.floor(rupees / 1000)) + " Thousand"
      if (rupees % 1000 !== 0) {
        result += " " + convertLessThanOneThousand(rupees % 1000)
      }
    } else if (rupees < 10000000) {
      result = convertLessThanOneThousand(Math.floor(rupees / 100000)) + " Lakh"
      if (rupees % 100000 !== 0) {
        result += " " + numberToWords(rupees % 100000)
      }
    } else {
      result = convertLessThanOneThousand(Math.floor(rupees / 10000000)) + " Crore"
      if (rupees % 10000000 !== 0) {
        result += " " + numberToWords(rupees % 10000000)
      }
    }

    result += " Rupees"
  }

  if (paise > 0) {
    result += (rupees > 0 ? " and " : "") + convertLessThanOneThousand(paise) + " Paise"
  }

  return result + " Only"
}
