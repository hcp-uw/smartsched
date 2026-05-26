import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { motion } from "motion/react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrCreateProfile } from "../lib/profile";
import { toast } from "sonner";

export function Profile() {
  //logout handling
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  //profile states
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    timezone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const profileData = await getOrCreateProfile(user);

        setProfile(profileData);

        setForm({
          display_name: profileData?.display_name || "",
          email: user.email || "",
          timezone:
            profileData?.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }
  const handleSaveChanges = async () => {
    if (!profile?.id) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name,
        timezone: form.timezone,
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      setSaving(false);
      toast.error("Could not save profile details.");
      return;
    }

    setSaving(false);

    const updated = await getOrCreateProfile(profile);
    setProfile(updated);
    toast.success("Profile preferences saved.");
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account details
          </p>
        </div>

        <div className="flex justify-center">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex flex-col items-center mb-6">
                {/* Profile Picture */}
                <div className="w-24 h-24 rounded-full mb-4 shadow-xl overflow-hidden bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] flex items-center justify-center">
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-semibold">
                      {profile?.display_name?.slice(0, 2).toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-xl font-semibold">
                  {profile?.display_name || "Loading..."}
                </h2>

                {/* Email */}
                <p className="text-sm text-muted-foreground">
                  {form.email || "No email found"}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Full Name</Label>
                  <Input
                    id="name"
                    value={form.display_name}
                    onChange={(e) =>
                      setForm({ ...form, display_name: e.target.value })
                    }
                    className="mt-2 bg-input-background"
                  />
                </div>
                <div>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    disabled
                    className="mt-2 bg-input-background"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone" className="text-sm">Timezone</Label>
                  <Input
                    id="timezone"
                    value={form.timezone}
                    disabled
                    className="mt-2 bg-input-background"
                  />

                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Log Out
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
