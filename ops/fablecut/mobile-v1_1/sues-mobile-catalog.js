/* SUES mobile: tool directory, shared with native MCP UI control. No editor mutations. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.SuesToolDirectory=api;})(typeof self!=="undefined"?self:this,function(){
"use strict";
const tools=Object.freeze([
 {id:"volume",name:"Volumen",aliases:"audio sonido bajar subir musica voz",kind:"inspector",field:"volume"},
 {id:"gain",name:"Ganancia",aliases:"db audio nivel",kind:"inspector",field:"gain"},
 {id:"mask",name:"Máscaras",aliases:"mascara recorte rostro b roll",kind:"section",heading:"mask"},
 {id:"scale",name:"Escala",aliases:"tamano ampliar reducir zoom hacer agrandar achicar",kind:"inspector",field:"scale"},
 {id:"opacity",name:"Opacidad",aliases:"transparencia",kind:"inspector",field:"opacity"},
 {id:"speed",name:"Velocidad",aliases:"lento rapido camara lenta",kind:"inspector",field:"speed"},
 {id:"rotation",name:"Rotación",aliases:"girar",kind:"inspector",field:"rotation"},
 {id:"fontSize",name:"Tamaño de texto",aliases:"letras subtitulos tamaño",kind:"inspector",field:"fontSize"},
 {id:"color",name:"Color",aliases:"texto fuente",kind:"inspector",field:"color"},
 {id:"split",name:"Dividir",aliases:"cortar fragmento clip",kind:"button",selector:"#btnSplit"},
 {id:"zoomTimeline",name:"Zoom de línea de tiempo",aliases:"timeline ampliar precision",kind:"button",selector:"#zoomSlider"},
 {id:"mixer",name:"Mezcla de audio",aliases:"mixer pistas",kind:"tab",tab:"mixer"},
 {id:"text",name:"Texto",aliases:"escribir editar palabras subtitulos",kind:"inspector",field:"text"},
 {id:"font",name:"Fuentes",aliases:"tipografia letras familia",kind:"inspector",field:"font"},
 {id:"textAnim",name:"Animación de texto",aliases:"animaciones entrar salir letras",kind:"inspector",field:"textAnim"},
 {id:"glow",name:"Brillo",aliases:"resplandor efecto texto",kind:"inspector",field:"glow"},
 {id:"strokeWidth",name:"Trazo",aliases:"contorno texto estilo",kind:"inspector",field:"strokeWidth"},
 {id:"transcript",name:"Transcripción",aliases:"voz palabras subtitulos",kind:"tab",tab:"transcript"},
]);
function norm(x){return String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function search(q){const query=norm(q);if(!query)return tools.slice(0,8);const parts=query.split(/\s+/);return tools.filter(t=>parts.every(w=>norm(t.name+" "+t.aliases).includes(w))).slice(0,8);}
function get(id){return tools.find(t=>t.id===id)||null;}
return {tools,search,get,norm};
});

