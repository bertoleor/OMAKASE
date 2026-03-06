import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
  const fileContent = fs.readFileSync(envPath, "utf-8");
  fileContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      envConfig[key.trim()] = value.trim().replaceAll(/^["']|["']$/g, "");
    }
  });
}

const SUPABASE_URL = envConfig["NEXT_PUBLIC_SUPABASE_URL"];
const SUPABASE_KEY = envConfig["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const RESEND_KEY = envConfig["RESEND_API_KEY"];

async function main() {
  console.log("🔍 Verifying Connections (Standalone)...\n");

  // 1. Verify Environment Variables
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Supabase variables missing in .env.local");
    process.exit(1);
  } else {
    console.log("✅ Supabase Credentials found");
  }

  if (RESEND_KEY) {
    console.log("✅ Resend API Key found");
  } else {
    console.error("❌ Resend API Key missing in .env.local");
    process.exit(1);
  }

  // 2. Verify Supabase Connection
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from("restaurant_settings").select("*").limit(1);

    if (error) {
      console.error("❌ Supabase Connection Failed:", error.message);
    } else {
      console.log("✅ Supabase Connection Successful (Read 'restaurant_settings')");
      console.log("   Sample data:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Supabase Connection Error:", error);
  }

  // 3. Verify Resend Configuration (Client Init)
  try {
    const resend = new Resend(RESEND_KEY);
    if (resend) {
        console.log("✅ Resend Client Initialized");
    }
  } catch (error) {
    console.error("❌ Resend Initialization Error:", error);
  }
}

await main();
