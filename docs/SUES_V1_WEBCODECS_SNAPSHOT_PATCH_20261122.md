SUES V1 · diferencias de la candidata QA WebCodecs sobre app-webcodecs40-candidate, 22/11/2026.
Este archivo es documentación; no aplicar directamente en producción.

app.js
1. En syncFromServer(): comprobar runtime.exportSnapshotLock en el guard inicial, además de state.gesture/state.exporting.
2. Inmediatamente después de "const data = await res.json();" dentro de syncFromServer():
   if (state.gesture || state.exporting || runtime.exportSnapshotLock) { runtime.pendingSync = true; return false; }
3. En runExportJob(ticket) -> if(ticket.snapshot): activar runtime.exportSnapshotLock = true antes de applyProject(ticket.snapshot).
4. En finally de runExportJob: runtime.exportSnapshotLock = false.
5. En finally de runAudioOnlyJob: runtime.exportSnapshotLock = false.

sues-segmented-export.js
6. En la firma createSegmentedExports, admitir encoderProfile='delivery'.
7. Mostrar el profile:encoderProfile en view().
8. Invocar child(j,{kind:'export',range:'entire',profile:encoderProfile,videoOnly:true,window:w}) en lugar de fijar delivery.

server.js — únicamente candidata aislada
9. En createSegmentedExports, declarar encoderProfile:'webcodecs' para ensayar WebCodecs real.

QA real 22/11 snapshot-e2e-v8-qa.json: ok true; SSIM 1.0 en 15 frames con edición concurrente; audio AAC; 55.5s exportación. Código exacto inspeccionable en VPS /opt/sues-secure-headless-qa-20261122/app-snapshot-webcodecs-v8-qa. No desplegado.
