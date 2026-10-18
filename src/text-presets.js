export const TEXT_PRESETS=Object.freeze({
 white:{name:'Blanco',color:'#FFFFFF'},
 yellow:{name:'Amarillo',color:'#FFE45E'},
 red:{name:'Rojo',color:'#FF7777'},
 gold:{name:'Oro',colors:['#876024','#B98A39','#E4BE70','#FFF0C0','#FFFBE8','#BF9346','#795321','#C99F50','#F1D695']},
 green:{name:'Verde',colors:['#176638','#40BE64','#B1FF9D','#F1FFE9','#83FA77','#279D47','#155C2D','#55D667','#D0FFC4']},
 cyan:{name:'Cian',colors:['#176376','#36C0DA','#B2F6FF','#F1FEFF','#67E2F0','#258AA9','#174D67','#57CADD','#D4FAFF']},
 blue:{name:'Azul',colors:['#243F85','#5479D5','#B0D2FF','#F1F7FF','#78A2EE','#395FA8','#21366B','#638CDB','#D3E4FF']},
 coral:{name:'Coral',colors:['#84453C','#D87D69','#F9C0A5','#FFF0D8','#FFD0B8','#BC695A','#753D39','#DB8C74','#FFE1C6'],italic:true},
 oblique:{name:'Blanco inclinado',color:'#FFFFFF',italic:true},
 condensed:{name:'Blanco estrecho',color:'#FFFFFF',scaleX:74}
});
export function keywordPreset(keyword){return TEXT_PRESETS[keyword?.style]??TEXT_PRESETS[keyword?.level==='exceptional'?'gold':'white'];}
export function validateKeywordOverrides(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>500)throw new Error('Keyword overrides: object required');
 for(const [id,v]of Object.entries(value)){
  if(!/^seg-\d{3,}$/.test(id)||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['word','level','style'].includes(k))||!['none','important','exceptional'].includes(v.level))throw new Error('Keyword override invalid');
  if(v.level!=='none'&&(!Number.isInteger(v.word)||v.word<0||v.word>20||!Object.hasOwn(TEXT_PRESETS,v.style)))throw new Error('Keyword position/style invalid');
 }
 return structuredClone(value);
}
