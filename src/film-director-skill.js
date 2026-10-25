import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
const skillURL=new URL('../skills/sues-ai-film-director/SKILL.md',import.meta.url);
export function loadFilmDirectorSkill(catalog){
 if(catalog?.schema!=='sues-edit-plan/v1'||catalog.timeSpace!=='original-seconds')
  throw Error('Film director: unknown execution contract or time space');
 const stat=lstatSync(skillURL);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>32768)throw Error('Film director: invalid skill file');
 const document=readFileSync(skillURL,'utf8');
 const section=/^## Política operativa\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(document)?.[1]?.trim();
 if(!document.startsWith('---\nname: sues-ai-film-director\n')||!section||section.length>6000)
  throw Error('Film director: missing bounded operating policy');
 return {schema:'sues-film-director-context/v1',skillPath:'skills/sues-ai-film-director/SKILL.md',
  skillSha256:createHash('sha256').update(document).digest('hex'),policy:section,
  executionContract:catalog.schema,timeSpace:catalog.timeSpace,
  availableActionTypes:[...new Set(Object.values(catalog.actions??{}).map(a=>a.type))].sort(),
  unsupported:structuredClone(catalog.unsupported??[]),
  scope:'caption-emphasis-only',autonomousCreativeApproval:false};
}
