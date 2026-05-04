import { User, Mail, Settings, Sun, Moon, Coffee, Utensils, BriefcaseBusiness } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { motion } from "motion/react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrCreateProfile } from "../lib/profile";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


interface DayPreferences {
  enabled: boolean;
  wakeTime: number; // in hours (0-23)
  sleepTime: number;
  workStart: number;
  workEnd: number;
  lunchStart: number;
  lunchEnd: number;
  breakPreference: boolean;
}

const defaultPreferences: DayPreferences = {
  enabled: true,
  wakeTime: 7,
  sleepTime: 23,
  workStart: 9,
  workEnd: 17,
  lunchStart: 12,
  lunchEnd: 13,
  breakPreference: true,
};

export function Profile() {
  //logout handling
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [dayPreferences, setDayPreferences] = useState<Record<string, DayPreferences>>(
    Object.fromEntries(daysOfWeek.map((day) => [day, { ...defaultPreferences }]))
  );

  //profile states
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    timezone: "",
  });

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

      //temp test
        console.log("PROFILE FROM SUPABASE:", profileData);

        setProfile(profileData);

        setForm({
          display_name: profileData?.display_name || "",
          email: user.email || "",
          timezone: "",
        });

        setLoading(false);
    };

    load();
  }, []);

  const currentDayPref = dayPreferences[selectedDay];

  const updateDayPreference = (key: keyof DayPreferences, value: any) => {
    setDayPreferences({
      ...dayPreferences,
      [selectedDay]: {
        ...currentDayPref,
        [key]: value,
      },
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  const getTimeBlocks = () => {
    const blocks = [];

    // Wake to Work Start
    if (currentDayPref.wakeTime < currentDayPref.workStart) {
      blocks.push({
        type: "morning",
        start: currentDayPref.wakeTime,
        end: currentDayPref.workStart,
        label: "Morning Routine",
        color: "bg-yellow-400",
      });
    }

    // Work (before lunch)
    if (currentDayPref.workStart < currentDayPref.lunchStart) {
      blocks.push({
        type: "work",
        start: currentDayPref.workStart,
        end: currentDayPref.lunchStart,
        label: "Work",
        color: "bg-blue-500",
      });
    }

    // Lunch
    blocks.push({
      type: "lunch",
      start: currentDayPref.lunchStart,
      end: currentDayPref.lunchEnd,
      label: "Lunch",
      color: "bg-orange-400",
    });

    // Work (after lunch)
    if (currentDayPref.lunchEnd < currentDayPref.workEnd) {
      blocks.push({
        type: "work",
        start: currentDayPref.lunchEnd,
        end: currentDayPref.workEnd,
        label: "Work",
        color: "bg-blue-500",
      });
    }

    // Evening (work end to sleep)
    if (currentDayPref.workEnd < currentDayPref.sleepTime) {
      blocks.push({
        type: "evening",
        start: currentDayPref.workEnd,
        end: currentDayPref.sleepTime,
        label: "Personal Time",
        color: "bg-purple-400",
      });
    }

    return blocks;
  };

  const timeBlocks = getTimeBlocks();

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Profile & Preferences</h1>
          <p className="text-muted-foreground">
            Customize your schedule and let AI adapt to your lifestyle
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
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
                  {profile?.email || "No email found"}
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
                    onChange={(e) =>
                      setForm({ ...form, timezone: e.target.value })
                    }
                    className="mt-2 bg-input-background"
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90"
                  onClick={async () => {
                    if (!profile?.id) return;

                    await supabase
                      .from("profiles")
                      .update({
                        display_name: form.display_name,
                      })
                      .eq("id", profile.id);

                    const updated = await getOrCreateProfile(profile);
                    setProfile(updated);
                  }}
                >
                  Save Changes
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

          {/* Schedule Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Schedule Preferences</h2>
                  <p className="text-sm text-muted-foreground">
                    Set your ideal schedule for each day of the week
                  </p>
                </div>
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Day Tabs */}
              <Tabs value={selectedDay} onValueChange={setSelectedDay}>
                <TabsList className="w-full grid grid-cols-7 mb-6">
                  {daysOfWeek.map((day) => (
                    <TabsTrigger key={day} value={day} className="text-xs">
                      {day.slice(0, 3)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {daysOfWeek.map((day) => (
                  <TabsContent key={day} value={day} className="space-y-6">
                    {/* Day Enable/Disable */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
                      <div className="flex items-center gap-3">
                        <BriefcaseBusiness className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Working Day</p>
                          <p className="text-xs text-muted-foreground">
                            Enable scheduling for this day
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={currentDayPref.enabled}
                        onCheckedChange={(checked) => updateDayPreference("enabled", checked)}
                      />
                    </div>

                    {currentDayPref.enabled && (
                      <>
                        {/* Visual Timeline */}
                        <div className="p-4 rounded-xl bg-accent/30">
                          <h3 className="text-sm font-semibold mb-4">Daily Timeline</h3>
                          <div className="relative h-16 bg-background rounded-lg overflow-hidden">
                            {timeBlocks.map((block, index) => {
                              const startPercent = (block.start / 24) * 100;
                              const widthPercent = ((block.end - block.start) / 24) * 100;

                              return (
                                <motion.div
                                  key={index}
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`absolute h-full ${block.color} flex items-center justify-center text-white text-xs font-medium transition-all hover:brightness-110`}
                                  style={{
                                    left: `${startPercent}%`,
                                    width: `${widthPercent}%`,
                                  }}
                                  title={`${block.label}: ${formatHour(block.start)} - ${formatHour(block.end)}`}
                                >
                                  {widthPercent > 8 && block.label}
                                </motion.div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>12 AM</span>
                            <span>6 AM</span>
                            <span>12 PM</span>
                            <span>6 PM</span>
                            <span>11 PM</span>
                          </div>
                        </div>

                        {/* Time Sliders */}
                        <div className="space-y-6">
                          {/* Wake Time */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <Label className="text-sm">Wake Time</Label>
                              </div>
                              <span className="text-sm font-medium">{formatHour(currentDayPref.wakeTime)}</span>
                            </div>
                            <Slider
                              value={[currentDayPref.wakeTime]}
                              onValueChange={([value]) => updateDayPreference("wakeTime", value)}
                              min={0}
                              max={23}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          {/* Work Hours */}
                          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-4">
                              <BriefcaseBusiness className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-semibold">Work Hours</span>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm">Start</Label>
                                  <span className="text-sm font-medium">{formatHour(currentDayPref.workStart)}</span>
                                </div>
                                <Slider
                                  value={[currentDayPref.workStart]}
                                  onValueChange={([value]) => updateDayPreference("workStart", value)}
                                  min={0}
                                  max={23}
                                  step={1}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm">End</Label>
                                  <span className="text-sm font-medium">{formatHour(currentDayPref.workEnd)}</span>
                                </div>
                                <Slider
                                  value={[currentDayPref.workEnd]}
                                  onValueChange={([value]) => updateDayPreference("workEnd", value)}
                                  min={0}
                                  max={23}
                                  step={1}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Lunch Break */}
                          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center gap-2 mb-4">
                              <Utensils className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              <span className="text-sm font-semibold">Lunch Break</span>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm">Start</Label>
                                  <span className="text-sm font-medium">{formatHour(currentDayPref.lunchStart)}</span>
                                </div>
                                <Slider
                                  value={[currentDayPref.lunchStart]}
                                  onValueChange={([value]) => updateDayPreference("lunchStart", value)}
                                  min={0}
                                  max={23}
                                  step={0.5}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm">End</Label>
                                  <span className="text-sm font-medium">{formatHour(currentDayPref.lunchEnd)}</span>
                                </div>
                                <Slider
                                  value={[currentDayPref.lunchEnd]}
                                  onValueChange={([value]) => updateDayPreference("lunchEnd", value)}
                                  min={0}
                                  max={23}
                                  step={0.5}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Sleep Time */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <Label className="text-sm">Sleep Time</Label>
                              </div>
                              <span className="text-sm font-medium">{formatHour(currentDayPref.sleepTime)}</span>
                            </div>
                            <Slider
                              value={[currentDayPref.sleepTime]}
                              onValueChange={([value]) => updateDayPreference("sleepTime", value)}
                              min={0}
                              max={23}
                              step={1}
                            />
                          </div>

                          {/* Break Preference */}
                          <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
                            <div className="flex items-center gap-3">
                              <Coffee className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Regular Breaks</p>
                                <p className="text-xs text-muted-foreground">
                                  Add 5-10 min breaks between tasks
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={currentDayPref.breakPreference}
                              onCheckedChange={(checked) => updateDayPreference("breakPreference", checked)}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              <div className="mt-6 pt-6 border-t border-border">
                <Button className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90">
                  Save Preferences
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}