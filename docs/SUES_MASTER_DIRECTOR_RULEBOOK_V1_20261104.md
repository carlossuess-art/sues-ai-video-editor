# SUES MASTER DIRECTOR · Resolución de reglas en conflicto · 04/11/2026

El módulo src/master-director-rulebook.js separa reglas aprobadas de propuestas, documentos históricos y referencias. Nunca utiliza fechas para asumir que una regla está aprobada.

Cada regla tiene ID, clave semántica, ámbito, autoridad, estado, valor y lista explícita de reglas que sustituye. Las aprobaciones verificadas deben venir de un registro autenticado y ajeno al plan de la skill.

Ámbitos: global, marca, perfil, proyecto, escena y referencia. El modo brand-sues no importa automáticamente los fondos de una referencia. El modo reference-exact necesita ID autorizado y, para reemplazar una regla de marca incompatible, una sustitución aprobada y explícita.

Las prioridades siguen safety-and-rights, explicit-user-approval, locked-masters, project, profile, scene, pero nunca resuelven automáticamente un desacuerdo entre valores diferentes: debe haber una sustitución rastreable. Ninguna regla puede anular una prohibición de seguridad o derechos.

Resultados: READY con reglas seleccionadas o BLOCKED con razones y lista de conflictos pendientes. El módulo no determina por sí mismo qué documento de Drive fue realmente aprobado, no hace análisis de vídeos y todavía no está conectado al renderizador.

Pruebas: tests/master-director-rulebook.test.js. Integrar con el backend y con master-director-story solo después de confirmar reglas y su autenticación. La skill se adapta después de estabilizar estos contratos. No fusionado ni desplegado.