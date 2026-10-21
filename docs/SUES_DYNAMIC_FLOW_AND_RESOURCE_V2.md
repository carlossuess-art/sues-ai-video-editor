# Flujo de edición, comparación y recursos V2 · 21/10/2026

## Flujo de producto

Editar vídeo abre dos rutas: pegar instrucciones o edición automática. La ruta
automática presenta plantilla y briefing antes del análisis. Se revisa la propuesta
antes de generar; cambiar plantilla/sonido invalida esa revisión. La comparación
crea CALMA y DINÁMICA como dos versiones del mismo original sin modificar el padre.
Los reintentos de la misma comparación reutilizan IDs; cambios de ajustes crean otra.

La receta es opt-in (`autoRecipe`, falso por defecto): reglas locales sobre palabras
reales, límites de densidad, conservación de voz y composiciones manuales. No hay
Director LLM nuevo. Las tarjetas de pantalla completa se anuncian antes de generar.
Los recuentos describen el plan compilado, no una cuota de efectos ni una promesa
de equivalencia con Keanu. Los zooms actuales son ciclos de acercamiento y retorno.
DINÁMICA sigue experimental; F6, F9 y aceptación V1 permanecen abiertas.

## Evidencia de referencia

`examples/references/keanu-event-inventory-20261021.json` registra el vídeo de
64.2 s y su hash: 15 bloques visuales y 8 acabados separados. La cámara se midió
en ventanas sin oclusión: al menos 4 acercamientos y 6 alejamientos; no se presenta
como recuento completo. No se verificaron todos los cortes ni los SFX mediante escucha.
La referencia editada no equivale al bruto recuperado de 38.31 s del editor.

## Recursos V2 sin migración destructiva

Fuentes leídas íntegramente en Drive el 21/10/2026:

- Informe: https://docs.google.com/document/d/1rgwmkq1zRXB9EFrZzVcxjBTAmAEqs8g7nWxR50DSnbA/edit
- Prompt: https://docs.google.com/document/d/1_G-Pdt-SW8ptr0gjfPB3zwHndkpuqNTFIYQJH5SZwrM/edit
- Esquema: https://docs.google.com/document/d/134gv1XGCp6-LGeyRLq0B1jZDq_a8TxdvxaJNK0LXeZs/edit

Copias de diseño en `docs/design/`; esquema draft2020-12 en `schemas/`.
No se instala el prompt como un modelo ni se modifica `sues-edit-plan/v1`.
Las instrucciones exportadas para Gemini conservan ese contrato e incorporan
las prioridades editoriales V2 y los límites reales.

Metadatos opcionales en el banco existente: `metadata-v2/<hash>.json`, escritura
atómica, sin alterar registros `.json` ni ficheros `.media` anteriores. Se valida
esquema, identidad, hash/tipo reales, alias único y coherencia del rango de energía.
Una aprobación requiere licencia comercial verificada y referencias de prueba
documental y revisión. La API almacena esa declaración humana; no verifica por sí
misma la autenticidad del documento ni sustituye la escucha.

API privada: GET `/api/resource-catalog`, GET/PUT `/api/assets/<hash>/metadata`.
PUT conserva protección de sesión, origen, cabecera y límite 64 KiB. Los catálogos
usan lista explícita de campos; no exportan rutas privadas ni referencias de prueba.
El resolver semántico comprueba aprobación, perfil, capacidades y hash; devuelve
`unavailable` para los 14 alias reservados hasta disponer de asociación revisada.
No se altera la selección manual anterior de los 13 SFX ni se aprueban retroactivamente.

Inventario reproducible (primero sin escribir):

```sh
node scripts/resources/catalog_metadata_v2.mjs DIRECTORIO_DE_RECURSOS
node scripts/resources/catalog_metadata_v2.mjs DIRECTORIO_DE_RECURSOS --write
```

Sólo crea metadatos pendientes para recursos presentes e íntegros, nunca reemplaza
metadatos existentes, asigna alias ni marca aprobaciones. Segunda ejecución idempotente.

## Pruebas y límites

QA previo: cuatro MP4 sintéticos (dos estilos por escritorio/móvil), descargas
idénticas, decodificación completa, original/padre intactos y sin desbordamiento.
Prueba posterior: cambios de estilo/sonido exigen revisión nueva en ambas pantallas.
Estos resultados no equivalen a aceptación creativa del material de Carlos.
Tests V2 cubren identidad incorrecta, aprobación sin pruebas, ausencia de capacidad,
perfil incompatible, duplicidad de alias, integridad alterada, persistencia, acceso
HTTP privado y rechazo atómico. Ninguna API de pago ni dependencia añadida.

Pendiente: mapear por escucha/licencia los recursos, beats semánticos LLM, análisis
espacial general, máscaras, stems musicales y nuevas operaciones con contrato y QA.
