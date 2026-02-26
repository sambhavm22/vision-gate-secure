import { AddressSelectionDialog } from "@/components/AddressSelectionDialog"; // Reuse the dialog
import { supabase } from "@vision-gate/supabase/client";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardHeader, CardTitle, useToast } from "@vision-gate/ui";
import { ArrowLeft, Briefcase, HelpCircle, Home, LogOut, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

interface Address {
  id: string;
  address_line1: string;
  city: string;
  postal_code: string;
  label?: string;
  is_default?: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Address Management
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) setProfile(profileData);

        // Fetch Addresses
        const { data: addressData } = await supabase
          .from("addresses" as any)
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        setAddresses(addressData || []);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const { error } = await supabase.from("addresses" as any).delete().eq("id", id);
      if (error) throw error;
      setAddresses(addresses.filter(a => a.id !== id));
      toast({ title: "Address deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background p-4 md:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="hover:bg-transparent pl-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="h-20 w-20 border-2 border-primary/10">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary/5 text-primary">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile?.full_name || "User"}</CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile?.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Addresses Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Saved Addresses</h2>
            <Button size="sm" onClick={() => setShowAddressDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add New
            </Button>
          </div>

          {addresses.length === 0 ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MapPin className="h-10 w-10 mb-2 opacity-20" />
                <p>No addresses saved yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <Card key={addr.id} className="group hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="mt-1 p-2 bg-slate-100 dark:bg-secondary rounded-full text-slate-500">
                      {addr.label === 'Work' ? <Briefcase className="h-4 w-4" /> :
                        addr.label === 'Home' ? <Home className="h-4 w-4" /> :
                          <MapPin className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{addr.label || "Address"}</span>
                          {addr.is_default && <Badge variant="secondary" className="text-[10px] h-5">Default</Badge>}
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditingAddress(addr);
                              setShowAddressDialog(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {addr.address_line1}, {addr.city}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{addr.postal_code}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Support</h2>
          <Card
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => navigate("/support")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Help & Support</p>
                  <p className="text-sm text-muted-foreground">Report an issue or ask for help</p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-8">
          <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <AddressSelectionDialog
          open={showAddressDialog}
          onOpenChange={(open) => {
            setShowAddressDialog(open);
            if (!open) setEditingAddress(null);
          }}
          onSelect={() => {
            fetchData();
            setShowAddressDialog(false);
            setEditingAddress(null);
          }}
          currentLocation={localStorage.getItem("userLocation") || ""}
          initialAddress={editingAddress}
        />
      </div>
    </div>
  );
};

export default Profile;

