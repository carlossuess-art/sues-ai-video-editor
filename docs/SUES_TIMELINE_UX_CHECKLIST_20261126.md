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
