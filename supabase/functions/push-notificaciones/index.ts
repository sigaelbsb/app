import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!

webpush.setVapidDetails(
  "mailto:soporte@sigae.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    // payload viene del webhook de supabase (insert/update en transporte_operaciones)
    
    if (payload.type === "UPDATE" || payload.type === "INSERT") {
      const row = payload.record
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      
      // Obtener todas las suscripciones de la escuela afectada
      const { data: subs, error } = await supabase
        .from("notificaciones_suscripciones")
        .select("*")
        .eq("escuela_codigo", row.escuela_codigo)
      
      if (error) throw error

      let titulo = "?? Transporte Escolar"
      let cuerpo = "El bus está ahora en " + row.ubicacion_actual
      
      if (payload.type === "INSERT" && row.estado === "En Ruta") {
        titulo = "?? Inicio de Ruta"
        cuerpo = "El transporte ha iniciado su recorrido hacia las paradas."
      } else if (row.estado === "Finalizado") {
        titulo = "?? Ruta Finalizada"
        cuerpo = "El transporte ha llegado a su destino."
      }

      const notifPayload = JSON.stringify({
        title: titulo,
        body: cuerpo,
        url: "/transporte"
      })

      const pushPromises = (subs || []).map((sub: any) => {
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
               // Subscripción expirada o inválida, borrar de la BD
               return supabase.from("notificaciones_suscripciones").delete().eq("endpoint", sub.endpoint)
             }
          })
      })

      await Promise.all(pushPromises)
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
