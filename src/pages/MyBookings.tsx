import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User } from "lucide-react";

const MyBookings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Mock bookings data - will be replaced with actual data from database
  const mockBookings = [
    {
      id: 1,
      service: "Daily Cleaning",
      date: "2024-01-15",
      time: "10:00 AM",
      helper: "Marvin Smith",
      location: "North Delhi",
      status: "confirmed",
    },
    {
      id: 2,
      service: "Cook",
      date: "2024-01-20",
      time: "8:00 AM",
      helper: "Brooklyn Simmons",
      location: "South Delhi",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your service bookings</p>
        </div>

        <div className="space-y-4">
          {mockBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No bookings yet</p>
                <Button onClick={() => navigate("/dashboard")} className="mt-4">
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          ) : (
            mockBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{booking.service}</CardTitle>
                    <Badge
                      variant={booking.status === "confirmed" ? "default" : "secondary"}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.date} at {booking.time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.helper}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default MyBookings;
