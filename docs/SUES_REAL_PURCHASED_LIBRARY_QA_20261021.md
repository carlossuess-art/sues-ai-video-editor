# SUES AI VIDEO EDITOR · Primera integración real de banco cinematográfico (21/10/2026)

## Qué se ha recuperado de lo comprado

No se ha redescargado Creator Club ni se han comprado recursos. Cuenta origen Google Drive `terapiasholisticassues@gmail.com`, con derechos de uso declarados contractualmente por Carlos para producción propia y biblioteca privada:

1. `clock (1).mp4`, ID Drive `1RE389zgD9KGJQ4NZMj6pQjf_ED15A9Rz`: reloj analógico RADIO CONTROLLED en primerísimo plano, 19,600 s, MPEG-4 1920×1080 a 25 fps, 8.938.314 bytes, SHA-256 `8f2cd474490e0b22b9cbb9aa3701ac0676c532c5e77c4a67f18c696113998c32`. Nombre español: **Reloj analógico en primer plano · presión del tiempo**. B-roll de tiempo/espera/urgencia. Inspección visual de fotogramas 4s/11s real.
2. `Sparks Pack 28.mp4`, Drive `1bbjaVdIfS01pOTVnx5ycgBZvoL0yAala`: chispas cálidas sobre fondo negro, 1,433 s, MPEG-4 1920×1080 a 30 fps, 883.096 bytes, SHA `4d893b5a7b857886a678dc221ed99e04af4dd1680b0c1e35004ba0730bee3fe1`. Nombre español: **Chispas doradas · partículas breves · revelación**. Inspección fotograma 0.6s real.
3. `Blue light Leak.mov`, Drive `15cme4W7Eur3GuygR0uZRZ-08qt7_jPP3`: efecto de luz fría vertical 720×1280, 25,215 s, H264/AAC, 1.437.361 bytes, SHA `549ff090da3ee87c97e53fa06004e75879f3053d59945ca9f0f8f6d334980600`. RECUPERADO PARA QA en el VPS pero **no integrado como recurso operativo**, pendiente selección de fotogramas realmente útiles.

Archivos originales en Drive intactos. Estas tres recuperaciones usaron copias autenticadas del Drive conectado y verificación por SHA en origen/destino. Ningún otro archivo antiguo descargado. El catálogo histórico mantiene 309 archivos localizados en sus cuentas originales, con muchas posibles variantes MOV/MP4.

## Instalación privada verificada (medios, no nuevo código desplegado)

Se incorporaron solo los dos primeros a `/opt/sues-video-setup/editor/jobs/assets` a través del validador `MediaLibrary.receive` del editor y `saveMetadata`:
- `video` para reloj, `overlay` para chispas. Ambos incluyen ID SHA estable, duración, tamaño, fps, título español, emociones, roles narrativos, estilos, condiciones de uso y origen Drive individual.
- `lifecycle: integrated`, `approvedForProduction:false`, `rightsStatus:unverified` por no disponer del texto de contrato para licenciar originales a terceros. Los derechos privados declarados por titular se conservan sin extenderlos a reventa.
- Banco previo: 13 SFX intactos. Después: 13 SFX + 1 video + 1 overlay, 15 objetos multimedia. Índice `official-library-v1.json` refleja ahora 19 registros incluyendo cuatro motions nativos. No confundir los 309 externos con los 2 efectivamente incorporados.
- Backup previo: `/opt/sues-video-setup/library-backups/20261021-asset-before-real/assets-before-real.tar`, SHA256 `990afe03b916f4514d782502931a5f52be92e713d1914fd38395b5f5da78da3f`, incluye 13 SFX preexistentes (2.2MB) y fichas. Backup adicional del índice anterior guardado sin sobrescribir.

## Reel de prueba REAL (isolated QA, no nueva suscripción ni ejecución en trabajos de Carlos)

Fuente original existente de 12.979956 s con voz y 4 grupos de captions. B-roll **comprado real** del reloj insertado del segundo 5 al 8, empezando 4.5s en el archivo de reloj. WHOOSH comprado que ya existía en el editor, ID `83080116eb4b4551c7ff4a638ed3855030250278af7dd735a39f0a3b3edb2ea2` a los 4.75s con gain 0.22. Presets de voz existentes: eco 1.1–3.1, televisión 8.6–10.5s. Reel exportado con FFmpeg 1080×1920, 30fps, duración 12.966667s, voz/SFX/captions presentes, `fullDecode PASS`, preservación de originales y SHA de fuentes comprobado.

Se hizo otra exportación con **chispas reales en capa transparente desde fondo negro** en el intervalo 9.15–10.4s e intensidad 0.22; input fuente 0.05s. El motor nuevo experimental las limita a mitad inferior, separa audio del recurso y coloca captions después. La exportación pasó `fullDecode`, B-roll=1, overlay=1, SFX=1, voice presets=2, captions=4.

**QA visual negativa para aprobar estética**: el vídeo de origen de esta prueba se adapta a vertical con grandes franjas negras, y las chispas de mitad inferior caen parcialmente en la franja negra. Se han revisado dos fotogramas de la salida en vez de confiar solamente en el render técnico. No se declara efecto "por detrás del sujeto" ni rotoscopia. Requiere una fuente vertical de cara/persona y máscara/oclusiones reales para aceptar V1.

## Mejora de margen del audio — solo en rama de desarrollo

`masteringEnabled` es opción explícita (desactivada por defecto para no alterar versiones previas), mezcla con `volume=-1.8dB` al final y limitador `alimiter`, sin tocar subtítulos ni edición. En Reel QA:
- Antes: **−15.7 LUFS integrados; −0.1 dBTP**.
- Después: **−17.5 LUFS; −1.7 dBTP**, medido tras AAC mediante FFmpeg EBU R128. No hay saturación de pico verdadero en la muestra revisada.
- Es seguridad de margen, NO dos pasadas de loudness mastering ni certificación de calidad profesional para todas las voces. Se requiere escucha humana y revisar otros perfiles.

## Desarrollo nuevo y pruebas

Rama `feat/library-ambient-overlays-mastering-20261021` independiente de producción anterior `56b686ff3bc284431528f2612219115632d4670a`.
Nuevos eventos `overlayEvents` (máximo 2, 0.4–2.5s, intensidad 0.05–0.35), filtro cromático de fondo negro y opacidad inferior bajo captions; su posición no sigue rostro, requiere QA. Compatibilidad del renderizador, ffprobe y hashes, portabilidad de copias, instrucciones de Gemini en `sues-edit-plan/v1` tipo `overlay` y `mastering`, metadatos semánticos privados ofrecidos a Gemini sin URI ni documentos de licencia. El editor no debe aplicar estos overlays automáticamente mientras `creativeApproval` sea review-required.

Pruebas automatizadas especificadas en `tests/ambient-overlays.test.js` y `tests/audio-headroom.test.js`; consultar el log de test final para total verificado, y no reclamar tests que dependan del host Git como superados dentro del contenedor.

## Siguientes pasos exactos

1. Publicar y desplegar la rama de overlays/mastering solo tras regresión completa, copia integral de datos y rollback; ejecutar prueba de acceso/autorización sobre recursos nuevos y comprobar 15 medios (13/1/1).
2. Probar los efectos sobre vídeo vertical real con cara y movimientos, ajustar posición de capa y no dibujar sobre rostro, probar DOPAMIN/CALMA/ELEMENTS.
3. Reutilizar Director IA y catálogo etiquetado para localizar reloj por «presión de tiempo» y chispas por «revelación»; hoy Gemini recibe IDs y etiquetas, la selección automática LLM aún no está cerrada.
4. Completar carencias prioritarias del banco real: personas/emociones, transformaciones/naturaleza, música compatible, 14 alias SFX y oclusión de sujeto. Sin gastar ni recuperar 18GB a la vez.
5. Fase 9 con Carlos: vídeo real/preview/2–3 retoques/export MP4. Hasta entonces V1 NO aceptada.
