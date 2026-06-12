import axios from "axios";
import { configDotenv } from "dotenv";
configDotenv();

export const getEvents = async (
  query = {
    keyword: "World Cup 2026",
  },
) => {
  const apiKey = process.env.TICKETMASTER_CONSUMER_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing TICKETMASTER_CONSUMER_KEY in environment variables",
    );
  }

  try {
    const response = await axios.get(
      "https://app.ticketmaster.com/discovery/v2/events.json",
      {
        params: {
          apikey: apiKey,
          ...query,
        },
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`[Ticketmaster API Error]: ${errorMessage}`);
    throw new Error(`Failed to fetch events: ${errorMessage}`);
  }
};
