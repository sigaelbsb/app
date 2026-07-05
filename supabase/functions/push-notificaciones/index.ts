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
    
    if (payload.type === "UPDATE" || payload.type === "INSERT") {
      const row = payload.record
      const oldRow = payload.old_record || {}
      
      // Evitar bucles infinitos: Si es update y no cambió ni ubicación ni estado, salir.
      if (payload.type === "UPDATE") {
        if (row.ubicacion_actual === oldRow.ubicacion_actual && row.estado === oldRow.estado) {
          return new Response(JSON.stringify({ message: "Ignorado (sin cambios reales)" }), { headers: { "Content-Type": "application/json" } });
        }
      }

      const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
      
      let titulo = ""
      let cuerpo = ""
      let paradaAlcanzada = null

      if (payload.type === "INSERT" && row.estado === "En Ruta") {
        titulo = "🟢 Inicio de Ruta"
        cuerpo = "El transporte ha iniciado su recorrido."
      } else if (row.estado === "Finalizado" && oldRow.estado !== "Finalizado") {
        titulo = "🏁 Ruta Finalizada"
        cuerpo = "El transporte ha llegado a su destino."
      } else if (row.estado === "En Ruta" && row.ubicacion_actual) {
        // Calcular distancias
        const coords = row.ubicacion_actual.split(",");
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          
          const { data: paradas } = await supabase
            .from("transporte_paradas")
            .select("*")
            .eq("ruta_id", row.ruta_id)
            .eq("escuela_codigo", row.escuela_codigo);
          
          if (paradas) {
            let paradasA: string[] = [];
            if (typeof row.paradas_alcanzadas === "string") {
              try { paradasA = JSON.parse(row.paradas_alcanzadas) } catch(e){}
            } else if (Array.isArray(row.paradas_alcanzadas)) {
              paradasA = row.paradas_alcanzadas;
            }

            for (const p of paradas) {
              if (paradasA.includes(p.id)) continue; // Ya notificada
              if (!p.ubicacion) continue;
              const pCoords = p.ubicacion.split(",");
              if (pCoords.length === 2) {
                const dist = getDistanceFromLatLonInMeters(lat, lng, parseFloat(pCoords[0]), parseFloat(pCoords[1]));
                if (dist <= 300) {
                  // Alcanzó la parada!
                  titulo = "🚍 En Parada: " + p.nombre_parada;
                  cuerpo = "El transporte se encuentra en " + p.nombre_parada;
                  paradaAlcanzada = p.id;
                  paradasA.push(p.id);
                  // Actualizar BD (esto disparará otro webhook pero se bloqueará arriba)
                  await supabase.from("transporte_operaciones").update({ paradas_alcanzadas: paradasA }).eq("id", row.id);
                  break; // Notificar solo una por vez
                }
              }
            }
          }
        }
      }

      if (titulo !== "") {
        // Insertar en historial permanente
        await supabase.from("notificaciones_globales").insert({
          escuela_codigo: row.escuela_codigo,
          titulo: titulo,
          cuerpo: cuerpo,
          tipo: "transporte"
        });

        // Obtener suscripciones para Push
        const { data: subs } = await supabase
          .from("notificaciones_suscripciones")
          .select("*")
          .eq("escuela_codigo", row.escuela_codigo)
        
        const notifPayload = JSON.stringify({
          title: titulo,
          body: cuerpo,
          url: "/transporte"
        });

        if (subs) {
          const pushPromises = subs.map((sub: any) => {
            const pushSubscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }
            return webpush.sendNotification(pushSubscription, notifPayload)
              .catch((err: any) => {
                 if (err.statusCode === 410 || err.statusCode === 404) {
                   return supabase.from("notificaciones_suscripciones").delete().eq("endpoint", sub.endpoint)
                 }
              })
          })
          await Promise.all(pushPromises)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})