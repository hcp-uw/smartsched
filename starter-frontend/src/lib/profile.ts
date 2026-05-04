import { supabase } from "../supabaseClient";

export async function getOrCreateProfile(user) {
  if (!user) return null;

  // 1. try fetch existing profile
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data;

  // 2. if missing → create it
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: user.email?.split("@")[0] || "User",
      profile_picture_url: null,
    })
    .select()
    .single();

  if (insertError) {
    console.error(insertError);
    return null;
  }

  return newProfile;
}