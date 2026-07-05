import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
// NOTA: Para realizar UPDATEs dentro de la funcin, necesitamos una key con permisos.
// Podemos usar SUPABASE_ANON_KEY si RLS lo permite, o SERVICE_ROLE_KEY. Asumiremos ANON_KEY o lo pasamos si está configurado.
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || SUPABASE_ANON_KEY;

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!

webpush.setVapidDetails(
  "mailto:soporte@sigae.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2-lat1);  
  const dLon = deg2rad(lon2-lon1); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c * 1000; 
}
function deg2rad(deg: number) { return deg * (Math.PI/180); }

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    
    // El webhook debe configurarse para disparar ante INSERT en la tabla public.notificaciones_globales
    if (payload.type === "INSERT") {
      const row = payload.record
      
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
      
      // Obtener las suscripciones registradas para esta escuela
      const { data: subs } = await supabase
        .from("notificaciones_suscripciones")
        .select("*")
        .eq("escuela_codigo", row.escuela_codigo)
      
      const notifPayload = JSON.stringify({
        title: row.titulo,
        body: row.cuerpo,
        url: "/transporte"
      })

      if (subs && subs.length > 0) {
        const pushPromises = subs.map((sub: any) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }
          return webpush.sendNotification(pushSubscription, notifPayload)
            .catch((err: any) => {
               console.error("Error enviando push a", sub.endpoint, err)
               if (err.statusCode === 410 || err.statusCode === 404) {
                 // Suscripción inválida o expirada, eliminar de la BD
                 return supabase.from("notificaciones_suscripciones").delete().eq("endpoint", sub.endpoint)
               }
            })
        })
        await Promise.all(pushPromises)
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error: any) {
    console.error("Edge Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})