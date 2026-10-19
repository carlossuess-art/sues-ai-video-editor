# Perfiles combinables · auditoría e implementación · 19/10/2026

## Punto de partida verificado

Repositorio existente `carlossuess-art/sues-ai-video-editor`, rama oficial
`feat/phase-4-vision-camera`, commit `78f38fb1f47f4bfa279904fe6199cc29d9df9030`.
`main` conserva el POC antiguo: no usarlo como base de desarrollo/despliegue.
Las ramas foundation F3–F10 y la recuperación nocturna ya están en la ascendencia
de la oficial; no volver a fusionarlas. `poc/phase-2` conserva historia divergente,
no se integra a ciegas. Base ejecutada: 199 pruebas Node aprobadas antes de editar.

Leídos el maestro funcional, PROJECT_STATUS, AGENTS, estudio general y dossier
Keanu vigente (43 páginas, Library `libfile_c396bc19cee0819199917a2ed02d6cd2`,
versión 1). El dossier distingue observaciones, recetas y datos sin verificar.
La especificación posterior de Montserrat/14:12 del proyecto prevalece sobre
la propuesta histórica 2:1 del PDF. No se alteran fuentes ni jerarquía aceptadas.

## Arquitectura común

| Capa | Responsabilidad | Implementación reutilizada |
| --- | --- | --- |
| Identidad | Tipografía, paleta, jerarquía, cierre | brand-kit, font-kits, text-presets |
| Lenguaje visual Keanu | Capas, texto progresivo, recursos, luces y transiciones | local-preview, graphic-scenes, illustrations, depth-text |
| Perfil visual | Ritmo, cámara y animación | style-variants + visualProfile |
| Estructura ELEMENTS | Secuencia explícita de ideas con rangos existentes | elements.js |
| Director | Proponer candidatos con evidencia | automatic-director; reglas léxicas, no LLM |
| Plan y entrega | Validar, renderizar, revisar, deshacer y recuperar | local-pipeline, worker, jobs, project-backup/recovery |

DOPAMIN es la referencia maestra de alta intensidad. CALMA comparte el lenguaje,
con intensidad/frecuencia relativas 0,5 frente a 1 de DOPAMIN. Para preservar
el trabajo validado, el archivo físico de base continúa llamándose
`sues-calma.template.json`; no se duplica ni se sustituye su contenido. Ambos
perfiles pasan por el mismo compositor, tipografías, zonas seguras y audio.
Las variantes antiguas IMPACTO, EXPLICA e HISTORIA se conservan.

Implementación inicial de DOPAMIN: entradas de captions más rápidas, máximo de
zoom 1,22 frente a 1,18, hasta seis candidatos de zoom/7,5s frente a tres/15s,
separación mínima 1s frente a 2s. Sigue necesitando evidencia léxica y validación
espacial: son presupuestos máximos, nunca disparadores periódicos ni obligación
de llenar cupos. Las entradas ELEMENTS usan 36px/140ms frente a 18px/240ms.
Son valores propios de adaptación, no mediciones extraídas del vídeo Keanu.
Las selecciones manuales y la voz no se eliminan para cumplir un ratio.

DOPAMIN sigue experimental: esta iteración no implementa automáticamente el doble
de transiciones, recortes, luces o SFX de todos los tipos. La frecuencia general
por significado, la selección avanzada y los efectos ausentes siguen pendientes.
CALMA es el estilo inicial por defecto y conserva su compilación visual/audio.

## ELEMENTS ejecutable

Una estructura se combina con `styleId`, sin crear seis plantillas aisladas.
Los formatos son LIST, RANKING, COMPARE, REVEAL, Q&A y FLOW. Se elige un formato
por montaje, con uno a diez elementos. LIST/REVEAL/FLOW son secuencias de tarjetas,
no una lista de diez líneas simultáneas. COMPARE muestra dos columnas y Q&A dos
bloques. RANKING requiere posiciones explícitas únicas de 1 a 10, sin clasificarlas
por cuenta propia. REVEAL descubre cada idea al llegar a su rango; no infiere
qué dato constituye una sorpresa. FLOW presenta pasos sucesivos y progreso;
un diagrama de ramificaciones es una ampliación pendiente.

Cada elemento se ancla al comienzo y final de subtítulos existentes. Duración
admitida 1–12s antes del cierre, sin ampliar tiempos de palabra inciertos ni
reconstruir alineaciones. La copia es editorial explícita, aunque coincida con
la voz. Se preservan todas las palabras y la locución original.

Tarjeta a pantalla completa: cubre intencionalmente el plano; no simula un recorte
del sujeto. Contenido dentro de x120–900/y380–1080, captions en su zona inferior
existente. Usa las fuentes/medidas compartidas, escapes ASS y ajuste de texto;
rechaza copia que no quepa legible. No oculta captions por mera similitud de texto.

Rechaza rangos invertidos, anclas obsoletas, solapes entre elementos y con tarjetas,
motions, imágenes, profundidad o B-roll. No añade recursos externos. SFX son
opt-in, propios por síntesis local, y usan el bus existente con ducking/limitador.
El toggle de recursos desactiva ELEMENTS y sus cues. El hash del motor incluye
el módulo nuevo; los ajustes viajan en la copia recuperable y en deshacer.
Cambiar estilo o agrupación obliga a limpiar elecciones con IDs antiguos.

En app: estilo visual, selector de estructura y panel por subtítulo con inclusión,
texto, rango final y campos de comparación/pregunta o posición. Las funciones
avanzadas de extracción automática de listas, ranking o estructura quedan
pendientes; no se atribuyen estas decisiones manuales a un Director IA.

Ejemplo de ajustes API:

```json
{
  "styleId": "SUES_DOPAMIN",
  "elements": {
    "format": "RANKING",
    "items": [
      {"captionId":"seg-001","endCaptionId":"seg-002","label":"Una idea","number":5}
    ]
  }
}
```

## Catálogo Keanu: cobertura real y huecos

| Familia del dossier | Reutilizado / implementado | Lo que falta |
| --- | --- | --- |
| Tipografía y énfasis (p5,28–30) | Montserrat por decisión posterior, cursivas reales, colores, metal por bandas, caracteres | Fuente original no identificada; relieve/reflejo 3D real |
| Fotografías integradas (p7,24–27) | Feather espacial, fades, movimiento y colocación según cara/cámara | Más recursos/licencias y selección por contenido |
| Fondo tras sujeto (p4,24) | Contorno manual acotado y vinculado al original | Máscara temporal automática de cuerpo/sillón; reemplazo de fondo completo |
| Partículas/dinero (p6,24,26) | Sin renderer específico | Partículas con escala/perspectiva, assets autorizados |
| Cuadrícula/comparación/sello (p4,24–26) | Tres escenas por capas, copia, iconos originales, flechas y sello | Ampliación por significado, aceptación del montaje completo |
| Blur/radial/fugas (p7,24–27) | Transiciones globales incluyendo texto, luz cálida y salida documental | Flare localizado y lavados selectivos de fondo con máscara |
| Candado/cadenas/avatar (p6,27) | Check y símbolos genéricos no equivalen a estos recursos | Objetos animados/alpha propios y avatar de seguimiento |
| Cámara (p24–27) | Reencuadre y zoom anclado con límites/evidencia | Mejor selección semántica y evaluación de distintas tomas |
| Audio/SFX (p8,32) | Cuatro síntesis propias, cues compartidos, ducking/limitador | Escucha y selección estética; sonidos originales de Keanu no identificados |
| Estructuras | ELEMENTS manual combinable, seis formatos de base | Detección/extracción automática y animaciones más elaboradas |

No dar por resuelto un efecto pendiente por disponer de un nombre en catálogo.
No elevar F6 por número de componentes ni presentar las tarjetas de QA como
nivel creativo aceptado por Carlos.

## Investigación técnica: documentación antes de REA

Fuentes primarias consultadas el 19/10/2026:

- REA oficial: https://github.com/morluto/rea . MCP/CLI para investigar comportamiento
  y código/binarios de aplicaciones autorizadas. Su código es MIT; dependencias y
  herramientas comerciales tienen condiciones propias. La configuración puede
  modificar registro MCP e instrucciones. No se instala ni se ejecuta en este bloque:
  no hay un binario/proyecto autorizado concreto que aporte evidencia adicional
  al análisis del vídeo. Un MP4 no expone sus capas mediante REA.
- After Effects: https://helpx.adobe.com/after-effects/desktop/roto-brush-and-refine-matte/roto-brush/roto-brush-refine-matte.html .
  Estudiar selección/propagación/refinado de matte; preferir proyecto editable o
  máscara exportada. Referencia técnica, no nueva dependencia del renderer.
- Captions AI Edit: https://captions.ai/help/docs/project/ai-edit . Referencia de
  producto: estilos, plan editable, medios y restauración de cortes. La documentación
  actual de API (https://captions.ai/help/api-reference/api) describe Mirage/generación
  de talking heads; no demuestra acceso API equivalente a todas las funciones AI Edit.
  No se integra un endpoint supuesto ni se consume saldo.
- CapCut: https://www.capcut.com/resource/how-to-remove-background-in-capcut .
  Referencia de eliminación automática de fondo/chroma y composición. No demuestra
  un SDK estable ni una licencia de reutilización de sus recursos. Mantener el
  adaptador existente como salida opcional y estudiar proyectos propios/editables.

Prioridad: documentación → editable/medios propios → comparación visual →
implementación propia. REA sólo ante una pregunta técnica delimitada y un objetivo
legítimamente accesible; no sustituye la licencia de una herramienta ni de assets.

## Validación y continuidad

Comando de smoke con original/análisis ya disponibles:

```sh
node scripts/app/smoke_elements_real.mjs PROJECT.json NUEVO_DIRECTORIO
```

Prepara 12 combinaciones (6 formatos × 2 perfiles), verifica conservación del
texto, exporta DOPAMIN+COMPARE a través de API/worker/almacén privado, comprueba
Range206, decodificación completa, original intacto, un único intento, deshacer
y copia recuperable con ASS/filtro idénticos. Etiquetas de QA explícitas; no
interpretan el discurso del vídeo real como una comparación.

Ver resultado compacto en `examples/preview/composable-profiles.real-result.json`.
Revisión visual interna de los seis formatos y del MP4 de integración; no escucha
humana, aprobación estética ni prueba de navegador (Chromium no instalado).
No descarga de navegador/modelos ni uso de Lovable/proveedores de pago.

Siguiente acción: revisar el criterio editorial de estructuras sobre una locución
adecuada, completar máscaras de cuerpo y efectos concretos del catálogo y probar
la nueva UI en navegador. El VPS conserva el estado observado anterior; este
bloque no cambia producción ni cierra F6/V1.


## Verificación real de interfaz · 19/10/2026

Chromium145:24combinaciones escritorio/móvil,CALMA/DOPAMIN y6formatos,guardadas
yrecargadas sin pérdida ni scroll horizontal. Deshacer/duplicarPASS. Recuperación
TAR desdeinput deUI conservaELEMENTS; exportación real38,31s,decodePASS,original
intacto yRange206. Controlesbloqueados alcompletar;sin erroresJS. No es aceptación
estética de losseis diseños. Ver examples/preview/browser-integration.real-result.json.

Ejecutar laQA opcional sin agregar Playwright como dependencia deproducción:

```sh
SUES_PLAYWRIGHT_MODULE=/ruta/playwright/index.mjs \
SUES_CHROMIUM_PATH=/ruta/chrome-headless-shell \
node scripts/app/smoke_browser_real.mjs PROYECTO.json NUEVO_DIRECTORIO_PRIVADO
```

Usar análisis existente deloriginal autorizado. Elscript descarga unacopia privada
yla recupera desde laUI,exporta y comprueba integridad. Capturas/TAR quedan fuera
 deGit. La instalación de navegador no modifica elruntime delVPS.
