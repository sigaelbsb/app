import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://nbsrlauuugxfcgjavfve.supabase.co', 'sb_publishable_5fWhLgihhav9Vu-t2HdyYg_pnayrzg7');

async function testInsert() {
  const insertPayload = {
    acepta_terminos: false,
    estudiante_nombres: "",
    estudiante_apellidos: "",
    estudiante_cedula: "",
    estudiante_fecha_nacimiento: "1900-01-01",
    estudiante_sexo: "",
    estudiante_orden_nacimiento: "",
    estudiante_condicion_neuro: "Neurotípico",
    estudiante_tipo_condicion: "",
    estudiante_informe_neuro: false,
    estudiante_certificado_conapdis: false,
    estudiante_condicion_medica: "Ninguna",
    estudiante_alergico_medicamentos: "Ninguna",
    grado_solicitado: "",
    parentesco: "",
    plantel_procedencia: "",
    direccion_habitacion: "",
    estado_habitacion: "",
    municipio_habitacion: "",
    parroquia_habitacion: "",
    tiene_otros_inscritos: false,
    representante_nombres: "",
    representante_apellidos: "",
    representante_cedula: "V-12345678",
    representante_telefono: "",
    representante_telefono2: "",
    representante_email: "",
    representante_parentesco: "",
    representante_trabaja_pdvsa: false,
    pdvsa_condicion_laboral: "",
    pdvsa_tipo_nomina: "",
    pdvsa_negocio_filial: "",
    pdvsa_gerencia: "",
    pdvsa_email_empresa: "",
    pdvsa_localidad_trabajo: "",
    madre_cedula: "",
    madre_email: "",
    madre_trabaja_pdvsa: false,
    requiere_transporte: false,
    ruta_transporte: "",
    doc_ficha: "",
    doc_foto_estudiante: "",
    doc_partida_nacimiento: "",
    doc_cedula_estudiante: "",
    doc_partida_trabajador: undefined,
    doc_partida_nexo: undefined,
    codigo_escuela: "sb",
    estado: "Borrador",
    creado_por: "V-12345678",
    codigo_unico: "TEST-34567"
  };

  const { data, error } = await supabase.from('solicitud_cupos').insert(insertPayload).select().single();
  if (error) {
    console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS:", data.id);
  }
}

testInsert();
