const supabaseUrl = 'https://nbsrlauuugxfcgjavfve.supabase.co';
const supabaseKey = 'sb_publishable_5fWhLgihhav9Vu-t2HdyYg_pnayrzg7';

const DICCIONARIO = [
  {
    tema: "PEIC (Proyecto Educativo Integral Comunitario)",
    palabras_clave: ["peic", "proyecto educativo integral comunitario", "que es peic", "significado de peic", "definicion de peic"],
    respuesta: "<b>PEIC (Proyecto Educativo Integral Comunitario)</b>:<br/><br/>Es un proyecto institucional de carácter pedagógico, social y comunitario que define las metas, directrices y acciones de una escuela basándose en las necesidades y potencialidades de su comunidad y entorno."
  },
  {
    tema: "PA (Proyecto de Aprendizaje)",
    palabras_clave: ["pa", "proyecto de aprendizaje", "que es pa", "significado de pa", "definicion de pa", "proyectos de aprendizaje"],
    respuesta: "<b>PA (Proyecto de Aprendizaje)</b>:<br/><br/>Es una estrategia pedagógica de planificación didáctica que el docente diseña para integrar los contenidos de las distintas materias partiendo de los intereses, necesidades y curiosidades de los estudiantes."
  },
  {
    tema: "CRA (Centro de Recursos para el Aprendizaje)",
    palabras_clave: ["cra", "centro de recursos para el aprendizaje", "biblioteca", "bibliotecas", "que es cra", "significado de cra", "definicion de cra"],
    respuesta: "<b>CRA (Centro de Recursos para el Aprendizaje)</b>:<br/><br/>Es el espacio dentro de los planteles educativos (antiguamente llamado biblioteca escolar) destinado al uso de libros, computadoras, mapas y herramientas pedagógicas para la investigación escolar y el fomento de la lectura."
  },
  {
    tema: "OBE (Organización Bolivariana de Estudiantes)",
    palabras_clave: ["obe", "organizacion bolivariana de estudiantes", "movimiento estudiantil", "estudiantes", "que es obe", "significado de obe", "definicion de obe"],
    respuesta: "<b>OBE (Organización Bolivariana de Estudiantes)</b>:<br/><br/>Es el movimiento estudiantil que representa y defiende los derechos, participación ciudadana y vocería de los alumnos de educación media general y técnica en los liceos venezolanos."
  },
  {
    tema: "MBF (Movimiento Bolivariano de Familias)",
    palabras_clave: ["mbf", "movimiento bolivariano de familias", "familias", "padres", "representantes", "que es mbf", "significado de mbf", "definicion de mbf"],
    respuesta: "<b>MBF (Movimiento Bolivariano de Familias)</b>:<br/><br/>Es una organización que agrupa a padres, madres y representantes en las escuelas con el fin de promover su corresponsabilidad y participación activa en los proyectos y el mantenimiento escolar."
  },
  {
    tema: "LOPNNA (Ley Orgánica para la Protección de Niños, Niñas y Adolescentes)",
    palabras_clave: ["lopnna", "ley organica para la proteccion de ninos ninas y adolescentes", "proteccion del menor", "convivencia escolar", "que es lopnna", "significado de lopnna", "definicion de lopnna"],
    respuesta: "<b>LOPNNA (Ley Orgánica para la Protección de Niños, Niñas y Adolescentes)</b>:<br/><br/>Es la ley venezolana que consagra y defiende los derechos y deberes de todos los menores de 18 años, la cual norma los acuerdos de convivencia de los estudiantes y la disciplina en los liceos."
  },
  {
    tema: "LOE (Ley Orgánica de Educación)",
    palabras_clave: ["loe", "ley organica de educacion", "ley de educacion", "leyes educativas", "que es loe", "significado de loe", "definicion de loe"],
    respuesta: "<b>LOE (Ley Orgánica de Educación)</b>:<br/><br/>Es el instrumento legal que establece las directrices, principios, fines y bases del subsistema educativo nacional venezolano."
  },
  {
    tema: "Lapsos Académicos / Momentos Pedagógicos",
    palabras_clave: ["lapso", "lapsos", "momentos", "momentos pedagogicos", "periodos escolares", "lapso academico", "momento pedagogico"],
    respuesta: "<b>Lapsos Académicos / Momentos Pedagógicos</b>:<br/><br/>Son los períodos trimestrales en los que se organiza el año escolar venezolano para las evaluaciones y calificaciones. Consta de 3 momentos pedagógicos en el calendario escolar."
  },
  {
    tema: "Momento Pedagógico",
    palabras_clave: ["momento pedagogico", "momentos pedagogicos", "periodo de evaluacion", "momentos de evaluacion"],
    respuesta: "<b>Momento Pedagógico</b>:<br/><br/>Denominación oficial del Ministerio de Educación (MPPE) para cada uno de los tres períodos de evaluación didáctica y administrativa (lapsos) que conforman el año escolar."
  },
  {
    tema: "Vocero / Vocería Estudiantil",
    palabras_clave: ["vocero", "vocera", "vocerias", "vocero estudiantil", "vocera estudiantil", "que es vocero", "definicion de vocero"],
    respuesta: "<b>Vocero / Vocería Estudiantil</b>:<br/><br/>Estudiante electo de forma democrática por sección para representar la opinión, necesidades y propuestas de sus compañeros ante el colectivo docente e institucional."
  },
  {
    tema: "Zona Educativa",
    palabras_clave: ["zona educativa", "zonas educativas", "mppe regional", "que es zona educativa", "definicion de zona educativa"],
    respuesta: "<b>Zona Educativa</b>:<br/><br/>Oficina estatal adscrita al Ministerio del Poder Popular para la Educación (MPPE) que coordina y ejecuta las directrices de políticas públicas de educación en cada estado del país."
  },
  {
    tema: "PAE (Programa de Alimentación Escolar)",
    palabras_clave: ["pae", "programa de alimentacion escolar", "comedor", "alimentacion", "comida escolar", "que es pae", "significado de pae", "definicion de pae"],
    respuesta: "<b>PAE (Programa de Alimentación Escolar)</b>:<br/><br/>Es el programa bandera del Ministerio de Educación en Venezuela que garantiza una alimentación diaria, sana, balanceada y gratuita a las y los alumnos de planteles públicos."
  },
  {
    tema: "Consejo Educativo",
    palabras_clave: ["consejo educativo", "consejos educativos", "gestion escolar", "que es consejo educativo", "definicion de consejo educativo"],
    respuesta: "<b>Consejo Educativo</b>:<br/><br/>Órgano colegiado formado por directivos, docentes, obreros, administrativos, padres y estudiantes que asume de manera conjunta la planificación, ejecución y contraloría de la gestión escolar."
  },
  {
    tema: "Colectivo Pedagógico",
    palabras_clave: ["colectivo pedagogico", "colectivos pedagogicos", "reunion de docentes", "planificacion docente", "que es colectivo pedagogico"],
    respuesta: "<b>Colectivo Pedagógico</b>:<br/><br/>Espacio semanal o quincenal de autoformación, evaluación colectiva y planificación escolar donde los docentes del plantel debaten y acuerdan las mejoras para la enseñanza."
  },
  {
    tema: "MPPE (Ministerio del Poder Popular para la Educación)",
    palabras_clave: ["mppe", "ministerio de educacion", "ministerio del poder popular para la educacion", "ente rector", "que es mppe", "significado de mppe"],
    respuesta: "<b>MPPE (Ministerio del Poder Popular para la Educación)</b>:<br/><br/>El Ministerio de Educación de Venezuela, ente rector nacional que formula y ejecuta las políticas del sistema educativo básico."
  },
  {
    tema: "Educación Media General",
    palabras_clave: ["media general", "bachillerato general", "bachiller", "bachillerato", "educacion media general"],
    respuesta: "<b>Educación Media General</b>:<br/><br/>Nivel de bachillerato general regular que dura cinco años escolares (de 1° a 5° año) y otorga el título de Bachiller de la República."
  },
  {
    tema: "Educación Media Técnica",
    palabras_clave: ["media tecnica", "bachillerato tecnico", "tecnico medio", "educacion media tecnica"],
    respuesta: "<b>Educación Media Técnica</b>:<br/><br/>Bachillerato especializado de seis años escolares (de 1° a 6° año) enfocado en preparar profesionalmente al estudiante en sectores industrial, comercial, salud o agropecuario, otorgando el título de Técnico Medio."
  },
  {
    tema: "Liceo",
    palabras_clave: ["liceo", "liceos", "secundaria", "instituto de bachillerato"],
    respuesta: "<b>Liceo</b>:<br/><br/>Nombre común que reciben los planteles educativos de educación media general y técnica en Venezuela."
  },
  {
    tema: "Proyecto Canaima Educativo",
    palabras_clave: ["canaima", "proyecto canaima", "computadora canaima", "tableta canaima", "canaimas"],
    respuesta: "<b>Proyecto Canaima Educativo</b>:<br/><br/>Programa tecnológico escolar del Estado venezolano que distribuye computadoras portátiles ('Canaimitas') y tabletas con contenido didáctico interactivo a estudiantes y docentes."
  },
  {
    tema: "Canaimita",
    palabras_clave: ["canaimita", "computadora canaima escolar", "portatil escolar"],
    respuesta: "<b>Canaimita</b>:<br/><br/>Computadora portátil escolar entregada por el Estado a estudiantes venezolanos como parte de los recursos de aprendizaje tecnológicos."
  },
  {
    tema: "Colección Bicentenario",
    palabras_clave: ["coleccion bicentenario", "libros bicentenario", "libros oficiales", "libros del ministerio"],
    respuesta: "<b>Colección Bicentenario</b>:<br/><br/>Serie oficial de libros de texto de distribución gratuita editados por el MPPE para las diferentes asignaturas y niveles de educación básica."
  },
  {
    tema: "Carga Familiar",
    palabras_clave: ["carga familiar", "cargas familiares", "hijos", "dependientes", "registro de familiares"],
    respuesta: "<b>Carga Familiar</b>:<br/><br/>Conjunto de personas (hijos, cónyuge, padres dependientes) registradas bajo la responsabilidad del trabajador para sus beneficios de seguridad social y convenciones colectivas."
  },
  {
    tema: "Estatus Laboral",
    palabras_clave: ["estatus laboral", "condicion laboral", "activo", "jubilado", "contratado", "incapacitado"],
    respuesta: "<b>Estatus Laboral</b>:<br/><br/>Condición administrativa del personal docente, administrativo u obrero del plantel (Activo, Contratado, Jubilado, Incapacitado o en Comisión de Servicio)."
  },
  {
    tema: "Matrícula Inicial",
    palabras_clave: ["matricula inicial", "inscritos al inicio", "estudiantes al inicio"],
    respuesta: "<b>Matrícula Inicial</b>:<br/><br/>Total de estudiantes registrados formalmente inscritos al inicio del año escolar académico."
  },
  {
    tema: "Matrícula Final",
    palabras_clave: ["matricula final", "promovidos", "desertores", "reprobados al final"],
    respuesta: "<b>Matrícula Final</b>:<br/><br/>Total de estudiantes registrados al culminar el periodo escolar, reportando promovidos, no promovidos y desertores."
  },
  {
    tema: "Consejo de Sección",
    palabras_clave: ["consejo de seccion", "consejos de seccion", "evaluacion de seccion", "reunion de notas"],
    respuesta: "<b>Consejo de Sección</b>:<br/><br/>Reunión formal de los docentes de un grupo/año con el orientador y el equipo directivo para evaluar el progreso académico, asistencia y conducta de los estudiantes al cierre de cada lapso o año escolar."
  },
  {
    tema: "Boletín Informativo",
    palabras_clave: ["boletin", "boletin informativo", "boletines", "boleta de notas", "boleta"],
    respuesta: "<b>Boletín Informativo</b>:<br/><br/>Reporte oficial y periódico entregado a padres y representantes al finalizar cada lapso pedagógico con las calificaciones cuantitativas y apreciaciones del estudiante."
  },
  {
    tema: "Plan de Evaluación",
    palabras_clave: ["plan de evaluacion", "planes de evaluacion", "evaluaciones planificadas", "ponderacion de notas"],
    respuesta: "<b>Plan de Evaluación</b>:<br/><br/>Planificación formal estructurada por el docente a inicio del lapso donde se detallan fechas, contenidos, técnicas e instrumentos de evaluación con sus respectivas ponderaciones."
  },
  {
    tema: "Plan de Formación",
    palabras_clave: ["plan de formacion", "planes de formacion", "capacitacion docente", "talleres de docentes"],
    respuesta: "<b>Plan de Formación</b>:<br/><br/>Cronograma e iniciativas de capacitación profesional y metodológica continua diseñados para actualizar los colectivos docentes del plantel."
  },
  {
    tema: "Efemérides Escolares",
    palabras_clave: ["efemerides", "efemerides escolares", "fechas patrias", "efemerides del mes"],
    respuesta: "<b>Efemérides Escolares</b>:<br/><br/>Fechas patrias, históricas, culturales o conmemorativas nacionales e internacionales que forman parte de la planificación pedagógica mensual y se celebran en la institución."
  },
  {
    tema: "Ficha de Inscripción",
    palabras_clave: ["ficha de inscripcion", "ficha", "fichas de inscripcion", "registro de inscripcion"],
    respuesta: "<b>Ficha de Inscripción</b>:<br/><br/>Documento oficial del plantel donde se asientan todos los datos personales, de salud, sociodemográficos e históricos del estudiante y su representante al formalizar el cupo escolar."
  }
];

async function main() {
  try {
    // 1. Fetch current items in sigma_conocimiento to check duplicates
    const getUrl = `${supabaseUrl}/rest/v1/sigma_conocimiento?select=id,tema`;
    const getResponse = await fetch(getUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch current knowledge items: ${await getResponse.text()}`);
    }
    
    const currentItems = await getResponse.json();
    const itemsMap = new Map();
    currentItems.forEach(item => {
      itemsMap.set(item.tema.toLowerCase().trim(), item.id);
    });

    console.log(`Checking and inserting ${DICCIONARIO.length} glossary terms...`);

    for (const term of DICCIONARIO) {
      const termKey = term.tema.toLowerCase().trim();
      const payload = {
        tema: term.tema,
        palabras_clave: term.palabras_clave,
        respuesta: term.respuesta,
        accion_tipo: null,
        accion_valor: null,
        roles_permitidos: []
      };

      if (itemsMap.has(termKey)) {
        // Update
        const id = itemsMap.get(termKey);
        const updateUrl = `${supabaseUrl}/rest/v1/sigma_conocimiento?id=eq.${id}`;
        const response = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          console.error(`Failed to update ${term.tema}:`, await response.text());
        } else {
          console.log(`Updated: ${term.tema}`);
        }
      } else {
        // Insert
        const insertUrl = `${supabaseUrl}/rest/v1/sigma_conocimiento`;
        const response = await fetch(insertUrl, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify([payload])
        });
        if (!response.ok) {
          console.error(`Failed to insert ${term.tema}:`, await response.text());
        } else {
          console.log(`Inserted: ${term.tema}`);
        }
      }
    }
    console.log("Done inserting all dictionary items to database!");
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main();
