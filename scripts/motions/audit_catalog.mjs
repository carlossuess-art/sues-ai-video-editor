import {readFileSync} from 'node:fs';
import {RENDERED_MOTIONS} from '../../src/semantic-render.js';
import {auditMotionCapabilities} from '../../src/motion-capabilities.js';
const catalog=JSON.parse(readFileSync(new URL('../../examples/motions/catalog.sample.json',import.meta.url)));
const report=auditMotionCapabilities(catalog,RENDERED_MOTIONS);
console.log(JSON.stringify({version:'1.0',purpose:'read-only capability audit, not rendered output',rendered:report.filter(x=>x.renderStatus==='implemented').length,contractOnly:report.filter(x=>x.renderStatus==='contract-only').length,assets:report},null,2));
