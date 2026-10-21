import {test} from 'node:test';
import assert from 'node:assert/strict';
import {today,reconcile,emptyState} from '../src/model.js';
test('Singapore midnight is independent of device timezone',()=>{
 assert.equal(today(new Date('2026-10-20T15:59:59Z')),'2026-10-20');
 assert.equal(today(new Date('2026-10-20T16:00:00Z')),'2026-10-21');
});
test('remote newer edit preserves offline text and exposes conflict',()=>{
 const s=emptyState();s.records.a={id:'a',version:1,payload:{reflection:'offline'}};s.pending.a=true;
 const r=reconcile(s,[{id:'a',version:2,payload:{reflection:'other phone'}}]);
 assert.equal(r.records.a.payload.reflection,'offline');assert.equal(r.conflicts.a.payload.reflection,'other phone');assert.equal(r.pending.a,true);
 assert.deepEqual(s.conflicts,{});
});
test('unchanged server version permits queued edit; clean records refresh',()=>{
 const s=emptyState();s.records.a={id:'a',version:1,payload:{wins:'new'}};s.pending.a=true;
 const r=reconcile(s,[{id:'a',version:1,payload:{wins:'old'}},{id:'b',version:3,payload:{done:true}}]);
 assert.equal(r.records.a.payload.wins,'new');assert.equal(r.records.b.version,3);assert.deepEqual(r.conflicts,{});
});
