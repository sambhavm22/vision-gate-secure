import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export interface Service {
    id: number;
    name: string;
    base_price: number;
}

export function useServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchServices() {
            const { data, error } = await supabase
                .from("services")
                .select("id, name, base_price")
                .eq("is_active", true);

            if (error) {
                console.error("Error fetching services:", error);
            } else {
                setServices(data || []);
            }
            setIsLoading(false);
        }

        fetchServices();
    }, []);

    return { services, isLoading };
}
