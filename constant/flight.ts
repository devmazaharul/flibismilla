// constant/data.ts

export const flightResults = [
  {
    id: 1,
    airline: "Emirates",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg",
    flightNumber: "EK-585",
    fromCode: "DAC",
    fromCity: "Dhaka",
    toCode: "JFK",
    toCity: "New York",
    departureTime: "10:00 AM",
    arrivalTime: "04:00 PM",
    duration: "20h 30m",
    price: 1250,
    stops: 1,
    stopInfo: "Via Dubai (DXB) • 2h 15m Layover",
    legs: [
      { from: "DAC", to: "DXB", duration: "5h 30m", airline: "Emirates" },
      { from: "DXB", to: "JFK", duration: "14h 00m", airline: "Emirates" }
    ]
  },
  {
    id: 2,
    airline: "Qatar Airways",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Qatar_Airways_Logo.png", // Use valid URL
    flightNumber: "QR-640",
    fromCode: "DAC",
    fromCity: "Dhaka",
    toCode: "JFK",
    toCity: "New York",
    departureTime: "08:00 PM",
    arrivalTime: "02:00 PM", // Next day
    duration: "22h 00m",
    price: 1180,
    stops: 1,
    stopInfo: "Via Doha (DOH) • 3h 00m Layover",
    legs: [
        { from: "DAC", to: "DOH", duration: "6h 00m", airline: "Qatar Airways" },
        { from: "DOH", to: "JFK", duration: "13h 00m", airline: "Qatar Airways" }
      ]
  },
  {
    id: 3,
    airline: "Biman Bangladesh",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e7/Biman_Bangladesh_Airlines_logo.svg/1200px-Biman_Bangladesh_Airlines_logo.svg.png",
    flightNumber: "BG-301",
    fromCode: "DAC",
    fromCity: "Dhaka",
    toCode: "LHR",
    toCity: "London",
    departureTime: "11:30 AM",
    arrivalTime: "05:00 PM",
    duration: "11h 30m",
    price: 950,
    stops: 0, // Direct Flight
    stopInfo: "Non-stop",
    legs: []
  },
  {
    id: 4,
    airline: "Turkish Airlines",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Turkish_Airlines_logo_2019_compact.svg/2560px-Turkish_Airlines_logo_2019_compact.svg.png",
    flightNumber: "TK-713",
    fromCode: "DAC",
    fromCity: "Dhaka",
    toCode: "YYZ",
    toCity: "Toronto",
    departureTime: "06:00 AM",
    arrivalTime: "09:00 PM",
    duration: "26h 15m",
    price: 1450,
    stops: 2,
    stopInfo: "2 Stops (IST, LHR)",
    legs: [
        { from: "DAC", to: "IST", duration: "9h 00m", airline: "Turkish" },
        { from: "IST", to: "LHR", duration: "4h 00m", airline: "Turkish" },
        { from: "LHR", to: "YYZ", duration: "8h 00m", airline: "Air Canada" }
      ]
  }
];