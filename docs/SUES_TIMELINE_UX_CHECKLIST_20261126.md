# SUES AI VIDEO EDITOR · Checklist maestro de interfaz 26/11/2026

Autoridad: decisiones de Carlos del chat de timeline 26/11. Reutilizar FableCut V1.1 existente; no modificar producción ni proyectos de Reels, no introducir otro editor/renderizador, mantener MCP y formato nativo. Cada requisito exige evidencia de código, interacción móvil, persistencia y cuando afecte a imagen/audio paridad preview/export. No confundir propuesta, código, prueba, despliegue y aprobación.

## TL-01 · Familias y timeline
- [ ] Identificadores fijos a la izquierda: V Vídeo (no A-roll), T Títulos, ST Subtítulos, F Fondos, I Imágenes, E Elementos, BR B-roll, MR Máscara Roll (material que lleva máscara, y máscaras técnicas identificables), MG Motion Graphics, VFX Efectos visuales, CE Color Emocional, IL Iluminación, A Audio original, VS Voz superpuesta, M Música, SFX Efectos sonoros. Tocar sigla muestra nombre flotante y activa familia; repetir desactiva y habilita selección libre. No desplazar timeline.
- [ ] T blanco opaco borde amarillo; ST blanco translúcido borde blanco fuerte; MG pistacho agrupable con subcapas pistacho; I naranja sólido / E naranja translúcido borde intenso; BR violeta sólido / MR violeta translúcido borde claro; F gris, V azul con fotogramas reales; VFX dorado, CE dorado opaco, IL dorado translúcido. Audio con borde común turquesa, rellenos distintos A/VS/M/SFX. Hex de mockup provisionales: V #3675c5; T #fff/#ffda35; ST #fff; MG #b5dc69; I/E #e7a455; BR/MR #a17add; F #999; VFX #d4af37; audio borde #45d9e5.
- [ ] Filmstrip real del vídeo ~1 fotograma/segundo al zoom normal; mayor densidad al ampliar, caché y precisión por frame. Cabezal sincronizado. Mantener gestos táctiles y rendimiento.
- [ ] T/ST fila general por familia; bloques individuales por palabra (T admite grupos deliberados), subfilas temporales únicamente para solapes temporales reales; plegar al salir sin alterar parámetros o tiempos. MG grupo desplegable; movimiento conjunto preserva tiempos internos.
- [ ] Selección bidireccional timeline/canvas; familia activa restringe edición sin ocultar otros elementos del resultado; máscara técnica solo seleccionable expresamente por timeline; hit-test evita interceptar zonas transparentes. Arrastrar canvas modifica posición espacial; timeline solo temporal.

## TX-01 · Textos
- [ ] Selección y edición por palabra; respetar texto, timestamps, tamaño/posición individuales, estilo y animación.
- [ ] Barra superior − número +; tap ±1, mantener acelera; entrada numérica directa, rango hasta 250. Ocho tiradores: esquinas escalan proporcionalmente; centro superior/inferior escala vertical; lados escala horizontal; sin deformar otro eje ni rasterizar texto. Mantener fontSize y escalas separadas, compatibilidad nativa/MCP/export.
- [ ] Respetar SUES Film Director y reglas de subtítulos progresivos bajo barbilla, títulos sobre cabeza, énfasis y exclusión de subtítulos duplicados con MG. No modificar proyectos existentes para probar.

## MR-01 · Máscaras y profundidad
- [ ] MR = Máscara Roll. Feather global o independiente superior/inferior/izquierda/derecha; controles numéricos y +/- sostenido; desenfocar borde y no toda la imagen. Máscara técnica protegida.
- [ ] Mantener pulsado elemento 2–3 s sin mover abre menú explicativo Delante de ti / Detrás de ti, reusar matte real del sujeto; sin matte no simular oclusión. Tap selecciona, arrastre mueve. Probar con material real y renderer compartido.

## AU-01 · Audio
- [ ] Menú Audio reúne A/VS/M/SFX; audio original distinto de música elegida. Grabación VS desde cabezal con reproducción sincronizada, forma de onda, fuente intacta. Música 1 fila inicial; arrastre abajo abre segunda y tercera máximo simultáneas. Trim, volumen, fades, mute independientes; borde familia común. No romper mezcla ni sincronía.

## FX-01 · Transiciones y luz
- [ ] Transición VFX dorada, símbolo dos triángulos enfrentados entre clips, duración predeterminada por transición; toque abre menú, tiradores laterales ajustan duración; valor preciso y restablecer. No desplazar clips/voz/subs/música. Validar límites según medios.
- [ ] Selección real sobre un mismo fotograma de recursos existentes Creator Club: 24 Film Burns, 7 Anamorphic Flares, 4 Cinematic Overlays (35 candidatos, no 35 favoritos). Guardar ID original, hash, derechos, parámetros, preview y modo de fusión; no duplicar. Favoritos iniciales: Film Burn (destello cálido), Anamorphic Flare (destello horizontal), Ambient Overlay (luz ambiental suave), Light Leak (entrada de luz) si existe candidato distinto útil. No descargar más sin hueco demostrado.
- [ ] Nombres técnicos en inglés siempre con explicación breve castellana entre paréntesis en menús y timeline, también animaciones/transiciones/SFX/MG.

## CE/IL-01 · Color e iluminación
- [ ] CE separado de IL: aplicar por clip/tramo/todo, barra dorada independiente divisible sin cortar fuente, intensidad opcional, salto intencional o progresión, conservar marca/textos/MG. 18 LUT .cube verificados en Drive; catálogo emocional provisional, conservar nombres y originales.
- [ ] CE favoritos mínimos Esperanza (Nostalgia Cálida), Serenidad (Vibrante Luminoso), Sombra fría (candidato Océano Oscuro: azules/grises/negros, menos saturación y luz), Blanco y negro (dramático). Otros LUT accesibles sin saturar menú. Validar sobre fotograma real, no inventar apariencia.
- [ ] IL favoritos: Luz lateral suave izquierda/derecha, Golden Hour (luz de atardecer), Halo (luz detrás de ti), Luz lateral dramática izquierda/derecha. Configuraciones ReLight MIT ya guardadas en SUES_ILUMINACION_PRESETS_CHECKPOINT_20261126.md; no instalar ComfyUI ni generar rostros. Equivalencia de parámetros, oclusión real y paridad preview/export; si motor no permite, marcar bloqueo.
- [ ] Reutilizar fuentes Creator Club: LUT V1 1bjarX9VyMpRRFcOb3xTMW9Ngi6Epl9Cq, V2 1WiBUTAYNGn8aCEdoRoyUue6CwFn5kHVj, Film Burns 1EXlLR4lCTkuDcbwTw_285UoaDvrXQA0q, Flares 1TC1I-3tx4vD-fNZQqjrZ8zGaLQ6HLGTH, Overlays 14LYuJT1k190CErT8x442Wjy8jnxiVfbH.

## QA-01 · Cierre
- [ ] Auditar/reutilizar keyframes visibles y curvas, undo/redo, guías magnéticas, selección múltiple, cortar/dividir/duplicar/copiar propiedades, controles de velocidad/opacidad; no confundir propuestas adicionales con decisiones cerradas.
- [ ] Regresión completa de proyecto existente, interfaz táctil Pixel, export nativo, duración/sync, rendimiento, persistencia, MCP paridad y documentación. Doble auditoría audiovisual cuando cambie render. No desplegar sin autorización específica.

Estado inicial: especificación consolidada, investigación de recursos previa acreditada; ninguna casilla se da por completada sin pruebas. El trabajo debe mantenerse aislado y encadenar los bloques sin duplicar infraestructura.

## Avance técnico real · 26/11/2026
- Copia aislada de la aplicación móvil V1.1 activa (solo lectura de origen /srv/sues-fablecut-next/preview-v11/app): /opt/sues-video-setup/timeline-ux-20261126.y7tBvI/app. Sin copiar datos de proyectos ni desplegar.
- Parches reproducibles: patches/sues-mobile-timeline-families-20261126.py (97c223ef), patches/sues-mobile-timeline-families-20261126.css (44318a40, 4ac80eae), patches/sues-mobile-quick-fontsize-20261126.py (818c96f1). Aplicados en copia aislada. Siglas y clasificación inicial por roles nativos/nombres; conserva identificadores físicos, renderer y esquema. Paleta móvil y marcadores dorados reutilizan marcas y tiradores nativos (aún no símbolo único centrado entre dos clips). MR etiqueta completa, filtro bidireccional y clasificación de capas mixtas aún por completar.
- Control rápido de fontSize sobre el inspector existente: ±1, repetición acelerada, entrada directa, bloqueo de clip, undo nativo, rango 12–250 (mínimo actual del motor, pendiente decisión sobre 0–11). No son los ocho tiradores ni la escala independiente.
- Regresión dirigida app-globals/color/mask/mcp-edit-ops **36/36 PASS** después del primer parche, antes del control de tamaño. Sintaxis node --check app.js y sues-mobile-text.js después del segundo parche PASS. Browser smoke inicial en VPS no pasa: Chromium Page.navigate devolvió net::ERR_ABORTED, about:blank, sin cargar UI; NO hay verificación visual, táctil ni end-to-end. Test guardado tests/engine-next/sues-mobile-timeline-browser-20261126.cjs, intentos locales registrados en browser-smoke*.log.
- No se han resuelto todavía agrupación, filmstrip, máscaras por borde y profundidad, audio, selección de efectos en fotograma real, LUT/IL render, ni paridad final. Mantener todas las casillas sin marcar hasta QA de aceptación. Sin gasto ni cambio en producción.

## 26/11/2026 · Incidencia Chromium resuelta (QA aislada)

Reproducción independiente con servidor HTTP Python y HTML mínimo: Chromium como root con --no-sandbox sufrió reinicios de Network Service y net::ERR_ABORTED; mismo binario como usuario sin privilegios y sandbox activo cargó QA_OK. No se ha cambiado configuración de producción, permisos del árbol de producción ni servicio de Chrome existente. Para QA FableCut se copió únicamente la aplicación de desarrollo (sin proyectos ni datos) a /tmp/sues-ux-test.npQjrZ/app, propietario suesnle, HOME temporal aislado y servidor efímero loopback. Se ejecutó node --test test/sues-ux-smoke.test.js con Chromium --headless=new, sin --no-sandbox. HTTP200 y navegación CDP exitosa; viewport 393x852 (CSS móvil, no emulación táctil real). **1/1 PASS**: bordes ST blanco/T amarillo en DOM computado; selección ST muestra control rápido con 50; click + cambia solo ST a 51 y mantiene T a 80. Test reproducible guardado en tests/engine-next/sues-mobile-timeline-browser-20261126.cjs (copiar a app/test/sues-ux-smoke.test.js en copia QA accesible a suesnle; no ejecutar como root). Commit 5da70ad6. Evidencia VPS: /opt/sues-video-setup/timeline-ux-20261126.y7tBvI/browser-nonroot-2.log (1 PASS, duración 10144 ms); probe /tmp/sues-chrome-nonroot.R7de/dom. La primera regresión dirigida previa 36/36 sigue acreditada. Pendiente prueba de toque físico, repetición sostenida, persistencia, todas las familias y resto del checklist. No desplegar; no declarar QA completa.


## 26/11/2026 · Integración en el editor habitual

El mandato del 26/11 autorizó producir, probar y publicar los cambios validados. El primer bloque de funcionalidades está operativo en el editor habitual, versión `52c6970387cd`. Siglas y colores, filtrado en filas de familia única, hit-test según píxeles visibles, control rápido de tamaño y escalas de texto se han integrado. El [registro de publicación](SUES_TIMELINE_RELEASE_20261126.md) recoge pruebas, elementos pendientes, backup y reversión. Cada casilla representa un conjunto completo de requisitos. Las casillas abiertas incluyen validaciones o funciones todavía pendientes.


### Fotogramas de vídeo y evaluación de color

El segundo despliegue sirve `a0b186817448` y añade fotogramas reales para V con caché y densidad dependiente del zoom. Chromium comprobó la combinación de zoom y entrada recortada a 0,20 s, y se repitieron persistencia, MCP y descarga del MP4. Los [18 LUT Creator Club](SUES_LUT_QA_20261126.md) se comprobaron con FFmpeg sobre Q03 en aislamiento. Queda el uso de esos LUT dentro del compositor.


### Audio y voz superpuesta

El tercer despliegue sirve `4f5c5e80cde8`. El menú Audio agrupa controles y permite grabar una toma VS en una pista independiente. El reloj de la previsualización y la grabación parten del mismo tiempo. El caso de prueba emulado incluyó forma de onda, guardado y MP4 H.264/AAC. Las filas de música y la comprobación auditiva con material real mantienen AU-01 abierto. La [evidencia de los tres despliegues](SUES_TIMELINE_RELEASE_20261126.md) conserva el estado detallado.


### Acceso desde bloques de texto y composiciones MG

Cuarto despliegue `715152efda2a`: T/ST muestran texto y abren el inspector con un toque corto. El marcador nativo de subtítulo también se reconoce. Botón en MG para editar las capas de la composición en su timeline nativo con tiempos conservados. Prueba táctil emulada, guardado, MCP y exportación dirigida superados. Ver [registro](SUES_TIMELINE_RELEASE_20261126.md). Siguen abiertos la generación de clips por palabra, la agrupación y el plegado por solape, y el desplegable MG en la línea principal.


### Subtítulos independientes desde transcripción

Quinto despliegue `0cdace0c2ebe`: Transcripción → **Subtítulos por palabra** crea un clip por palabra con su inicio real, incluso cuando dos palabras comienzan en el mismo fotograma. Se probó la persistencia y la paridad con el generador y editor MCP. El mínimo de 0,05 s puede producir un solape corto. Quedan las filas generales por familia, subfilas de solape, expansión inline de MG y revisión en dispositivo físico.
