---
name: sues-ai-film-director
description: Dirección cinematográfica IA, planificación temporal ejecutable y evaluación audiovisual de SUES AI VIDEO EDITOR. Reutiliza el motor existente y evita duplicar Work/REA.
version: 0.1.0
---

# SUES DOPAMIN · AI FILM DIRECTOR

## Activación
Usar al analizar, planificar, evaluar o mejorar montajes DOPAMIN, CALMA y ELEMENTS. Leer primero `PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, `docs/VIDEO_EDIT_PLAN.md`, el Roadmap Maestro enlazado en README y las ramas/PR recientes. No sobrescribir trabajos de Work ni reiniciar investigaciones REA. Inventariar herramientas y resultados antes de instalar o consumir créditos.

## Objetivo
Desde vídeo bruto, generar plan ejecutable con tiempos precisos, capas, fuentes, transiciones, motion graphics, audio, máscaras y criterios verificables. Meta aspiracional: reel vertical ~60 s comparable a edición profesional; no declarar éxito sin reproducir y evaluar el MP4.

## Siete módulos
1. Narrativa: transcripción alineada por palabra, beats semánticos, emoción, gancho, cambios de energía, silencios.
2. Fotografía: planos, centro facial/ojos, reencuadre, curvas de zoom, continuidad y safe zones.
3. Montaje: ritmo, J/L cuts, transiciones motivadas, patrones de interrupción variables (no efectos gratuitos).
4. Composición: grafo de capas, sujeto/fondo, máscaras temporales, blur, B-roll delante/detrás, oclusiones.
5. Sonido: voz prioritaria, música, efectos y ducking, true peak, clipping y sincronía. Preferencias iniciales de mezcla 150/30/16–20 son controles relativos sujetos a normalización y pruebas de escucha, NO multiplicadores ciegos.
6. Tipografía: captions por palabra, énfasis semántico, jerarquías, naranja fuego/metálico, contraste y legibilidad.
7. QA: render, reproducción visual, revisión de fotogramas, escucha, comparación con referencias, detección de fallos, corrección y nuevo render con límite de coste.

## Contrato mínimo de evento
Cada instrucción debe tener `id`, `start_ms`, `end_ms`, `track`, `type`, `parameters`, `assets`, `dependencies`, `capability_status` y `acceptance_tests`. Todos los tiempos sobre el timeline final, no sobre fuente salvo `source_in_ms`. No permitir efectos sin duración, recurso o capacidad de render verificable.

Ejemplo:
```json
{"id":"zoom-eyes-01","start_ms":2200,"end_ms":5500,"track":"camera","type":"tracked_zoom","parameters":{"target":"eye_midpoint","scale_from":1.0,"scale_to":1.45,"easing":"ease_in_out","safe_crop":true},"assets":[],"dependencies":["face_track"],"capability_status":"requires_probe","acceptance_tests":["eyes_in_frame","no_black_borders","smooth_motion"]}
```

## Reglas de ejecución
- Clasificar cada evento como `supported`, `fallback`, `missing` o `untested` a partir del motor real.
- Si falta capacidad, registrar requisito técnico con alternativa; nunca fingir efecto aplicado.
- Utilizar modelos PyTorch sólo cuando aporten visión, segmentación o seguimiento medibles; no confundir modelo con orquestador.
- Comparar con CapCut (keyframes, captions, plantillas, tracking) y DaVinci/Fusion (nodos, máscaras, curvas, tracking, composición) mediante documentación y pruebas autorizadas. No copiar código ni recursos propietarios.
- REA: inspeccionar instalación y resultados existentes antes de continuar; registrar hallazgos con fuentes, versión y fecha; no duplicar investigación.
- Bibliotecas: inventariar Drive propio/comprado, derechos/licencias, B-roll, SFX, música, overlays, MOGRT, fuentes y presets; priorizar propiedad y licencia. No asumir que un archivo recordado sigue disponible.
- Alinear efectos a palabras con timestamps y validar error temporal contra fotogramas.
- Separar especificación del director, motor, recursos, evaluación y métricas.

## Prueba obligatoria de 10 s
Secuencia: flash/zoom medio 0s, plano normal 2s, zoom suave a ojos 2.2–5.5s, palabra destacada + B-roll sincronizado, blur de fondo 6s, gráfico detrás del sujeto 6.4s, mezcla voz/música/SFX. Verificar vídeo real frame a frame, oclusión, bordes de máscara, legibilidad, sincronía, audio y ausencia de cortes rotos. Reportar resultados `PASS/FAIL/NOT_IMPLEMENTED/NOT_TESTED` por evento.

## Criterios de entrega
Guardar plan JSON, matriz de capacidades, inventario con licencias, reporte QA, vídeo final reproducible y tareas de brechas. No declarar «cinematográfico» por tests unitarios solamente. Evitar gastar créditos en renders repetidos sin un cambio justificado.

## Referencias técnicas
- Blackmagic Fusion: https://www.blackmagicdesign.com/es/products/davinciresolve/fusion
- DaVinci soporte/manual: https://www.blackmagicdesign.com/es/support
- SAM2: https://github.com/facebookresearch/sam2
