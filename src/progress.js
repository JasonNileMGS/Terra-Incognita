import {today} from './model.js';

export function shiftDay(date, count) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export function dateRange(start, end) {
  const dates = [];
  for (let date = start; date <= end; date = shiftDay(date, 1)) dates.push(date);
  return dates;
}
export const percentage = (done, total) => total ? Math.round(100 * done / total) : null;

export function progressIndex(records, asOf = today()) {
  const rows = Object.values(records);
  const checks = new Map();
  const firstCheck = new Map();
  for (const row of rows) {
    const p = row.payload;
    if (row.kind !== 'check' || p.deleted || !p.date || p.date > asOf) continue;
    checks.set(`${p.habitId}:${p.date}`, !!p.done);
    if (!firstCheck.has(p.habitId) || p.date < firstCheck.get(p.habitId)) firstCheck.set(p.habitId, p.date);
  }
  const habits = rows.filter(r => r.kind === 'habit').map(r => {
    const start = [r.payload.createdOn, firstCheck.get(r.id)].filter(Boolean).sort()[0] || asOf;
    return {...r, start};
  });
  function due(habit, date) {
    const p = habit.payload;
    // Old archived records have no lifetime metadata. Count only their observed dates.
    if (p.deleted && !p.archivedOn) return checks.has(`${habit.id}:${date}`);
    return date >= habit.start && (!p.archivedOn || date < p.archivedOn);
  }
  const tasksByDay = new Map(), journalsByDay = new Map();
  for (const row of rows) {
    if (row.payload.deleted) continue;
    const date = row.payload.date;
    if (!date) continue;
    if (row.kind === 'task') tasksByDay.set(date, [...(tasksByDay.get(date) || []), row]);
    if (row.kind === 'journal') journalsByDay.set(date, row.payload);
  }
  function day(date) {
    const eligible = habits.filter(h => due(h, date));
    const done = eligible.filter(h => checks.get(`${h.id}:${date}`)).length;
    const tasks = tasksByDay.get(date) || [];
    const tasksDone = tasks.filter(t => t.payload.done).length;
    const journal = journalsByDay.get(date) || {};
    const fields = ['wins', 'gratitude', 'reflection'].filter(f => journal[f]?.trim());
    return {date, habits: eligible, habitsDone: done, habitsTotal: eligible.length, tasks, tasksDone,
      tasksTotal: tasks.length, journal, fields, percent: percentage(done + tasksDone, eligible.length + tasks.length),
      active: done > 0 || tasksDone > 0 || fields.length > 0};
  }
  function streak(habit) {
    const end = habit.payload.archivedOn ? shiftDay(habit.payload.archivedOn, -1) : asOf;
    let run = 0, best = 0;
    for (const d of dateRange(habit.start, end)) {
      run = due(habit, d) && checks.get(`${habit.id}:${d}`) ? run + 1 : 0;
      best = Math.max(best, run);
    }
    let current = 0;
    if (!habit.payload.deleted) {
      let d = checks.get(`${habit.id}:${asOf}`) ? asOf : shiftDay(asOf, -1);
      while (d >= habit.start && due(habit, d) && checks.get(`${habit.id}:${d}`)) {
        current++; d = shiftDay(d, -1);
      }
    }
    return {current, best};
  }
  function summary(days) {
    const list = dateRange(shiftDay(asOf, 1 - days), asOf).map(day);
    const sum = key => list.reduce((total, d) => total + d[key], 0);
    const habitsDone = sum('habitsDone'), habitsTotal = sum('habitsTotal');
    const tasksDone = sum('tasksDone'), tasksTotal = sum('tasksTotal');
    return {list, habitsDone, habitsTotal, consistency: percentage(habitsDone, habitsTotal), tasksDone, tasksTotal,
      taskPercent: percentage(tasksDone, tasksTotal), activeDays: list.filter(d => d.active).length,
      winDays: list.filter(d => d.fields.includes('wins')).length,
      gratitudeDays: list.filter(d => d.fields.includes('gratitude')).length,
      reflectionDays: list.filter(d => d.fields.includes('reflection')).length,
      recentWins: list.filter(d => d.fields.includes('wins')).reverse()};
  }
  return {habits, checks, due, day, streak, summary};
}
