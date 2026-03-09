import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  UserPlus, Users, TrendingUp, Calendar, Award, 
  ArrowRight, Heart, CheckCircle2, MapPin, Church,
  BarChart3, ClipboardList
} from "lucide-react";

interface Stats {
  totalFirstTimers: number;
  totalMembers: number;
  retained: number;
  followedUp: number;
  retentionRate: number;
}

interface TopLeader {
  full_name: string;
  count: number;
}

interface RecentFirstTimer {
  full_name: string;
  date_of_first_visit: string;
  location: string | null;
}

interface LocationCluster {
  location: string;
  count: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats>({
    totalFirstTimers: 0,
    totalMembers: 0,
    retained: 0,
    followedUp: 0,
    retentionRate: 0,
  });
  const [topLeaders, setTopLeaders] = useState<TopLeader[]>([]);
  const [recentFirstTimers, setRecentFirstTimers] = useState<RecentFirstTimer[]>([]);
  const [locations, setLocations] = useState<LocationCluster[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchPublicStats() {
      try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const dateStr = oneMonthAgo.toISOString().split("T")[0];

        // Fetch counts in parallel
        const [firstTimersRes, allMembersRes, retainedRes, followedUpRes, recentRes, membersWithLocation] = await Promise.all([
          supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "First Timer").gte("date_of_first_visit", dateStr),
          supabase.from("members").select("id", { count: "exact", head: true }),
          supabase.from("members").select("id", { count: "exact", head: true }).in("status", ["Member", "Worker"]),
          supabase.from("follow_up_tasks").select("id", { count: "exact", head: true }).eq("completed", true),
          supabase.from("members").select("full_name, date_of_first_visit, location").eq("status", "First Timer").order("date_of_first_visit", { ascending: false }).limit(5),
          supabase.from("members").select("location").not("location", "is", null),
        ]);

        const totalFT = firstTimersRes.count || 0;
        const totalAll = allMembersRes.count || 0;
        const retained = retainedRes.count || 0;
        const followedUp = followedUpRes.count || 0;
        const retentionRate = totalAll > 0 ? Math.round((retained / totalAll) * 100) : 0;

        setStats({ totalFirstTimers: totalFT, totalMembers: totalAll, retained, followedUp, retentionRate });
        setRecentFirstTimers(recentRes.data || []);

        // Aggregate locations
        if (membersWithLocation.data) {
          const locMap: Record<string, number> = {};
          membersWithLocation.data.forEach((m) => {
            const loc = (m.location || "").trim();
            if (loc) locMap[loc] = (locMap[loc] || 0) + 1;
          });
          const sorted = Object.entries(locMap)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
          setLocations(sorted);
        }

        // Top leaders - get profiles that are assigned as follow-up leaders
        const { data: leaderData } = await supabase
          .from("members")
          .select("assigned_follow_up_leader")
          .not("assigned_follow_up_leader", "is", null);

        if (leaderData) {
          const leaderCount: Record<string, number> = {};
          leaderData.forEach((m) => {
            const lid = m.assigned_follow_up_leader!;
            leaderCount[lid] = (leaderCount[lid] || 0) + 1;
          });
          const topIds = Object.entries(leaderCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          if (topIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", topIds.map(([id]) => id));

            if (profiles) {
              const nameMap: Record<string, string> = {};
              profiles.forEach((p) => (nameMap[p.id] = p.full_name));
              setTopLeaders(
                topIds.map(([id, count]) => ({ full_name: nameMap[id] || "Unknown", count }))
              );
            }
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoaded(true);
      }
    }
    fetchPublicStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="gradient-primary p-2 rounded-xl">
                <Church className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-foreground">Benin Zone 1</span>
                <span className="hidden sm:block text-xs text-muted-foreground">Church Retention & Follow-up</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="gradient-primary border-0 text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.03]" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              Benin Zone One Church Retention & Follow-up
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Track Every First-Timer,{" "}
              <span className="gradient-text">Retain Every Soul</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              A powerful platform to monitor first-time visitors, manage follow-up journeys, 
              track retention, and grow the body of Christ — all in one place.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link to="/auth?redirect=/first-timers">
                <Button size="lg" className="gradient-primary border-0 text-primary-foreground gap-2 text-base px-8 h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <UserPlus className="h-5 w-5" />
                  Register a First Timer
                </Button>
              </Link>
              <Link to="/auth?redirect=/attendance">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14 rounded-2xl border-2 hover:scale-105 transition-all">
                  <Calendar className="h-5 w-5" />
                  Track Attendance
                </Button>
              </Link>
              <Link to="/auth?redirect=/follow-up">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14 rounded-2xl border-2 hover:scale-105 transition-all">
                  <ClipboardList className="h-5 w-5" />
                  Follow-Up Tasks
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <StatCard
              icon={<UserPlus className="h-6 w-6" />}
              label="First Timers (This Month)"
              value={stats.totalFirstTimers}
              color="primary"
              loaded={loaded}
            />
            <StatCard
              icon={<Users className="h-6 w-6" />}
              label="Total Members"
              value={stats.totalMembers}
              color="accent"
              loaded={loaded}
            />
            <StatCard
              icon={<TrendingUp className="h-6 w-6" />}
              label="Members Retained"
              value={stats.retained}
              color="success"
              loaded={loaded}
            />
            <StatCard
              icon={<CheckCircle2 className="h-6 w-6" />}
              label="Follow-Ups Completed"
              value={stats.followedUp}
              color="primary"
              loaded={loaded}
            />
          </div>

          {/* Retention Progress */}
          <div className="max-w-5xl mx-auto mt-8">
            <Card className="glass-card stat-glow border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Overall Retention Rate</span>
                  <span className="text-2xl font-bold gradient-text">{stats.retentionRate}%</span>
                </div>
                <Progress value={stats.retentionRate} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.retained} out of {stats.totalMembers} visitors are now active members
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Recent First Timers */}
            <Card className="glass-card border-0 lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="gradient-primary p-2.5 rounded-xl">
                    <UserPlus className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-foreground">Recent First Timers</h3>
                    <p className="text-xs text-muted-foreground">Newest visitors this period</p>
                  </div>
                </div>
                {recentFirstTimers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No first timers registered yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentFirstTimers.map((ft, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {ft.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{ft.full_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ft.date_of_first_visit).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        {ft.location && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{ft.location}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Leaders */}
            <Card className="glass-card border-0 lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-accent p-2.5 rounded-xl">
                    <Award className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-foreground">Top Leaders</h3>
                    <p className="text-xs text-muted-foreground">By members assigned</p>
                  </div>
                </div>
                {topLeaders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No leader data available yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topLeaders.map((leader, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? "bg-accent text-accent-foreground" : 
                          i === 1 ? "bg-primary/20 text-primary" : 
                          "bg-muted text-muted-foreground"
                        }`}>
                          #{i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{leader.full_name}</p>
                          <p className="text-xs text-muted-foreground">{leader.count} members assigned</p>
                        </div>
                        {i === 0 && (
                          <span className="text-xs bg-accent/15 text-accent font-semibold px-2 py-1 rounded-full">🏆 Top</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Member Locations */}
            <Card className="glass-card border-0 lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-success p-2.5 rounded-xl">
                    <MapPin className="h-5 w-5 text-success-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-foreground">Member Locations</h3>
                    <p className="text-xs text-muted-foreground">Where our members are</p>
                  </div>
                </div>
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No location data available yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {locations.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm text-foreground">{loc.location}</span>
                        </div>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                          {loc.count} {loc.count === 1 ? "person" : "people"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Everything You Need to Grow</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Simple tools designed for church workers of all ages and technical abilities.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <UserPlus className="h-6 w-6" />, title: "First Timer Registration", desc: "Add visitors manually, via Excel, or bulk upload in seconds." },
              { icon: <ClipboardList className="h-6 w-6" />, title: "6-Week Follow-Up Pipeline", desc: "Automated weekly tasks from welcome call to membership confirmation." },
              { icon: <Calendar className="h-6 w-6" />, title: "Attendance Tracking", desc: "Log attendance for Sunday, midweek, cell meetings & special programs." },
              { icon: <BarChart3 className="h-6 w-6" />, title: "Church Growth Analytics", desc: "Visual charts showing retention trends, growth, and engagement." },
              { icon: <Award className="h-6 w-6" />, title: "Leader Leaderboards", desc: "Gamified rankings for soul-winning, retention, and follow-up consistency." },
              { icon: <Users className="h-6 w-6" />, title: "Global Member Search", desc: "Find any member instantly by name, phone, location, or department." },
            ].map((feature, i) => (
              <Card key={i} className="glass-card border-0 group hover:stat-glow transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="gradient-primary p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-primary-foreground">{feature.icon}</span>
                  </div>
                  <h3 className="font-sans font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="gradient-primary border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/3" />
            <CardContent className="relative p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
                Ready to Transform Your Church's Follow-Up?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Join Benin Zone One's digital retention system. Start tracking first-timers and retaining souls today.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary" className="gap-2 text-base h-14 px-10 rounded-2xl font-semibold hover:scale-105 transition-all">
                  Get Started Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Church className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Benin Zone One First Timers Tracker</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Benin Zone One. Track every first-timer, retain every soul.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color, loaded }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "accent" | "success";
  loaded: boolean;
}) {
  const bgMap = {
    primary: "gradient-primary",
    accent: "bg-accent",
    success: "bg-success",
  };

  return (
    <Card className="glass-card border-0 stat-glow hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-5 sm:p-6">
        <div className={`${bgMap[color]} p-2.5 rounded-xl w-fit mb-3`}>
          <span className={color === "primary" ? "text-primary-foreground" : `text-${color}-foreground`}>{icon}</span>
        </div>
        <p className={`text-3xl sm:text-4xl font-bold text-foreground ${loaded ? "animate-count-up" : ""}`}>
          {loaded ? value.toLocaleString() : "—"}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
