import { useState, useMemo } from "react";
import { Sun, Moon, Search, Sparkles, Home, Calendar, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/helperhub-logo.png";
import cleaningImg from "@/assets/cleaning-service.jpg";
import cookImg from "@/assets/cook-service.jpg";
import babysitterImg from "@/assets/babysitter-service.jpg";
import eldercareImg from "@/assets/eldercare-service.jpg";
import gardeningImg from "@/assets/gardening-service.jpg";

const AGE_GROUPS = ["18-25", "26-35", "36-50", "50+"];
const GENDERS = ["Any", "Male", "Female", "Other"];
const HOURS = ["Full-time", "Part-time", "Morning", "Evening"];
const WORK_TYPES = ["Cleaning", "Cooking", "Baby Care", "Elder Care", "Plumbing", "Electrician", "Gardening"];
const CASTES = ["Any", "General", "OBC", "SC/ST", "Other"];
const HOUSE_SIZES = ["1 BHK", "2 BHK", "3 BHK", "4+ BHK"];

const MOCK_HELPERS = [
  { id: 1, name: "Marvin Smith", avatar: "https://randomuser.me/api/portraits/men/45.jpg", gender: "Male", ageGroup: "26-35", caste: "Any", hours: "Full-time", workType: "Plumbing", familyMembers: 3, houseSize: "3 BHK", rate: 99, rating: 4.8, verified: true },
  { id: 2, name: "Brooklyn Simmons", avatar: "https://randomuser.me/api/portraits/women/32.jpg", gender: "Female", ageGroup: "26-35", caste: "General", hours: "Part-time", workType: "Electrician", familyMembers: 4, houseSize: "2 BHK", rate: 199, rating: 4.0, verified: true },
  { id: 3, name: "Darlene Robertson", avatar: "https://randomuser.me/api/portraits/women/55.jpg", gender: "Female", ageGroup: "36-50", caste: "OBC", hours: "Morning", workType: "Cleaning", familyMembers: 5, houseSize: "4+ BHK", rate: 249, rating: 4.3, verified: false },
  { id: 4, name: "Sui Moh", avatar: "https://randomuser.me/api/portraits/men/27.jpg", gender: "Male", ageGroup: "18-25", caste: "Any", hours: "Evening", workType: "Gardening", familyMembers: 2, houseSize: "1 BHK", rate: 299, rating: 4.5, verified: true },
];

const SERVICES = [
  { name: "Daily Cleaning", img: cleaningImg },
  { name: "Cook", img: cookImg },
  { name: "Babysitter", img: babysitterImg },
  { name: "Elder Care", img: eldercareImg },
  { name: "Gardening", img: gardeningImg },
];

const TRUSTED_CLIENTS = [
  { name: "Tata", img: "https://upload.wikimedia.org/wikipedia/en/2/29/Tata_logo.svg" },
  { name: "Reliance", img: "https://upload.wikimedia.org/wikipedia/en/b/bc/Reliance_Industries_Logo.svg" },
  { name: "Swiggy", img: "https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg" },
  { name: "Amazon", img: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
];

const SLOTS = [
  { id: "1hr", label: "1 hr", price: 99 },
  { id: "2hr", label: "2 hrs", price: 199 },
  { id: "1week", label: "1 week", price: 999 },
  { id: "1month", label: "1 month", price: 2499 },
  { id: "12month", label: "12 months", price: 19999 },
];

const Dashboard = () => {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState("City");
  const [filters, setFilters] = useState({
    gender: "Any",
    ageGroup: "",
    caste: "Any",
    hours: "",
    workType: "",
    familyMembers: "",
    houseSize: "",
  });
  const [recommended, setRecommended] = useState<typeof MOCK_HELPERS>([]);
  const [selectedSlot, setSelectedSlot] = useState("1hr");
  const [prebook, setPrebook] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const aiRecommend = () => {
    const scored = MOCK_HELPERS.map((h) => {
      let score = 0;
      if (filters.gender === "Any" || !filters.gender || filters.gender === h.gender) score += 1;
      if (!filters.ageGroup || filters.ageGroup === h.ageGroup) score += 1;
      if (!filters.caste || filters.caste === "Any" || filters.caste === h.caste) score += 1;
      if (!filters.workType || filters.workType === h.workType) score += 2;
      if (h.verified) score += 1.5;
      score += h.rating / 5;
      return { ...h, score };
    });
    scored.sort((a, b) => b.score - a.score);
    setRecommended(scored.slice(0, 6));
    toast({
      title: "AI Recommendations Ready!",
      description: `Found ${scored.length} helpers matching your preferences.`,
    });
  };

  const candidates = useMemo(() => {
    return MOCK_HELPERS.filter((h) => {
      if (filters.gender !== "Any" && filters.gender && h.gender !== filters.gender) return false;
      if (filters.ageGroup && h.ageGroup !== filters.ageGroup) return false;
      if (filters.caste !== "Any" && filters.caste && h.caste !== filters.caste) return false;
      if (filters.hours && h.hours !== filters.hours) return false;
      if (filters.workType && h.workType !== filters.workType) return false;
      if (filters.houseSize && h.houseSize !== filters.houseSize) return false;
      if (filters.familyMembers && Number(filters.familyMembers) && h.familyMembers !== Number(filters.familyMembers)) return false;
      if (query && !`${h.name} ${h.workType}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [filters, query]);

  const clearFilters = () => {
    setFilters({ gender: "Any", ageGroup: "", caste: "Any", hours: "", workType: "", familyMembers: "", houseSize: "" });
    setQuery("");
    setRecommended([]);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const handleBook = (helperName: string) => {
    toast({
      title: "Booking Confirmed!",
      description: `Your booking with ${helperName} has been confirmed.`,
    });
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="max-w-6xl mx-auto pb-28">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="HelperHub" className="h-10 w-10" />
              <h1 className="text-2xl font-bold">HelperHub</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 border">
                <Select value={searchScope} onValueChange={setSearchScope}>
                  <SelectTrigger className="w-[100px] border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="City">City</SelectItem>
                    <SelectItem value="Location">Location</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${searchScope.toLowerCase()}...`}
                  className="border-0 focus-visible:ring-0"
                />
                <Button size="icon" variant="ghost">
                  <Search size={18} />
                </Button>
              </div>
              <Button onClick={() => setDark((d) => !d)} size="icon" variant="outline">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button onClick={handleLogout} size="icon" variant="outline">
                <LogOut size={18} />
              </Button>
            </div>
          </header>

          {/* Filters */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-3 pb-2">
              <Select value={filters.gender} onValueChange={(v) => updateFilter("gender", v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.ageGroup} onValueChange={(v) => updateFilter("ageGroup", v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Age Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Ages</SelectItem>
                  {AGE_GROUPS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.workType} onValueChange={(v) => updateFilter("workType", v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type of Work" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {WORK_TYPES.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.hours} onValueChange={(v) => updateFilter("hours", v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Working Hours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Hours</SelectItem>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={aiRecommend} className="gap-2">
                <Sparkles size={16} />
                AI Recommend
              </Button>
            </div>
          </div>

          {/* Slot Booking */}
          <Card className="mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Book a slot</h2>
                <p className="text-sm text-muted-foreground">Choose a slot to book a helper</p>
              </div>
              <p className="text-sm text-muted-foreground">From Rs. 99/-</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-3">
              {SLOTS.map((s) => (
                <Button
                  key={s.id}
                  variant={selectedSlot === s.id ? "default" : "outline"}
                  onClick={() => setSelectedSlot(s.id)}
                  className="min-w-[120px] flex-col h-auto py-3"
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-sm opacity-80">Rs. {s.price}/-</div>
                </Button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="prebook" checked={prebook} onCheckedChange={(checked) => setPrebook(checked as boolean)} />
                <Label htmlFor="prebook" className="text-sm cursor-pointer">
                  Prebook for convenience
                </Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="outline">
                  Clear
                </Button>
                <Button>Continue</Button>
              </div>
            </div>
          </Card>

          {/* Available Helpers */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Available Helpers</h3>
              <Badge variant="secondary">{candidates.length} found</Badge>
            </div>

            {recommended.length > 0 ? (
              <div className="space-y-3">
                {recommended.map((r) => (
                  <Card key={r.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={r.avatar} alt={r.name} className="w-16 h-16 rounded-full object-cover" />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {r.name}
                          {r.verified && <Badge variant="secondary">Verified</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {r.workType} • Rs. {r.rate}/-
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm mb-2">{r.rating} ★</div>
                      <Button size="sm" onClick={() => handleBook(r.name)}>
                        Book
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((h) => (
                  <Card key={h.id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <img src={h.avatar} alt={h.name} className="w-16 h-16 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {h.name}
                          {h.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{h.workType}</div>
                        <div className="text-sm text-primary font-medium">Rs. {h.rate}/-</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{h.rating} ★</div>
                      <Button size="sm" onClick={() => handleBook(h.name)}>
                        Book
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Services */}
          <Card className="mb-6 p-6">
            <h3 className="text-xl font-semibold mb-4">Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {SERVICES.map((s) => (
                <Button key={s.name} variant="outline" className="flex-col h-auto p-4 gap-3">
                  <img src={s.img} alt={s.name} className="w-16 h-16 rounded-lg object-cover" />
                  <span className="text-sm">{s.name}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Trusted Clients */}
          <section className="mb-24">
            <h3 className="text-xl font-semibold mb-4">Trusted by</h3>
            <div className="flex gap-6 overflow-x-auto py-2">
              {TRUSTED_CLIENTS.map((client) => (
                <Card key={client.name} className="flex-shrink-0 w-36 h-24 flex items-center justify-center p-4">
                  <img src={client.img} alt={client.name} className="max-h-12 object-contain" />
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Fixed Footer Navigation */}
        <div className="fixed bottom-4 left-0 right-0 max-w-6xl mx-auto px-4">
          <Card className="p-3">
            <div className="flex justify-around items-center">
              <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
                <Home size={20} />
                <span className="text-xs">Home</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
                <Calendar size={20} />
                <span className="text-xs">My Bookings</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
                <User size={20} />
                <span className="text-xs">Profile</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
