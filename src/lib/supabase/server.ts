import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function createPureClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iwvaqqnocanahbgbeihj.supabase.co";
  // Try anon key first since service role key seems to have issues
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dmFxcW5vY2FuYWhiZ2JlaWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDk3OTIsImV4cCI6MjA2ODI4NTc5Mn0.0PrmPEhoCV952gPLBractx6Ys_l6YT-1qSAJX5DSGeE";
  
  console.log("Supabase URL:", supabaseUrl);
  console.log("Anon Key length:", anonKey ? anonKey.length : 0);
  
  return createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
