import { createBroswerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient() { 
    return createBroswerClient ( 
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 
    )
}