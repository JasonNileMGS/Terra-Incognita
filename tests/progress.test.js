import {test} from 'node:test';
import assert from 'node:assert/strict';
import {progressIndex, shiftDay, percentage, dateRange} from '../src/progress.js';
const record=(id,kind,payload)=>({id,kind,payload,version:1});
const habit=(id,createdOn,extra={})=>record(id,'habit',{title:id,createdOn,...extra});
const check=(habitId,date,done=true)=>record(`${habitId}:${date}`,'check',{habitId,date,done});
const map=(...rows)=>Object.fromEntries(rows.map(r=>[r.id,r]));

test('new habits do not invent missed days; current day is included',()=>{
 const p=progressIndex(map(habit('h','2026-10-20'),check('h','2026-10-20')),'2026-10-21');
 assert.equal(p.summary(7).habitsTotal,2);assert.equal(p.summary(7).consistency,50);
 assert.equal(p.day('2026-10-19').habitsTotal,0);
});
test('today remains open for the current streak, but a missed yesterday breaks it',()=>{
 const rows=map(habit('h','2026-10-17'),...['17','18','19','20'].map(d=>check('h',`2026-10-${d}`)));
 let p=progressIndex(rows,'2026-10-21');assert.deepEqual(p.streak(p.habits[0]),{current:4,best:4});
 rows['h:2026-10-21']=check('h','2026-10-21');p=progressIndex(rows,'2026-10-21');assert.deepEqual(p.streak(p.habits[0]),{current:5,best:5});
 p=progressIndex(rows,'2026-10-23');assert.deepEqual(p.streak(p.habits[0]),{current:0,best:5});
});
test('unchecking a day breaks the streak; future checks cannot extend it',()=>{
 const p=progressIndex(map(habit('h','2026-10-18'),check('h','2026-10-18'),check('h','2026-10-19',false),check('h','2026-10-20'),check('h','2026-10-21'),check('h','2026-10-22')),'2026-10-21');
 assert.deepEqual(p.streak(p.habits[0]),{current:2,best:2});assert.equal(p.summary(7).habitsDone,3);
});
test('archiving preserves history and removes future due days',()=>{
 const p=progressIndex(map(habit('h','2026-10-18',{deleted:true,archivedOn:'2026-10-20'}),check('h','2026-10-18'),check('h','2026-10-19')),'2026-10-21');
 assert.equal(p.summary(7).consistency,100);assert.equal(p.summary(7).habitsTotal,2);assert.equal(p.day('2026-10-20').habitsTotal,0);assert.deepEqual(p.streak(p.habits[0]),{current:0,best:2});
});
test('legacy habits start at earliest observed check; older archives use observed days only',()=>{
 const p=progressIndex(map(habit('h',undefined),check('h','2026-10-19'),habit('old',undefined,{deleted:true}),check('old','2026-10-17')),'2026-10-21');
 assert.equal(p.habits[0].start,'2026-10-19');assert.equal(p.summary(7).habitsTotal,4);assert.equal(p.day('2026-10-18').habitsTotal,0);
});
test('backfilled earlier check-ins extend a known habit lifetime',()=>{
 const p=progressIndex(map(habit('h','2026-10-21'),check('h','2026-10-19')),'2026-10-21');
 assert.equal(p.summary(7).habitsTotal,3);assert.equal(p.summary(7).habitsDone,1);
});
test('task statistics use assigned date, exclude deleted/future tasks, and count saved journal days',()=>{
 const p=progressIndex(map(record('a','task',{date:'2026-10-21',done:true}),record('b','task',{date:'2026-10-21',done:false}),record('c','task',{date:'2026-10-21',done:true,deleted:true}),record('d','task',{date:'2026-10-22',done:true}),record('j','journal',{date:'2026-10-20',wins:'One win\nAnother win',gratitude:'  ',reflection:'A lesson'})),'2026-10-21');
 const s=p.summary(7);assert.equal(s.tasksDone,1);assert.equal(s.tasksTotal,2);assert.equal(s.taskPercent,50);assert.equal(s.winDays,1);assert.equal(s.gratitudeDays,0);assert.equal(s.reflectionDays,1);assert.equal(s.activeDays,2);assert.equal(p.day('2026-10-21').percent,50);
});
test('empty data has no misleading 100 percent and calendar date math handles leap/year boundaries',()=>{
 assert.equal(percentage(0,0),null);assert.equal(progressIndex({},'2026-10-21').summary(7).consistency,null);
 assert.equal(shiftDay('2024-02-28',1),'2024-02-29');assert.equal(shiftDay('2026-12-31',1),'2027-01-01');assert.equal(shiftDay('2026-01-01',-1),'2025-12-31');
 assert.deepEqual(dateRange('2024-02-28','2024-03-01'),['2024-02-28','2024-02-29','2024-03-01']);
});
