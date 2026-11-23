# SUES · Identidad musical emocional y firma sonora · Decisión 23/11/2026

Estado: DIRECCIÓN CREATIVA APROBADA POR CARLOS; 9 AUDIOS IMPORTADOS AL ALMACÉN NATIVO DE MEDIOS FABLECUT, PERO SIN ALTA EN project.media NI QA DE MEZCLA/PUBLICACIÓN. Aplica a SUES AI Film Director 1.7.1+, SUES MASTER DIRECTOR, FableCut nativo y biblioteca única SUES. Esta nota complementa las políticas previas; no autoriza un montaje concreto, edición de proyectos existentes, publicación ni despliegue.

## Actualización técnica comprobada tras la decisión · 23/11/2026

**VPS INGESTA FÍSICA TERMINADA:** 9/9 audios en `/srv/sues-fablecut-next/data/media`, por la API NATIVA `POST /api/import-url` de FableCut. 21.356.382 bytes totales. Siete MP3 tienen SHA256 idéntico a sus fuentes. Meditative e Intriga son Opus en contenedor MP4; `faststart` modificó metadatos/tamaño del contenedor (3.399.882→3.385.898 y 2.786.744→2.772.760), pero el hash SHA256 del flujo de audio coincidente fue comprobado contra las fuentes. Archivos renombrados en media con extensión .m4a correcta. Respuesta HTTP Range 206 de firma Soul Brass y Reggae verificada. Checkpoint físico VPS: `/srv/sues-fablecut-next/data/qa/sues-audio-dna-20261123/manifest.json` (propietario suesnle, 0640). Registro JSON reproducible en [inventario FableCut](engine-next/SUES_AUDIO_DNA_INVENTARIO_IMPORTACION_20261123.json).

**NO CONFUNDIR ESTADOS:** FableCut `/api/import-url` importa el archivo al almacén, pero su documentación exige un paso independiente de alta en `project.media`/MCP para que aparezca en la bandeja de un proyecto. Esta alta, asociación al catálogo compartido/Director, playback desde interfaz, fragmentos y mezcla continúan PENDIENTES. No se alteraron el proyecto 158404, Q03, V29 ni la producción para este trabajo. Originales Drive intactos.

## Decisión creativa

No existe cuota fija de ocho canciones ni se exige una por emoción. Se elegirán ~3 bases musicales de gran personalidad, más la composición Meditative para introspección cuando proceda. Cada Reel decide por guion, pausas, palabras, emoción y voz. Favorecer CONTRASTES AUDIBLES entre géneros, silencio, scratch DJ, cambios radicales intencionados, golpes de metales y ducking real, evitando decorar, interferir con voz, repetir efectos o retrasar el hook. Con sonido desactivado también debe funcionar el gancho visual. Firma reconocible pero variable según discurso.

Prioridades:
1. **FIRMA / HOOK SOUL BRASS — Midnight at the Plaza**, PRIORIDAD CRÍTICA aprobada. Brass/trumpetas + soul/funk como motivo inicial reconocible; probar fragmento corto ~1–2s sincronizado con primer impacto/voz, no forzar introducción larga. Drive ID 1YMkHGMwP_keW0LFi1wDr-e7xNetGeHVY, archivo PRIORITARIA_SUES_FIRMA_SONORA_ENTRADA_SOUL_BRASS_MIDNIGHT_AT_THE_PLAZA.mp3. Estado: ORIGINAL EN DRIVE; firma derivada/mezcla final AÚN NO APROBADA.
2. **LIBERACIÓN / SOLUCIÓN / ALEGRÍA / PROMESA / CTA — Gold in the Midday Heat**, PRIORIDAD CRÍTICA aprobada. Reggae-funk vital, puede cubrir tres estados del mismo Reel sin cortes innecesarios. Drive ID 1pWmn6f3IRpoNzFXwKC9gCKFDkdwNshA1, archivo PRIORITARIA_SUES_06-08_SOLUCION_ALEGRIA_CTA_REGGAE_FUNK_GOLD_IN_THE_MIDDAY_HEAT.mp3. Estado: ORIGINAL EN DRIVE.
3. **CONFLICTO / DOLOR / TENSIÓN / TRISTEZA**, base principal por ELEGIR (no fingir aprobación): Stillness Between Breaths (Drive 1iJ7lGCrax1FjuLPXOctd2oKHokKu7390) y The Unspoken Hour (Drive 1X3IA45a79R8XoHda3j4lrTD9iBMvJBHG). Pueden coexistir por necesidad narrativa. Jazz noir/blues fue propuesta de prueba, NO composición aprobada ni descargada.
4. **MEDITATIVE / INTROSPECTIVE** composición personal de Carlos con cuencos/agua, usada por él para meditar: conservar especial e intacta; introspección/calmas/transiciones. Drive ID 1zdcpCUKQom6ZmNPbEBB-RJaemo1Q6SZj, archivo SUES_04_MEDITATIVE_INTROSPECTIVA_CUENCOS_AGUA_ORIGINAL.m4a.

Alternativas, originales conservados: INTRIGA Drive 1RjnNBITAucFmcy8q_cMqZd9XYUC1j_gI; revelación expansiva Between Two Breaths Drive 10IuytZoejq0zHgLEz_VZDEzb5gl7HPIm; hip-hop A Promises at Daybreak Drive 1AvRVMrVOFbRkL-6yxGMMRtC9SDJkzggM (interferencia de voz por revisar); hip-hop B A Window Left Open Drive 1OSdnRgNjtFJYA0PVs7TUhehGLPHwDFC1 (vocales por revisar). El hip-hop es respaldo provisional, NO prioritario. No crear más pistas sin justificación de vacío real.

## Fuentes y rutas

Biblioteca original verificada (Drive, cuenta principal): https://drive.google.com/drive/folders/1KOfwjlnT3bOC0cyICf9cce0F2MAb07RU
Fragmentos / versiones, todavía pendiente: https://drive.google.com/drive/folders/1ixbWEEfEVXdQwA8HJRPB7K4g5_8VO_xA
Base de audio SUES: https://drive.google.com/drive/folders/1efBYJEEwR6rrVGaNqag93qySwhrYHzlx
Mantener recurso original, no renombrar IDs ni duplicar por Reel. Registrar procedencia exacta (Suno/Gemini/usuario), fecha de generación, licencia y términos de uso verificados. No suponer licencia comercial para Suno gratuito ni Gemini ni obras personales: validar derechos antes de publicación según usos previstos. Favorito es una selección creativa, NO prueba de licencia.

## Flujo previsto, EN COLA

A. En Film Director, leer esta nota y la skill vigente; detectar primero audios prioritarios por ID y consultar biblioteca en vez de pedir regeneración. Crear guía de fragmentos solo tras escucha y selección en contexto, con puntos de entrada/salida, BPM/energía, picos, regiones con voces espurias, conflictos con voz, transiciones y ducking.
B. Evaluar sistema existente de medios en FableCut único (sin duplicar NLE). En VPS srv1841004 existen `/srv/sues-fablecut-next/app` y `/srv/sues-fablecut-next/data/media` con acceso restringido al servicio `suesnle`. Diagnóstico VPS 23/11: 48GB totales, 46GB usados, ~1.8GB libres, 97% ocupado. `rclone` NO disponible. No escribir a data/media mediante una ruta improvisada; primero inspeccionar contrato real de importación/API, permisos, límite y espacio, elegir canal autenticado de transferencia privada. NO hacer públicos los Drive para copiarlos.
C. **Transferencia física realizada 9/9** mediante import-url nativo de FableCut. Verificado tamaño y hashes en VPS; 2 contenedores M4A reordenados sin alterar audio. Registro en project.media/catálogo, identidad resourceId, playback UI y QA siguen **PENDIENTES**. No imponer que existan activos en un proyecto aún no registrado.
D. Preparar derivados NO destructivos (posibles ~30s por segmento, no cuota fija), 2–3 scratches entre estados si aporta; guardar en carpeta 07 de Drive y en biblioteca FableCut como nuevas referencias derivadas con referencia al original. Auditar bucles, saltos, voz inteligible, silencios, corte a frame, ducking y loudness. Derivados: PENDIENTES.
E. Asociar activos verificables al plan humano A/V y al JSON `sues-master-story/v1` solo con schema/HEAD real verificados, recurso IDs y SHA. Toda capacidad ausente permanece en anexo técnico NO IMPORTABLE; nunca enviar JSON simulado ni tocar Q03/V29 publicados/activos.
F. QA musical y audiovisual sobre UN NUEVO Reel aprobado por Carlos; dos revisiones, comparación real de audio y vídeo, aprobación creativa separada de publicación.

## Checklist de seguimiento

- [x] Decisión creativa de 3 bases + Meditative aprobada.
- [x] Originales 8 pistas + Midnight at the Plaza alojados en Drive privado (verificar listado vigente antes de operar).
- [x] Prioridad de Soul Brass y Reggae-funk marcada en nombre Drive.
- [ ] Elección final entre bases tensión/tristeza y control de vocales intrusas.
- [ ] Auditoría derechos/licencias/pistas originales.
- [ ] Ruta técnica autorizada y segura de importación FableCut; limpieza de disco segura SOLO con protocolo de backups.
- [x] Transferencia privada al almacén de medios VPS; SHA y ffprobe verificados (9 pistas, sin inscripción en proyecto).
- [ ] Alta nativa de las pistas en project.media / catálogo de recursos, reproducción UI y prueba en un proyecto QA aislado.
- [ ] Selección de fragmentos y scratch/transiciones + normalización/ducking.
- [ ] Integración de IDs de recursos en catálogo Master Director/FableCut.
- [ ] Reel de prueba, dos pasadas QA, aprobación humana.
