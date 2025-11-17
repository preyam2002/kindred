/**
 * Test script to check MAL API response structure and see if ratings are included
 * Run with: npx tsx scripts/test-mal-rating.ts
 *
 * Make sure MYANIMELIST_CLIENT_ID is set in your environment or .env.local
 */

// Try to load .env.local or .env if they exist
import { readFileSync } from "fs";
import { join } from "path";
import { existsSync } from "fs";

function loadEnvFile(filename: string) {
  const filePath = join(process.cwd(), filename);
  if (existsSync(filePath)) {
    try {
      const envFile = readFileSync(filePath, "utf-8");
      envFile.split("\n").forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    } catch (e) {
      // File exists but can't be read, that's okay
    }
  }
}

// Load .env.local first, then .env (so .env.local takes precedence)
loadEnvFile(".env.local");
loadEnvFile(".env");

const MAL_API_URL = "https://api.myanimelist.net/v2";
const MAL_CLIENT_ID = process.env.MYANIMELIST_CLIENT_ID || "";

async function testMALRating() {
  const username = "preyam"; // Change this to your MAL username

  if (!MAL_CLIENT_ID) {
    console.error("❌ MYANIMELIST_CLIENT_ID environment variable is not set");
    process.exit(1);
  }

  console.log(`\n🔍 Testing MAL API response for username: ${username}\n`);
  console.log(`Using CLIENT_ID: ${MAL_CLIENT_ID.substring(0, 10)}...\n`);

  try {
    const fields =
      "id,title,main_picture,mean,genres,media_type,num_episodes,status,my_list_status{score,status,updated_at}";
    const url = `${MAL_API_URL}/users/${username}/animelist?fields=${fields}&limit=10&offset=0`;

    console.log(`📡 Making request to: ${url}\n`);

    const response = await fetch(url, {
      headers: {
        "X-MAL-CLIENT-ID": MAL_CLIENT_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const animeData = await response.json();

    console.log("📊 Response Structure:");
    console.log(JSON.stringify(animeData, null, 2));

    if (animeData.data && animeData.data.length > 0) {
      console.log(`\n✅ Found ${animeData.data.length} anime items\n`);

      // Show first few items with their list_status details
      animeData.data.slice(0, 5).forEach((item: any, index: number) => {
        console.log(`\n--- Item ${index + 1} ---`);
        console.log(`Title: ${item.node?.title}`);
        console.log(`ID: ${item.node?.id}`);
        console.log(
          `List Status Object:`,
          JSON.stringify(item.list_status, null, 2)
        );
        console.log(`Has score?: ${item.list_status?.score !== undefined}`);
        console.log(`Score value: ${item.list_status?.score}`);
        console.log(`Score > 0?: ${item.list_status?.score > 0}`);
        console.log(`Status: ${item.list_status?.status}`);
        console.log(`Updated at: ${item.list_status?.updated_at}`);
      });

      // Count how many have ratings
      const withRatings = animeData.data.filter(
        (item: any) => item.list_status?.score && item.list_status.score > 0
      );
      console.log(`\n📈 Summary:`);
      console.log(`Total items: ${animeData.data.length}`);
      console.log(`Items with ratings (score > 0): ${withRatings.length}`);
      console.log(
        `Items without ratings: ${animeData.data.length - withRatings.length}`
      );

      if (withRatings.length === 0) {
        console.log(`\n⚠️  WARNING: No ratings found!`);
        console.log(`This could mean:`);
        console.log(`1. The user hasn't rated any anime`);
        console.log(
          `2. Ratings require OAuth authentication (not just CLIENT_ID)`
        );
        console.log(
          `3. The score field is not included in my_list_status for public lists`
        );
      }
    } else {
      console.log("❌ No anime data found");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

testMALRating();
