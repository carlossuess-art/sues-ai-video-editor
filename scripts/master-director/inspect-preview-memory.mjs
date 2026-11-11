// Operator-only diagnostic for sandbox/preview capacity. Reads kernel data; does not render.
import {inspectMasterPreviewMemoryBudget} from '../../src/master-director-memory-budget.js';
const report=inspectMasterPreviewMemoryBudget();
process.stdout.write(JSON.stringify({schema:'sues-master-memory-inspection/v1',checkedAt:new Date().toISOString(),...report},null,2)+'\n');
if(!report.ok)process.exitCode=2;
