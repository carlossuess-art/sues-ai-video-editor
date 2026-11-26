from pathlib import Path
import sys
p=Path(sys.argv[1])
f=p/'app.js'
s=f.read_text()
def rep(a,b):
 global s
 if s.count(a)!=1: raise SystemExit('anchor mismatch: '+a[:100])
 s=s.replace(a,b,1)
rep('if(/^(VO-|VOICE|VOZ|NARR)|\\b(voz|narraci[oó]n|voice)\\b/i.test(name)||getMedia(c.mediaId)?.kind==="video")return "Voz";','if(getMedia(c.mediaId)?.kind==="video")return "Audio original";\n  if(/^(VO-|VOICE|VOZ|NARR)|\\b(voz|narraci[oó]n|voice)\\b/i.test(name))return "Voz superpuesta";')
rep('if(clipMatte(c))return "Sujeto recortado";','if(clipMatte(c)||c.props?.masks?.length||c.props?.bgRemove)return "Sujeto recortado";')
rep('if(c.kind==="adjust")return "Efectos visuales";','if(c.kind==="adjust"){if(/^(CE[- ]|COLOR EMOCIONAL)/i.test(name))return "Color Emocional";if(/^(IL[- ]|ILUMINACI[ÓO]N)/i.test(name))return "Iluminación";return "Efectos visuales";}')
rep('if(c.kind==="comp"||c.kind==="shape"||c.kind==="svg"||/360|3D/i.test(name))return "Gráficos";','if(/^(FONDO|BG-|BACKGROUND)/i.test(name))return "Fondos";\n if(c.kind==="comp")return "Motion Graphics";\n if(c.kind==="shape"||c.kind==="svg"||/^(ELEMENTO|E-)|360|3D/i.test(name))return "Elementos";')
a=s.index('function suesRoleIcon(role)')
b=s.index('function suesRefreshTrackLabels()',a)
s=s[:a]+'''function suesRoleIcon(role){return ({"Audio original":"A","Voz superpuesta":"VS","Voz":"VS","Audio":"A","Audio mixto":"A","Audio libre":"A","Música":"M","Efectos sonoros":"SFX","Subtítulos":"ST","Títulos":"T","Texto":"T","Máscara de recorte":"MR","Sujeto recortado":"MR","Vídeo principal":"V","Vídeo":"V","B-roll":"BR","Imagen":"I","Elementos":"E","Fondos":"F","Motion Graphics":"MG","Gráficos":"MG","Efectos visuales":"VFX","Color Emocional":"CE","Iluminación":"IL"})[role]||"—"}
'''+s[b:]
rep('div.dataset.suesRole=role;div.title=role+', 'div.dataset.suesRole=role;div.dataset.suesFamily=suesRoleIcon(role);div.title=role+')
rep('h.dataset.suesRole=role;if(label)', 'h.dataset.suesRole=role;h.dataset.suesFamily=suesRoleIcon(role);if(label)')
f.write_text(s)
print('Native role/label patch applied')
