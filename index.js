import { json } from "stream/consumers";
import { getEvents } from "./getEvents.js";
import { writeFileSync } from "fs";
getEvents({
  attractionId: "K8vZ917rUHV",
  size: 110,
}).then((events) =>
  writeFileSync("events.json", JSON.stringify(events, null, 2)),
);
