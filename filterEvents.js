import { readFileSync } from "fs";
const events = JSON.parse(readFileSync("./events.json", "utf8"));

const keyword = process.argv[2] || "Argentina";
const now = new Date();

const filtered = events._embedded.events
  .filter((event) => JSON.stringify(event).includes(keyword))
  .filter((event) => {
    const eventDate = new Date(event.dates.start.dateTime);
    return eventDate > now;
  })
  .sort((a, b) => {
    return new Date(a.dates.start.dateTime) - new Date(b.dates.start.dateTime);
  });

console.log(`\nUpcoming events for "${keyword}":`);
console.log("=".repeat(50));

if (filtered.length === 0) {
  console.log("No upcoming events found.");
} else {
  filtered.forEach((event, index) => {
    const date = new Date(event.dates.start.dateTime).toLocaleString();
    console.log(`${index + 1}. ${event.name}`);
    console.log(`   Date: ${date}`);
    console.log(`   URL:  ${event.url}`);
    console.log("-".repeat(50));
  });
}
console.log(`\nTotal found: ${filtered.length}\n`);
