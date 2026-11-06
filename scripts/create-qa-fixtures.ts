// Optional, disposable browser-QA journals. Never touches the browser's save.
import { mkdir, writeFile } from 'node:fs/promises';
import { initialSave } from '../src/game/state';
import { createMaze, shortestPath } from '../src/game/maze';
await mkdir('test-results', { recursive: true });
const fresh=initialSave();
await writeFile('test-results/new-journal.json',JSON.stringify(fresh,null,2));
const route=shortestPath(createMaze(fresh.seed));
let chain:Record<string,unknown>|undefined;
for(let i=route.length-1;i>=0;i--)chain={type:'academy_move',id:`route-${i}`,fields:{DIRECTION:route[i]},...(chain?{next:{block:chain}}:{})};
const blocks={...fresh,blocks:{blocks:{languageVersion:0,blocks:[{...chain,x:30,y:30}]}}};
await writeFile('test-results/block-route.json',JSON.stringify(blocks,null,2));
await writeFile('test-results/invalid-journal.json',JSON.stringify({...fresh,version:999}));
console.log(`Created disposable journals, including a ${route.length}-move block program.`);
