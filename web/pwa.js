/* Installation is a user action. No private project data is cached by this module. */
(()=>{
 const button=document.querySelector('#install-app'),dialog=document.querySelector('#install-help'),instructions=document.querySelector('#install-instructions'),connection=document.querySelector('#connection-status');
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 let promptEvent=null;
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 function update(){button.hidden=standalone();connection.hidden=navigator.onLine;}
 addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;update();});
 addEventListener('appinstalled',()=>{promptEvent=null;button.hidden=true;dialog.close();});
 matchMedia('(display-mode: standalone)').addEventListener('change',update);
 addEventListener('online',update);addEventListener('offline',update);
 button.addEventListener('click',async()=>{
  if(promptEvent){const event=promptEvent;promptEvent=null;try{await event.prompt();await event.userChoice;}catch{}update();return;}
  instructions.textContent=ios?'Abre esta página en Safari, pulsa Compartir y elige «Añadir a pantalla de inicio». Activa «Abrir como app web» si aparece y pulsa Añadir.':'Abre el menú del navegador y busca «Instalar SUES Vídeo» o «Añadir a pantalla de inicio». Si no aparece, utiliza Chrome o Edge actualizado en un dispositivo compatible.';
  dialog.showModal();
 });
 document.querySelector('#install-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
 update();
})();
