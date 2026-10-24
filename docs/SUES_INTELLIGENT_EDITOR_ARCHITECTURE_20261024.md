# Arquitectura audiovisual · evolución del editor existente

## Cinco capacidades, un plan verificable

1. Analista: ingesta/Whisper existentes, metadatos y señales FFmpeg, fotogramas temporizados
   y proveedor visual. Emite evidencia ligada al SHA256 del bruto. Declarar cobertura visual,
   confianza y muestras; no inferir emociones privadas como hechos. Transcripción completa
   no equivale a comprensión visual completa.
2. Director: transcripción, evidencia visual, intención, estilo DOPAMIN y catálogo autorizado.
   Decide escenas con tiempos fuente, motivo narrativo, énfasis, recursos y mezcla.
   Su salida pasa validación de esquema, tiempos, procedencia y compatibilidad; nunca código.
3. Ejecutor: plan externo/prepareProject/rendererFFmpeg existentes. Mantiene originales,
   transforma tiempos si hay cortes y produce MP4,audit y proxy de reproducción.
4. Crítico: compara plan con archivo final, no sólo con JSON. Decode, dimensiones, duración,
   captions visibles, oclusión, luz, niveles y sincronía; revisión visual del contenido y
   comparación narrativa. Métricas técnicas no son aceptación artística.
5. Mejora: convierte incidencias verificadas en cambios acotados de plan y nuevas versiones.
   Máximo inicial2iteraciones, presupuesto de tiempo y parada ante regresión técnica.
   Preservar primera versión y registrar qué cambió/por qué. No autoaprobar calidad150€.

## Reutilización e interfaces

El contrato sues-edit-plan/v1 y su catálogo son la frontera del ejecutor.
Añadir análisis/decisiones arriba; no reemplazar el motor que ya renderiza.
Un proveedor puede ser local o externo autorizado; no incluir claves en planes, logs o Git.
La prueba local de un proveedor debe registrar modelo, licencia, versión, latencia y RAM.
Si el modelo no comprende el vídeo o alucina, se rechaza su plan; no recurrir a decoraciones
periódicas presentándolas como inteligencia creativa.

## Criterio de conexión

Subir→ASR→análisis visual→plan validado→render→crítica→corrección→MP4 final.
Botón automático sólo disponible cuando el proveedor operativo ha superado esta cadena.
La corrección manual de un contorno o receta del maestro no demuestra generalización.
Los déficits se muestran como pendientes y nunca se ocultan dentro de un porcentaje global.

## Reproducción y sesión

La sesión se comprueba antes de bibliotecas y proyectos. Inicio de sesión oculto durante
comprobación y visible sólo tras401. Fallos de red reciben reintento sin falsa desconexión.
Cookie30días, HttpOnly, SameSite, Secure en HTTPS, expiración explícita; claves persistentes.
Proxy720p1200kbps+AAC96kbps con faststart y Range privado; descarga conserva MP4 original.
Se prepara antes de DONE cuando es posible; trabajos históricos lo generan al primer acceso.
Los recursos pesados y sus cachés permanecen en VPS, fuera de Git.
