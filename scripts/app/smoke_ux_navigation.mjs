// Legacy task-step smoke entry point. The persistent-player workflow supersedes it.
// Preserve PROJECT NEW_OUTPUT arguments while exercising actual upload/playback.
import {loadProject} from '../../src/local-pipeline.js';
import {resolve} from 'node:path';
const [config,destination]=process.argv.slice(2);
if(!destination)throw Error('Usage: PROJECT NEW_OUTPUT');
const project=loadProject(resolve(config));
process.argv=[process.argv[0],process.argv[1],resolve(config),project.sourcePath,resolve(destination)];
await import('./smoke_player_workflow.mjs');
