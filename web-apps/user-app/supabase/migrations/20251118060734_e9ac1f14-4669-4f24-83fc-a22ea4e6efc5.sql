-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  base_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Services are publicly viewable
CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (true);

-- Create helpers table
CREATE TABLE public.helpers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  service_type TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  profile_image_url TEXT,
  verified BOOLEAN DEFAULT false,
  bio TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on helpers
ALTER TABLE public.helpers ENABLE ROW LEVEL SECURITY;

-- Helpers are publicly viewable
CREATE POLICY "Helpers are viewable by everyone"
  ON public.helpers FOR SELECT
  USING (true);

-- Create helper availability table
CREATE TABLE public.helper_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id UUID REFERENCES public.helpers(id) ON DELETE CASCADE NOT NULL,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on helper_availability
ALTER TABLE public.helper_availability ENABLE ROW LEVEL SECURITY;

-- Availability is publicly viewable
CREATE POLICY "Helper availability is viewable by everyone"
  ON public.helper_availability FOR SELECT
  USING (true);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  helper_id UUID REFERENCES public.helpers(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  location TEXT,
  notes TEXT,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial services data
INSERT INTO public.services (name, description, image_url, base_price) VALUES
  ('Cleaning Services', 'Professional cleaning for your home or office', '/src/assets/cleaning-service.jpg', 299.00),
  ('Cook Services', 'Delicious home-cooked meals by expert chefs', '/src/assets/cook-service.jpg', 499.00),
  ('Elder Care', 'Compassionate care for your loved ones', '/src/assets/eldercare-service.jpg', 599.00),
  ('Babysitting', 'Trusted care for your little ones', '/src/assets/babysitter-service.jpg', 399.00),
  ('Gardening', 'Transform your outdoor space', '/src/assets/gardening-service.jpg', 349.00);

-- Insert sample helpers data
INSERT INTO public.helpers (full_name, phone, email, service_type, rating, total_reviews, experience_years, hourly_rate, verified, bio, city) VALUES
  ('Priya Sharma', '+91-9876543210', 'priya@example.com', 'Cleaning Services', 4.8, 127, 5, 250.00, true, 'Experienced professional cleaner with attention to detail', 'Mumbai'),
  ('Rajesh Kumar', '+91-9876543211', 'rajesh@example.com', 'Cook Services', 4.9, 203, 8, 400.00, true, 'Expert in North and South Indian cuisine', 'Delhi'),
  ('Meena Patel', '+91-9876543212', 'meena@example.com', 'Elder Care', 4.7, 89, 6, 500.00, true, 'Compassionate caregiver with nursing background', 'Bangalore'),
  ('Sunita Reddy', '+91-9876543213', 'sunita@example.com', 'Babysitting', 4.9, 156, 7, 350.00, true, 'Certified childcare professional, patient and loving', 'Hyderabad'),
  ('Ramesh Singh', '+91-9876543214', 'ramesh@example.com', 'Gardening', 4.6, 72, 4, 300.00, true, 'Landscape expert specializing in home gardens', 'Pune'),
  ('Lakshmi Iyer', '+91-9876543215', 'lakshmi@example.com', 'Cleaning Services', 4.8, 98, 4, 250.00, true, 'Eco-friendly cleaning specialist', 'Chennai'),
  ('Amit Verma', '+91-9876543216', 'amit@example.com', 'Cook Services', 4.7, 134, 6, 400.00, true, 'Multi-cuisine chef with international experience', 'Mumbai');

-- Insert sample availability data (next 7 days)
INSERT INTO public.helper_availability (helper_id, available_date, start_time, end_time)
SELECT 
  h.id,
  CURRENT_DATE + (d || ' days')::interval,
  '09:00:00'::time,
  '18:00:00'::time
FROM public.helpers h
CROSS JOIN generate_series(0, 6) d;