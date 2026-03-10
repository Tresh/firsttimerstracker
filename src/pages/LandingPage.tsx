import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KingsRetentionLogo } from "@/components/KingsRetentionLogo";
import {
  UserPlus, Users, TrendingUp, Calendar, Award, 
  ArrowRight, Heart, CheckCircle2, MapPin,
  BarChart3, ClipboardList, Shield, Zap
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
    totalFirstTimers: 0, totalMembers: 0, retained: 0, followedUp: 0, retentionRate: 0,
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

        const [firstTimersRes, allMembersRes, retainedRes, followedUpRes, recentRes, membersWithLocation] = await Promise.all([
          supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "First Timer").gte("date_of_first_visit", dateStr),
          supabase.from("members").select("id", { count: "exact", head: true }),
          supabase.from("members").select("id", { count: "exact", head: true }).in("status", ["Member", "Worker"]),
          supabase.from("follow_up_tasks").select("id", { count: "exact", head: true }).in("status", ["done", "verified"]),
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

        if (membersWithLocation.data) {
          const locMap: Record<string, number> = {};
          membersWithLocation.data.forEach((m) => {
            const loc = (m.location || "").trim();
            if (loc) locMap[loc] = (locMap[loc] || 0) + 1;
          });
          setLocations(Object.entries(locMap).map(([location, count]) => ({ location, count })).sort((a, b) => b.count - a.count).slice(0, 6));
        }

        const { data: leaderData } = await supabase.from("members").select("assigned_follow_up_leader").not("assigned_follow_up_leader", "is", null);
        if (leaderData) {
          const leaderCount: Record<string, number> = {};
          leaderData.forEach((m) => { leaderCount[m.assigned_follow_up_leader!] = (leaderCount[m.assigned_follow_up_leader!] || 0) + 1; });
          const topIds = Object.entries(leaderCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
          if (topIds.length > 0) {
            const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", topIds.map(([id]) => id));
            if (profiles) {
              const nameMap: Record<string, string> = {};
              profiles.forEach((p) => (nameMap[p.id] = p.full_name));
              setTopLeaders(topIds.map(([id, count]) => ({ full_name: nameMap[id] || "Unknown", count })));
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
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <KingsRetentionLogo size="sm" />
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.06]" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent/10 blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-primary text-sm font-medium mb-8 animate-fade-up">
              <Shield className="h-4 w-4" />
              The Race For The Last Man
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight mb-6 animate-fade-up-delay-1">
              Track Every Soul.{" "}
              <span className="gradient-gold">Retain Every Member.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up-delay-2">
              Winning and retaining every soul in the year of manifestation.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16 animate-fade-up-delay-3">
              <Link to="/auth?redirect=/first-timers">
                <Button size="lg" className="gap-2 text-base px-8 h-14">
                  <UserPlus className="h-5 w-5" />
                  Register a First Timer
                </Button>
              </Link>
              <Link to="/auth?redirect=/dashboard">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-14">
                  <BarChart3 className="h-5 w-5" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <StatCard icon={<UserPlus className="h-6 w-6" />} label="First Timers (This Month)" value={stats.totalFirstTimers} color="primary" loaded={loaded} delay={0} />
            <StatCard icon={<Users className="h-6 w-6" />} label="Total Members" value={stats.totalMembers} color="accent" loaded={loaded} delay={1} />
            <StatCard icon={<TrendingUp className="h-6 w-6" />} label="Members Retained" value={stats.retained} color="success" loaded={loaded} delay={2} />
            <StatCard icon={<CheckCircle2 className="h-6 w-6" />} label="Follow-Ups Done" value={stats.followedUp} color="info" loaded={loaded} delay={3} />
          </div>

          {/* Retention Progress */}
          <div className="max-w-5xl mx-auto mt-8 animate-fade-up-delay-5">
            <Card className="border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Overall Retention Rate</span>
                  <span className="text-2xl font-display font-extrabold gradient-gold">{stats.retentionRate}%</span>
                </div>
                <div className="h-3 rounded-full progress-bar-track overflow-hidden">
                  <div className="h-full rounded-full progress-bar-fill transition-all duration-1000" style={{ width: `${stats.retentionRate}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.retained} out of {stats.totalMembers} visitors are now active members
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent First Timers */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="gradient-primary p-2.5 rounded-xl">
                    <UserPlus className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">Recent First Timers</h3>
                    <p className="text-xs text-muted-foreground">Newest visitors</p>
                  </div>
                </div>
                {recentFirstTimers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No first timers registered yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentFirstTimers.map((ft, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
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
                        {ft.location && <span className="text-xs badge-primary px-2 py-1 rounded-full">{ft.location}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Leaders */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-accent/20 p-2.5 rounded-xl">
                    <Award className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">Top Leaders</h3>
                    <p className="text-xs text-muted-foreground">By members assigned</p>
                  </div>
                </div>
                {topLeaders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No leader data available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {topLeaders.map((leader, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? "bg-accent/20 text-accent gold-glow" : i === 1 ? "badge-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          #{i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{leader.full_name}</p>
                          <p className="text-xs text-muted-foreground">{leader.count} assigned</p>
                        </div>
                        {i === 0 && <span className="text-xs badge-gold px-2 py-1 rounded-full font-semibold">🏆 Top</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Locations */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-success/20 p-2.5 rounded-xl">
                    <MapPin className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">Member Locations</h3>
                    <p className="text-xs text-muted-foreground">Where our members are</p>
                  </div>
                </div>
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No location data available.</p>
                ) : (
                  <div className="space-y-2">
                    {locations.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm text-foreground">{loc.location}</span>
                        </div>
                        <span className="text-xs badge-primary px-3 py-1 rounded-full font-semibold">
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

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-extrabold text-foreground mb-3">Everything You Need to Grow</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Simple tools designed for church workers of all technical abilities.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <UserPlus className="h-6 w-6" />, title: "First Timer Registration", desc: "Add visitors manually, via Excel, or bulk upload in seconds." },
              { icon: <ClipboardList className="h-6 w-6" />, title: "6-Week Follow-Up Pipeline", desc: "Automated weekly tasks from welcome call to membership confirmation." },
              { icon: <Calendar className="h-6 w-6" />, title: "Attendance Tracking", desc: "Log attendance for Sunday, midweek, cell meetings & special programs." },
              { icon: <BarChart3 className="h-6 w-6" />, title: "Church Growth Analytics", desc: "Visual charts showing retention trends, growth, and engagement." },
              { icon: <Award className="h-6 w-6" />, title: "Leader Leaderboards", desc: "Gamified rankings for soul-winning, retention, and follow-up consistency." },
              { icon: <Zap className="h-6 w-6" />, title: "Real-Time Intelligence", desc: "Live dashboards showing church health across all departments." },
            ].map((feature, i) => (
              <Card key={i} className="group">
                <CardContent className="p-6">
                  <div className="gradient-primary p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-primary-foreground">{feature.icon}</span>
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{feature.title}</h3>
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
          <div className="gradient-primary rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
            <div className="relative p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-display font-extrabold text-primary-foreground mb-4">
                Ready to Transform Your Church's Follow-Up?
              </h2>
              <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
                Start tracking first-timers and retaining souls today with KingsRetention.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="outline" className="gap-2 text-base h-14 px-10 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30">
                  Get Started Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <KingsRetentionLogo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} KingsRetention. Track Every Soul. Retain Every Member.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color, loaded, delay }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "accent" | "success" | "info";
  loaded: boolean;
  delay: number;
}) {
  const bgMap = {
    primary: "gradient-primary",
    accent: "bg-accent/20 text-accent",
    success: "bg-success/20 text-success",
    info: "bg-info/20 text-info",
  };
  const textMap = {
    primary: "text-primary-foreground",
    accent: "text-accent",
    success: "text-success",
    info: "text-info",
  };

  return (
    <Card className={`animate-fade-up-delay-${delay + 1}`}>
      <CardContent className="p-5 sm:p-6">
        <div className={`${bgMap[color]} p-2.5 rounded-xl w-fit mb-3`}>
          <span className={color === "primary" ? "text-primary-foreground" : ""}>{icon}</span>
        </div>
        <p className={`text-3xl sm:text-4xl font-display font-extrabold ${textMap[color]} ${loaded ? "animate-count-up" : ""}`}>
          {loaded ? value.toLocaleString() : "—"}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
