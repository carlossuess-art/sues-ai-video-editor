# REA aplicado a SUES · evidencias y límites · 24/10/2026

## Estado recuperado

Se reutiliza la investigación existente. REA oficial: https://github.com/morluto/rea .
CLI rea-agents6.7.0 instalada en entorno de investigación aislado, con Node22.23.4
y procps. No registro global de MCP, ni reinstalación del editor, ni acceso a sus secretos.
Los clientes de Captions/CapCut se descargaron de enlaces públicos observados en sus
páginas. Sólo análisis estático: no se ejecutó código de esas aplicaciones ni se
hicieron llamadas a sus servicios privados. Código comercial no incorporado a SUES.

## Captions / Max

Fuentes primarias: https://captions.ai/features/edit-with-ai ,
https://captions.ai/styles y https://help.captions.ai/docs/project/ai-edit .
La documentación describe estilos que coordinan subtítulos, recursos, audio y transiciones,
con correcciones posteriores sobre elementos/escenas. Eso es descripción del fabricante;
no evidencia del algoritmo de selección ni de la arquitectura interna de su IA.

El cliente público contiene un mapa de módulos con referencias a edit-plan, edit-styles,
editor, clip-sequence-selector, auth, use-object-urls y basic-video-player.
REA analizó el prefijo original exacto de4679bytes (mapa de dependencias):
ev_b86172ca5400deace4362d173fd08404e174c1d48041720330d829d24b9da84e.
Un archivo analizado,162nodos AST visitados,0fallos de parseo.
Esto verifica nombres/estructura estática; no implementación ni ejecución del editor.

El bundle principal disponible tiene4.108.354bytes. El intento completo agotó el heap
del worker: ev_f8b6f36d2d870ce43132363c8a05e04923e12106dbe9a08a59d1271a429099fd
con1archivo omitido. No presentar la devolución de Evidence como análisis completo.
Los chunks específicos referenciados devolvieron403: se detuvo esa vía, sin evadir acceso.

## CapCut

Fuentes primarias: https://www.capcut.com/editor y
https://www.capcut.com/tools/ai-video-editor .
Se analizaron tres archivos públicos: prefetcheditorresources, draftpreload,
templatepreload. REA:584.357bytes,3archivos parseados,211.967nodos AST,
6250hallazgos y1465módulos;0fallos de parseo. Son principalmente bootstrap/polyfills.
El grafo conserva límites explícitos por presupuesto de resultado: no cobertura completa.

La inspección estática acotada muestra inicialización separada de borradores,
plantillas y recursos. Describe código de precarga, no prueba de tiempos en ejecución.
No se recuperó el algoritmo privado de IA, seguimiento, recorte de personas o ranking
semántico de recursos. No se identifica un contrato completo del timeline por esos archivos.

## Qué se aplica a SUES

1. Separar comprobación de autenticación de cargas secundarias de biblioteca/diseño.
   Un fallo de proyecto no debe confundirse con una sesión caducada.
2. Separar reproducción de exportación: proxy ligero720p, exportación original1080p.
   Implementación propia con FFmpeg; no atribuimos este código a Captions/CapCut.
3. Conservar operaciones/recursos explícitos por escena y permitir cambios locales,
   usando el plan externo y renderer existentes en lugar de crear otro editor.
4. El director necesita comprender contenido y composición: los nombres de módulos
   encontrados no sustituyen un modelo multimodal ni sus pruebas sobre el MP4 final.

## Evidencias reproducibles

Fuera de Git: rea-research-20261024, índices URL/SHA256 de cada descarga,
capcut-rea-evidence.json, captions-map-final.json y procedencia byte0–4679 de la muestra.
Se conserva el historial de intentos fallidos y sus límites. No subir bundles
comerciales, pesos de modelos ni vídeos privados al repositorio.
Coste de API0. Las conclusiones sobre el backend son desconocidas, no hipótesis verificadas.
