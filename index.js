import { getEvents } from "./getEvents.js";
import { writeFileSync } from "fs";

getEvents({
  attractionId: "K8vZ917rUHV",
  size: 110,
})
  .then((events) => {
    const allEvents = events._embedded.events;
    const now = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 14);

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

    const recentPastEvents = allEvents
      .filter(
        (event) => {
          if (!event.dates?.start?.dateTime) return false;
          const startDate = new Date(event.dates.start.dateTime);
          return startDate <= now && startDate > twoWeeksAgo;
        },
      )
      .sort(
        (a, b) =>
          new Date(b.dates.start.dateTime) - new Date(a.dates.start.dateTime),
      );

    const arg = process.argv[2];
    if (arg && arg.endsWith(".md")) {
      const formatEvent = (event) => {
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
        return `## ${event.name}\n- ${dateStr} ${timeStr} (${timezone})\n- ${venueName}, ${country}\n- ${event.url}`;
      };

      let finalOutput = "";
      if (upcomingEvents.length > 0) {
        finalOutput += "# UPCOMING\n\n" + upcomingEvents.map(formatEvent).join("\n\n") + "\n\n";
      }
      if (recentPastEvents.length > 0) {
        finalOutput += "# RECENTLY PASSED\n\n" + recentPastEvents.map(formatEvent).join("\n\n");
      }

      console.log(finalOutput || "No relevant events found.");
      writeFileSync(arg, finalOutput);
    } else {
      writeFileSync("events.json", JSON.stringify(events, null, 2));
    }
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
