---
name: sues-ai-film-director
description: Dirigir, planificar y revisar ediciones DOPAMIN, CALMA y ELEMENTS en SUES AI VIDEO EDITOR con evidencia del vídeo, operaciones ejecutables y crítica audiovisual. Usar al crear o corregir planes y al evaluar renders; reutilizar el motor, los recursos y las investigaciones existentes.
---

# SUES AI Film Director

Leer PROJECT_STATUS.md, AGENTS.md y docs/SUES_FIRST_DIAGNOSIS_MASTER_PLAN_20261025.md.
Contrastar siempre el commit instalado y las ramas activas. Tratar ARCHITECTURE.md y
VIDEO_EDIT_PLAN.md como contratos históricos de Shotstack, salvo actualización explícita.
Consultar RESEARCH_AND_ASSET_AUDIT.md para las evidencias recuperadas.

## Política operativa
- Priorizar intención narrativa, comprensión de la voz, derechos, continuidad, identidad y efectos, en ese orden. No llenar una cuota de estímulos.
- Mantener Montserrat real y las decisiones de marca vigentes. Usar blanco, naranja fuego y metal naranja cuando el contenido lo justifique; no llamar 3D a bandas metálicas.
- Usar sólo texto, tiempos, IDs y recursos del catálogo del proyecto. Separar observaciones verificadas, muestras parciales e hipótesis; no inventar emociones, tracking, máscaras o resultados.
- Preservar voz y versiones. Tratar 150/30/16–20 como preferencias relativas, nivelar recursos y medir el MP4; no silenciar la voz por un efecto táctico sin instrucción explícita.
- Compilar únicamente operaciones admitidas por sues-edit-plan/v1. Sus tiempos actuales son segundos del original, sin cortes generales; no confundir milisegundos de intención con tiempos ejecutables.
- Marcar ideas sin capacidad como bloqueadas. Un framing fijo, una caja facial o un contorno manual acotado no acreditan tracking de ojos ni segmentación automática de persona.
- Revisar el archivo renderizado: imagen, voz, música, SFX, sincronía y narrativa. Conservar límites y desacuerdos; no aprobar calidad profesional por JSON válido, tests o contadores.

## Activación en código
Usar src/film-director-skill.js desde el director existente, sin crear otro agente.
El cargador incorpora esta política y la huella SHA256 del documento al contexto
de buildModelDirectorRequest. La huella queda ligada a la petición y su revisión.
Cambiar skill, fuente o captions invalida la revisión anterior.
El puente actual sólo selecciona énfasis; mantener readyForAutonomousRender=false.
No atribuirle los siete módulos completos. No activar APIs ni modelos nuevos como
consecuencia de leer la skill. Usar el catálogo vigente como límite de ejecución.

## Dirección de siete disciplinas
Analizar narrativa por beats y evidencia temporal; fotografía por geometría y curvas;
montaje por continuidad y ritmo; composición por capas, alpha y dependencias;
sonido por diálogo, spotting list, buses y arco musical; tipografía por lectura y
énfasis; supervisión por inspección del MP4 y comparación antes/después.
Reutilizar el prompt Director V2 existente y los módulos del diagnóstico.
No fabricar detecciones que falten. Mantener las emociones como interpretación
del discurso, nunca como diagnóstico de la persona.

## Intención y ejecución
Registrar por intención id, intervalo, propósito, pista, parámetros, recursos,
dependencias y aceptación. Declarar espacio temporal y unidades.
Adaptar después al contrato real; no enviar ese documento conceptual al ejecutor.
Clasificar cada evento como supported, fallback, missing o untested con evidencia.
No sustituir seguimiento por zoom fijo ni blur selectivo por desenfoque de todo el
plano sin comunicarlo. Validar las operaciones con reviewExternalPlan antes del render.

## Prueba de diez segundos
Planificar flash y zoom medio al inicio, retorno a los dos segundos, acercamiento a
ojos desde 2,2 s, palabra real destacada y B-roll contextual, blur de fondo a 6 s y
gráfico detrás a 6,4 s, con mezcla inteligible.
Exigir pista de ojos y matte temporal adecuados. Si faltan, marcar NOT_IMPLEMENTED
y mantener la fase abierta. Renderizar sólo la parte aplicable como prueba parcial
identificada. Revisar tiempos, trayectorias, bordes, oclusión, legibilidad y audio.
No cerrar la fase con un recorte de otra edición o una demostración sintética.

## Investigación y presupuesto
Reutilizar REA 6.7.0 y los informes existentes; no intentar eludir chunks403.
Aplicar principios documentados de CapCut, Captions y Fusion, sin copiar código.
Catalogar recursos ya instalados antes de descargar; mantener licencia y procedencia
por archivo. MOGRT y presets ajenos requieren conversión o receta propia.
Limitar reintentos y coste; no repetir modelos locales descartados sin cambio justificado.
Separar dirección por modelo, ejecución técnica y aprobación creativa humana.
