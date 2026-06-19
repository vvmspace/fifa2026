import { getEvents } from "./getEvents.js";
import { writeFileSync } from "fs";

getEvents({
  attractionId: "K8vZ917rUHV",
  size: 110,
})
  .then((events) => {
    const allEvents = events._embedded.events;
    const now = new Date();

    const upcomingEvents = allEvents
      .filter(
        (event) =>
          event.dates?.start?.dateTime &&
          new Date(event.dates.start.dateTime) > now,
      )
      .sort(
        (a, b) =>
          new Date(a.dates.start.dateTime) - new Date(b.dates.start.dateTime),
      );

    const arg = process.argv[2];
    if (arg && arg.endsWith(".md")) {
      const textList = upcomingEvents
        .map((event) => {
          const dateObj = new Date(event.dates.start.dateTime);
          const dateStr = dateObj.toLocaleDateString("en-GB");
          const timeStr = dateObj.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const timezone = event.dates?.timezone || "UTC";
          const venue = event._embedded?.venues?.[0];
          const venueName = venue?.name || "Unknown Venue";
          const country = venue?.country?.name || "Unknown Country";

          return `## ${event.name}
- ${dateStr} ${timeStr} (${timezone})
- ${venueName}, ${country}
- ${event.url}`;
        })
        .join("\n\n");

      console.log(textList || "No upcoming events found.");
      writeFileSync(arg, textList);
    } else {
      writeFileSync("events.json", JSON.stringify(events, null, 2));
    }
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
