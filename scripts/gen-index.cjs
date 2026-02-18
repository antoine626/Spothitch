const fs = require("fs")
const path = require("path")
const dir = path.join(__dirname, "..", "public", "data", "spots")
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && f !== "index.json")
let totalLocations = 0
let totalReviews = 0
const countries = []
for (const file of files) {
  const code = path.basename(file, ".json").toUpperCase()
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))
  const spots = data.spots || []
  const reviews = spots.reduce((sum, s) => sum + (s.comments ? s.comments.length : 0), 0)
  totalLocations += spots.length
  totalReviews += reviews
  countries.push({ code, locations: spots.length, reviews })
}
countries.sort((a, b) => b.locations - a.locations)
const index = {
  totalCountries: countries.length,
  totalLocations,
  totalReviews,
  lastUpdated: new Date().toISOString().split("T")[0],
  countries
}
fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index, null, 2))
console.log("Created index.json:", index.totalCountries, "countries,", index.totalLocations, "spots,", index.totalReviews, "reviews")
