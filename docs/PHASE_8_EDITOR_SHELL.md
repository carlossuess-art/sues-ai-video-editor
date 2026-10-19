# Fase 8 · Editor shell definitivo · dirección visual aprobada

Fecha: 19/10/2026.

Carlos valida como dirección la propuesta visual inspirada en CapCut móvil + Captions,
adaptada al flujo propio SUES: la IA realiza la edición base y el usuario corrige sólo
excepciones.

## Principios de UX

1. El vídeo permanece visible mientras se editan ajustes.
2. La plantilla es el macrocontrol de la edición.
3. Previsualizar es obligatorio antes de Exportar.
4. Exportar descarga exactamente la preview vigente; editar vuelve a bloquear exportación.
5. Las herramientas son microcontroles sobre decisiones ya tomadas por la IA.
6. No reconstruir un editor manual completo tipo CapCut.

## Navegación objetivo

Barra superior:
- nombre/proyecto;
- plantilla activa;
- Previsualizar;
- Exportar.

Barra inferior móvil:
- Edición;
- Música;
- SFX;
- Subtítulos;
- Visuales;
- Cámara;
- Look;
- Mezcla.

Mientras algunos módulos aún comparten backend, no mostrar controles falsos:
una pestaña sólo se activa cuando tiene funcionalidad real detrás.

## Música · Music Journey

La música no se modela únicamente como una pista continua. El Video Edit Plan podrá
contener tramos narrativos, por ejemplo:
intriga → expansión → reflexión → tensión → resolución.

Cada tramo podrá definir:
- pista o familia;
- inicio/fin;
- gain;
- transición;
- ducking;
- continuidad o cambio de tema.

El Director decidirá si un Reel necesita una sola cama o un viaje musical multi-tramo.

## Mezcla

Controles directos mínimos:
- voz;
- música;
- SFX;
- ambiente;
- auto ducking.

Los cambios de mezcla no deben exigir prompt. Prompt y controles manuales conviven.

## Visuales

Agrupa:
- motion graphics;
- recursos/B-roll;
- fondo difuminado con recurso integrado;
- comparativas;
- listas;
- overlays;
- transiciones.

El patrón BLURRED_RESOURCE_01 es prioritario por preferencia explícita de Carlos.

## Cámara

Debe exponer decisiones ya preparadas por el motor:
- Conservador / Composición;
- seguimiento facial;
- zoom inteligente;
- safe zones;
- ajuste puntual de zoom.

## Implementación incremental

Esta rama nace desde fd168dd2b7ff5817be89ee28d8e654e792002fab.
Primer paso: modernizar shell visual sin cambiar contratos ni motor.
Después separar Música/SFX/Mezcla y Cámara sólo cuando existan endpoints/estado
suficientes para no presentar controles decorativos.

No despliegue automático desde esta rama.
