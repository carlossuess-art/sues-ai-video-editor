import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {compileTemplatePolicy} from '../../src/template.js';
import {buildCinematicBrollPlan} from '../../src/cinematic-style.js';
const [inputPath,outputPath]=process.argv.slice(2);
if(!inputPath||!outputPath){console.error('Usage: npm run template:calma -- <input.json> <output.json>');process.exit(1);}
try{
 const read=path=>JSON.parse(readFileSync(path,'utf8'));
 const input=read(inputPath);
 const policy=compileTemplatePolicy(read(input.templatePath),read(input.brandKitPath));
 const plan=buildCinematicBrollPlan({policy,duration:input.duration,slots:input.slots,assets:input.assets});
 mkdirSync(dirname(outputPath),{recursive:true});writeFileSync(outputPath,JSON.stringify({policy,plan},null,2)+'\n');
 console.log(`Prepared ${plan.decisions.filter(x=>x.type==='broll').length} b-roll decisions; renderReady=false; ${outputPath}`);
}catch(error){console.error(error.message);process.exit(1);}
