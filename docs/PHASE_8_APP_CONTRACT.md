# Fase 8 · App / UI · contrato foundation

Pretrabajo de backend/UI sin construir todavía una gran interfaz ni gastar créditos Lovable.

## Implementado
- `src/app-contract.js`: contrato de creación, ajustes y estados de job;
- flujo DRAFT → UPLOADED → ANALYZING → PLANNED → PREVIEW_READY → RENDERING → DONE;
- estado ADJUSTING para cambios posteriores al preview;
- validación de campaignMode + banner geográfico;
- conjunto limitado de ajustes de usuario;
- transiciones de estado que impiden repetir render accidentalmente.

## UX objetivo V1
1. subir vídeo;
2. seleccionar plantilla;
3. opcional: modo campaña + ciudad;
4. procesar;
5. preview;
6. tocar sólo ajustes necesarios;
7. render final y descarga.

## Seguridad pendiente antes de uploads públicos
- autenticación;
- URLs firmadas propias;
- límites de tamaño/duración;
- MIME real y validación de contenedor;
- rate limits/cuotas;
- cola durable;
- expiración/borrado real de temporales;
- separación usuario/job;
- logs sin secretos ni URLs firmadas.

## Lovable
No usar todavía para UI grande. Cuando backend E2E esté validado, usarlo principalmente
para shell inicial y después continuar desde GitHub.

## Pendiente Fase 8
- API real;
- persistencia;
- preview web;
- autenticación;
- ajustes visuales interactivos;
- despliegue.
