


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'user',
    'worker'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_booking"("p_booking_id" "uuid", "p_worker_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Validate worker is the caller
  IF p_worker_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET 
    worker_id = p_worker_id,
    status = 'accepted',
    updated_at = NOW()
  WHERE id = p_booking_id
    AND status = 'requested';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not available or already taken';
  END IF;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."accept_booking"("p_booking_id" "uuid", "p_worker_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_otps"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.otp_verifications
    WHERE created_at < NOW() - INTERVAL '24 hours'
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_otps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking"("service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "notes_input" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_customer uuid := auth.uid();
  v_price numeric;
  v_total numeric;
  new_booking_id uuid;
begin
  if v_customer is null then
    raise exception 'Authentication required';
  end if;

  if duration_minutes_input is null or duration_minutes_input <= 0 then
    raise exception 'Invalid duration_minutes: must be > 0';
  end if;

  if scheduled_at_input <= now() then
    raise exception 'Invalid scheduled_at: must be in the future';
  end if;

  select base_price into v_price
    from public.services
   where id = service_id_input
     and is_active = true
   limit 1;
  if not found then
    raise exception 'Invalid service_id';
  end if;

  perform 1
    from public.addresses a
   where a.id = address_id_input
     and a.customer_id = v_customer;
  if not found then
    raise exception 'Invalid address_id or address not owned by user';
  end if;

  v_total := round((v_price * (duration_minutes_input::numeric / 60.0))::numeric, 2);

  insert into public.bookings (
    customer_id,
    service_id,
    address_id,
    scheduled_at,
    duration_minutes,
    notes,
    worker_id,
    total_amount,
    status
  ) values (
    v_customer,
    service_id_input,
    address_id_input,
    scheduled_at_input,
    duration_minutes_input,
    notes_input,
    null,
    v_total,
    'requested'
  )
  returning id into new_booking_id;

  return new_booking_id;
end;
$$;


ALTER FUNCTION "public"."create_booking"("service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "notes_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking"("customer_uuid" "uuid", "service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "preferred_worker_id_input" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  new_booking_id uuid;
  service_price numeric;
begin
  -- 1. Security Check: Ensure caller manages this user (or is admin)
  if auth.uid() <> customer_uuid then
    raise exception 'Unauthorized: User ID mismatch';
  end if;

  -- 2. Validation & Pricing Lookup
  select base_price into service_price from public.services where id = service_id_input limit 1;
  if not found then raise exception 'Service not found'; end if;

  -- 3. Insert Booking
  insert into public.bookings (
    customer_id,
    service_id,
    address_id,
    worker_id,
    scheduled_at,
    duration_minutes,
    total_amount,
    status
  ) values (
    customer_uuid,
    service_id_input,
    address_id_input,
    preferred_worker_id_input,
    scheduled_at_input,
    duration_minutes_input,
    -- Simple pricing logic: base * (duration/60), minimal example
    round((service_price * (duration_minutes_input::numeric / 60.0)), 2),
    'requested'
  )
  returning id into new_booking_id;

  -- 4. Note: Push notification logic or worker assignment triggers would happen here (e.g. via Edge Function)

  return new_booking_id;
end;
$$;


ALTER FUNCTION "public"."create_booking"("customer_uuid" "uuid", "service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "preferred_worker_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "service_name" "text", "status" "text", "total_amount" numeric, "scheduled_at" timestamp with time zone, "duration_minutes" integer, "address_line1" "text", "city" "text", "dist_meters" double precision, "notes" "text", "is_location_estimated" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
  v_worker_zip text;
  v_is_estimated boolean := false;
  v_search_radius_meters int := 50000; -- Default 50km radius for performance
begin
  -- Get worker details
  select wp.service_types, wp.location, wp.postal_code 
  into v_worker_services, v_worker_location, v_worker_zip
  from public.workers_public wp
  where wp.id = p_worker_id;

  -- Fallback logic
  if v_worker_location is null and v_worker_zip is not null then
    select location into v_worker_location
    from public.zip_centroids
    where postal_code = v_worker_zip;
    
    if v_worker_location is not null then
      v_is_estimated := true;
    end if;
  end if;

  return query
  select
    b.id,
    s.name as service_name,
    b.status,
    b.total_amount,
    b.scheduled_at,
    b.duration_minutes,
    a.address_line1,
    a.city,
    -- Calculate distance
    case 
      when v_worker_location is not null and a.location is not null then
        st_distance(a.location, v_worker_location)
      else
        null
    end as dist_meters,
    b.notes,
    v_is_estimated as is_location_estimated
  from
    public.bookings b
    left join public.services s on b.service_id = s.id
    left join public.addresses a on b.address_id = a.id
  where
    b.status = 'requested'
    and s.name = any(v_worker_services)
    and b.scheduled_at > (now() - interval '24 hours')
    -- PERFORMANCE OPTIMIZATION: Use GIST index for spatial filtering
    and (
      v_worker_location is null 
      or a.location is null
      or ST_DWithin(a.location, v_worker_location, v_search_radius_meters)
    )
  order by
    b.scheduled_at asc,
    dist_meters asc nulls last;
end;
$$;


ALTER FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 50, "p_radius_km" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "booking_id" "uuid", "service_name" "text", "status" "text", "total_amount" numeric, "scheduled_at" timestamp with time zone, "duration_minutes" integer, "address_line1" "text", "city" "text", "dist_meters" double precision, "notes" "text", "is_location_estimated" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
  v_radius_meters int;
BEGIN
  v_radius_meters := p_radius_km * 1000;
  
  -- Get worker details: fetching strictly necessary columns
  SELECT wp.service_types, wp.location 
  INTO v_worker_services, v_worker_location
  FROM public.workers_public wp
  WHERE wp.id = p_worker_id;

  RETURN QUERY
  SELECT
    b.id,
    b.id AS booking_id,
    s.name AS service_name,
    b.status,
    b.total_amount,
    b.scheduled_at,
    b.duration_minutes,
    a.address_line1,
    a.city,
    -- Calculate distance if worker has location
    CASE 
      WHEN v_worker_location IS NOT NULL AND a.location IS NOT NULL THEN
        ST_Distance(a.location, v_worker_location)
      ELSE
        NULL
    END AS dist_meters,
    b.notes,
    (a.location IS NULL) AS is_location_estimated
  FROM
    public.bookings b
    INNER JOIN public.services s ON b.service_id = s.id
    LEFT JOIN public.addresses a ON b.address_id = a.id
  WHERE
    b.status = 'requested'
    AND s.name = ANY(v_worker_services)
    AND b.scheduled_at > (NOW() - INTERVAL '24 hours')
    -- Distance pre-filter (only if worker has location)
    -- This greatly reduces rows before joining if index exists
    AND (
      v_worker_location IS NULL 
      OR a.location IS NULL 
      OR ST_DWithin(a.location, v_worker_location, v_radius_meters)
    )
  ORDER BY
    b.scheduled_at ASC,
    dist_meters ASC NULLS LAST
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_bookings_v2"("p_worker_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 50, "p_radius_km" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "booking_id" "uuid", "service_name" "text", "status" "text", "total_amount" numeric, "scheduled_at" timestamp with time zone, "duration_minutes" integer, "address_line1" "text", "city" "text", "dist_meters" double precision, "notes" "text", "is_location_estimated" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
  v_radius_meters int;
begin
  v_radius_meters := p_radius_km * 1000;
  
  -- Get worker details
  select wp.service_types, wp.location 
  into v_worker_services, v_worker_location
  from public.workers_public wp
  where wp.id = p_worker_id;

  return query
  select
    b.id,
    b.id as booking_id,
    s.name as service_name,
    b.status,
    b.total_amount,
    b.scheduled_at,
    b.duration_minutes,
    a.address_line1,
    a.city,
    -- Calculate distance if worker has location
    case 
      when v_worker_location is not null and a.location is not null then
        st_distance(a.location, v_worker_location)
      else
        null
    end as dist_meters,
    b.notes,
    (a.location is null) as is_location_estimated
  from
    public.bookings b
    inner join public.services s on b.service_id = s.id
    left join public.addresses a on b.address_id = a.id
  where
    b.status = 'requested'
    and s.name = any(v_worker_services)
    and b.scheduled_at > (now() - interval '24 hours')
    -- Distance pre-filter (only if worker has location)
    and (
      v_worker_location is null 
      or a.location is null 
      or st_dwithin(a.location, v_worker_location, v_radius_meters)
    )
  order by
    b.scheduled_at asc,
    dist_meters asc nulls last
  limit p_limit;
end;
$$;


ALTER FUNCTION "public"."get_market_bookings_v2"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_requests"("p_worker_id" "uuid", "p_radius_meters" integer DEFAULT 20000) RETURNS TABLE("id" "uuid", "service_name" "text", "status" "text", "total_amount" numeric, "scheduled_at" timestamp with time zone, "duration_minutes" integer, "address_line1" "text", "city" "text", "dist_meters" double precision, "notes" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_worker_location geography(Point, 4326);
  v_worker_services text[];
begin
  select location, service_types into v_worker_location, v_worker_services
  from public.workers_public as wp
  where wp.id = p_worker_id;

  if v_worker_location is null then
    return;
  end if;

  return query
  select
    b.id,
    s.name as service_name,
    b.status,
    b.total_amount,
    b.scheduled_at,
    b.duration_minutes,
    a.address_line1,
    a.city,
    st_distance(a.location, v_worker_location) as dist_meters,
    b.notes
  from
    public.bookings b
    join public.services s on b.service_id = s.id
    join public.addresses a on b.address_id = a.id
  where
    b.status = 'requested'
    and b.worker_id is null
    and s.name = any(v_worker_services)
    and st_dwithin(a.location, v_worker_location, p_radius_meters)
  order by
    b.scheduled_at asc;
end;
$$;


ALTER FUNCTION "public"."get_market_requests"("p_worker_id" "uuid", "p_radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_worker_for_booking"("booking_id_input" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_customer_id uuid;
  v_booking_status text;
  v_service_id bigint;
  v_address_id uuid;
  v_service_name text;
  v_booking_location geography(Point, 4326);
  v_assigned_worker_id uuid;
  v_radius_meters int;
  v_radius_options int[] := ARRAY[20000, 50000, 100000]; -- 20km, 50km, 100km
BEGIN
  -- A. Validate Booking
  SELECT 
    customer_id, 
    status, 
    service_id, 
    address_id
  INTO 
    v_customer_id, 
    v_booking_status, 
    v_service_id, 
    v_address_id
  FROM public.bookings
  WHERE id = booking_id_input;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_customer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only match workers for your own bookings';
  END IF;

  IF v_booking_status <> 'requested' THEN
    RAISE EXCEPTION 'Invalid booking status: can only match when status is requested';
  END IF;

  -- B. Fetch Context Data
  SELECT name INTO v_service_name
  FROM public.services
  WHERE id = v_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service data missing';
  END IF;

  SELECT location INTO v_booking_location
  FROM public.addresses
  WHERE id = v_address_id;

  IF v_booking_location IS NULL THEN
    RAISE EXCEPTION 'Booking address location missing';
  END IF;

  -- C. Progressive Radius Search
  FOREACH v_radius_meters IN ARRAY v_radius_options
  LOOP
    SELECT id
    INTO v_assigned_worker_id
    FROM public.workers_public
    WHERE 
      service_types @> ARRAY[v_service_name]
      AND ST_DWithin(location, v_booking_location, v_radius_meters)
    ORDER BY
      is_verified DESC,
      rating DESC,
      ST_Distance(location, v_booking_location) ASC
    LIMIT 1;

    EXIT WHEN v_assigned_worker_id IS NOT NULL;
  END LOOP;

  IF v_assigned_worker_id IS NULL THEN
    RAISE EXCEPTION 'No matching worker found within 100km for this service';
  END IF;

  -- D. Update Booking
  UPDATE public.bookings
  SET 
    worker_id = v_assigned_worker_id,
    status = 'matched',
    updated_at = NOW()
  WHERE id = booking_id_input;

  RETURN v_assigned_worker_id;
END;
$$;


ALTER FUNCTION "public"."match_worker_for_booking"("booking_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."nearby_workers"("lat" double precision, "lng" double precision, "service_filter" "text" DEFAULT NULL::"text", "radius_meters" integer DEFAULT 10000) RETURNS TABLE("id" "uuid", "full_name" "text", "rating" numeric, "hourly_rate" numeric, "dist_meters" double precision, "is_verified" boolean, "profile_image_url" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select
    id,
    full_name,
    rating,
    hourly_rate,
    st_distance(location, st_point(lng, lat)::geography) as dist_meters,
    is_verified,
    profile_image_url
  from
    public.workers_public
  where
    st_dwithin(location, st_point(lng, lat)::geography, radius_meters)
    and (service_filter is null or service_types @> array[service_filter])
  order by
    dist_meters asc;
$$;


ALTER FUNCTION "public"."nearby_workers"("lat" double precision, "lng" double precision, "service_filter" "text", "radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_verification_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Allow service_role (superuser) to update everything
  -- 'service_role' is the role used by Edge Functions with secret key
  IF (auth.role() = 'service_role') THEN
    RETURN NEW;
  END IF;

  -- For normal users, check if they are trying to change protected fields
  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified) OR
     (NEW.verification_status IS DISTINCT FROM OLD.verification_status) OR
     (NEW.verified_at IS DISTINCT FROM OLD.verified_at) OR 
     (NEW.verification_source IS DISTINCT FROM OLD.verification_source) THEN
       RAISE EXCEPTION 'Unauthorized: Only system can update verification status';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_verification_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_address_location"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if new.lat is not null and new.lng is not null then
    new.location := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_address_location"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_worker_rating_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_worker_id uuid;
  v_avg_rating numeric;
  v_count int;
BEGIN
  -- We only care if rating is changed
  IF NEW.rating IS NOT DISTINCT FROM OLD.rating THEN
    RETURN NEW;
  END IF;

  v_worker_id := NEW.worker_id;
  
  -- Calculate new stats
  SELECT 
    ROUND(AVG(rating)::numeric, 1), 
    COUNT(id)
  INTO 
    v_avg_rating, 
    v_count
  FROM public.bookings
  WHERE worker_id = v_worker_id
    AND rating IS NOT NULL;

  -- Update worker profile
  UPDATE public.workers_public
  SET 
    rating = COALESCE(v_avg_rating, 0),
    total_reviews = COALESCE(v_count, 0)
  WHERE id = v_worker_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_worker_rating_stats"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "label" "text",
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text",
    "postal_code" bigint,
    "location" "extensions"."geography"(Point,4326),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "lat" double precision,
    "lng" double precision
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "worker_id" "uuid",
    "service_id" bigint NOT NULL,
    "address_id" "uuid",
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer,
    "total_amount" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "location" "extensions"."geography"(Point,4326),
    "rating" integer,
    "review" "text",
    CONSTRAINT "bookings_duration_minutes_check" CHECK (("duration_minutes" > 0)),
    CONSTRAINT "bookings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'matched'::"text", 'accepted'::"text", 'en_route'::"text", 'in_progress'::"text", 'completed'::"text", 'paid'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "bookings_total_amount_check" CHECK (("total_amount" >= (0)::numeric))
);

ALTER TABLE ONLY "public"."bookings" REPLICA IDENTITY FULL;


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."otp_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "code" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "verified_at" timestamp with time zone,
    "attempts" integer DEFAULT 0
);


ALTER TABLE "public"."otp_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "role" "public"."app_role" DEFAULT 'user'::"public"."app_role",
    "avatar_url" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_price" numeric(10,2) NOT NULL,
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "services_base_price_check" CHECK (("base_price" >= (0)::numeric))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


ALTER TABLE "public"."services" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."services_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" "text",
    "status" "text",
    "provider_transaction_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transactions_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['upi'::"text", 'card'::"text", 'cash'::"text", 'netbanking'::"text"]))),
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workers_public" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "profile_image_url" "text",
    "service_types" "text"[],
    "rating" numeric(3,2) DEFAULT 5.0,
    "total_reviews" integer DEFAULT 0,
    "hourly_rate" numeric(10,2),
    "location" "extensions"."geography"(Point,4326),
    "is_verified" boolean DEFAULT false,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "postal_code" "text",
    "verification_status" "text" DEFAULT 'unverified'::"text",
    "verification_source" "text",
    "verified_at" timestamp with time zone,
    "verification_metadata" "jsonb",
    CONSTRAINT "workers_public_rating_check" CHECK ((("rating" >= (1)::numeric) AND ("rating" <= (5)::numeric)))
);


ALTER TABLE "public"."workers_public" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zip_centroids" (
    "postal_code" "text" NOT NULL,
    "location" "extensions"."geography"(Point,4326)
);


ALTER TABLE "public"."zip_centroids" OWNER TO "postgres";


ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otp_verifications"
    ADD CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workers_public"
    ADD CONSTRAINT "workers_public_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workers_public"
    ADD CONSTRAINT "workers_public_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."zip_centroids"
    ADD CONSTRAINT "zip_centroids_pkey" PRIMARY KEY ("postal_code");



CREATE INDEX "bookings_location_idx" ON "public"."bookings" USING "gist" ("location");



CREATE INDEX "idx_addresses_customer_id" ON "public"."addresses" USING "btree" ("customer_id");



CREATE INDEX "idx_addresses_location" ON "public"."addresses" USING "gist" ("location");



CREATE INDEX "idx_bookings_address_id" ON "public"."bookings" USING "btree" ("address_id");



CREATE INDEX "idx_bookings_customer" ON "public"."bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_bookings_scheduled" ON "public"."bookings" USING "btree" ("scheduled_at");



CREATE INDEX "idx_bookings_service_id" ON "public"."bookings" USING "btree" ("service_id");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_status_scheduled_at" ON "public"."bookings" USING "btree" ("status", "scheduled_at" DESC) WHERE ("status" = 'requested'::"text");



CREATE INDEX "idx_bookings_worker" ON "public"."bookings" USING "btree" ("worker_id");



CREATE INDEX "idx_bookings_worker_status" ON "public"."bookings" USING "btree" ("worker_id", "status") WHERE ("worker_id" IS NOT NULL);



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_otp_verifications_lookup" ON "public"."otp_verifications" USING "btree" ("phone", "code", "expires_at") WHERE ("verified_at" IS NULL);



CREATE INDEX "idx_reviews_reviewer_id" ON "public"."reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_reviews_worker_id" ON "public"."reviews" USING "btree" ("worker_id");



CREATE INDEX "idx_transactions_booking_id" ON "public"."transactions" USING "btree" ("booking_id");



CREATE INDEX "idx_workers_location" ON "public"."workers_public" USING "gist" ("location");



CREATE INDEX "idx_workers_rating" ON "public"."workers_public" USING "btree" ("rating" DESC);



CREATE INDEX "idx_workers_service_types" ON "public"."workers_public" USING "gin" ("service_types");



CREATE INDEX "idx_workers_verified_rating" ON "public"."workers_public" USING "btree" ("is_verified" DESC, "rating" DESC) WHERE ("location" IS NOT NULL);



CREATE INDEX "otp_verifications_phone_idx" ON "public"."otp_verifications" USING "btree" ("phone");



CREATE OR REPLACE TRIGGER "protect_worker_verification_trigger" BEFORE UPDATE ON "public"."workers_public" FOR EACH ROW EXECUTE FUNCTION "public"."protect_verification_fields"();



CREATE OR REPLACE TRIGGER "sync_address_location_trigger" BEFORE INSERT OR UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."sync_address_location"();



CREATE OR REPLACE TRIGGER "update_worker_rating_trigger" AFTER UPDATE OF "rating" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_worker_rating_stats"();



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers_public"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers_public"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."workers_public"
    ADD CONSTRAINT "workers_public_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Participants update bookings" ON "public"."bookings" FOR UPDATE USING ((((( SELECT "auth"."uid"() AS "uid") = "customer_id") AND ("status" = 'requested'::"text")) OR (( SELECT "auth"."uid"() AS "uid") = "worker_id")));



CREATE POLICY "Public can view active services" ON "public"."services" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public view reviews" ON "public"."reviews" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public view zip centroids" ON "public"."zip_centroids" FOR SELECT USING (true);



CREATE POLICY "Service role can do everything" ON "public"."otp_verifications" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert own worker profile" ON "public"."workers_public" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can rate completed bookings" ON "public"."bookings" FOR UPDATE USING ((("auth"."uid"() = "customer_id") AND ("status" = 'completed'::"text"))) WITH CHECK ((("auth"."uid"() = "customer_id") AND ("status" = 'completed'::"text") AND ("rating" IS NOT NULL)));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own worker profile" ON "public"."workers_public" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users create bookings" ON "public"."bookings" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "customer_id"));



CREATE POLICY "Users create reviews for own bookings" ON "public"."reviews" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "reviewer_id"));



CREATE POLICY "Users delete own addresses" ON "public"."addresses" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "customer_id"));



CREATE POLICY "Users insert own addresses" ON "public"."addresses" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "customer_id"));



CREATE POLICY "Users see own notifications" ON "public"."notifications" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users see own transactions" ON "public"."transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "transactions"."booking_id") AND ("b"."customer_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users update own addresses" ON "public"."addresses" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "customer_id"));



CREATE POLICY "Users update own notifications" ON "public"."notifications" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users view own addresses" ON "public"."addresses" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "customer_id"));



CREATE POLICY "View relevant bookings" ON "public"."bookings" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "customer_id") OR (( SELECT "auth"."uid"() AS "uid") = "worker_id") OR (("status" = 'requested'::"text") AND ("worker_id" IS NULL))));



CREATE POLICY "Worker profiles are viewable by everyone" ON "public"."workers_public" FOR SELECT USING (true);



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otp_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workers_public" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zip_centroids" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."accept_booking"("p_booking_id" "uuid", "p_worker_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_booking"("p_booking_id" "uuid", "p_worker_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_booking"("p_booking_id" "uuid", "p_worker_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_otps"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_otps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_otps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking"("service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "notes_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking"("service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "notes_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking"("service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "notes_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_booking"("customer_uuid" "uuid", "service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "preferred_worker_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking"("customer_uuid" "uuid", "service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "preferred_worker_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking"("customer_uuid" "uuid", "service_id_input" bigint, "address_id_input" "uuid", "scheduled_at_input" timestamp with time zone, "duration_minutes_input" integer, "preferred_worker_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_bookings"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_bookings_v2"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_bookings_v2"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_bookings_v2"("p_worker_id" "uuid", "p_limit" integer, "p_radius_km" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_requests"("p_worker_id" "uuid", "p_radius_meters" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_requests"("p_worker_id" "uuid", "p_radius_meters" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_requests"("p_worker_id" "uuid", "p_radius_meters" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."match_worker_for_booking"("booking_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."match_worker_for_booking"("booking_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_worker_for_booking"("booking_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."nearby_workers"("lat" double precision, "lng" double precision, "service_filter" "text", "radius_meters" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."nearby_workers"("lat" double precision, "lng" double precision, "service_filter" "text", "radius_meters" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."nearby_workers"("lat" double precision, "lng" double precision, "service_filter" "text", "radius_meters" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_verification_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_verification_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_verification_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_address_location"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_address_location"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_address_location"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_worker_rating_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_worker_rating_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_worker_rating_stats"() TO "service_role";























































































GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."otp_verifications" TO "anon";
GRANT ALL ON TABLE "public"."otp_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."workers_public" TO "anon";
GRANT ALL ON TABLE "public"."workers_public" TO "authenticated";
GRANT ALL ON TABLE "public"."workers_public" TO "service_role";



GRANT ALL ON TABLE "public"."zip_centroids" TO "anon";
GRANT ALL ON TABLE "public"."zip_centroids" TO "authenticated";
GRANT ALL ON TABLE "public"."zip_centroids" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































