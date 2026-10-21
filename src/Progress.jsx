import React, {useMemo, useState} from 'react';
import {today} from './model.js';
import {progressIndex, shiftDay} from './progress.js';

const pct = value => value === null ? '—' : `${value}%`;
const dateLabel = date => new Intl.DateTimeFormat('en-SG', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
const monthLabel = month => new Intl.DateTimeFormat('en-SG', {month:'long', year:'numeric', timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));
function Meter({value}) { return <div className="meter" aria-hidden="true"><span style={{width:`${value || 0}%`}}/></div>; }
function Stat({title, value, detail}) {return <article className="stat"><span>{title}</span><strong>{value}</strong><small>{detail}</small></article>;}

export function Dashboard({records, openDay}) {
  const [period, setPeriod] = useState(7);
  const now = today();
  const index = useMemo(() => progressIndex(records, now), [records, now]);
  const stats = index.summary(period), current = index.day(now);
  const goals = Object.values(records).filter(r => r.kind === 'goal' && !r.payload.deleted);
  const milestoneTotal = goals.reduce((n,g) => n + (g.payload.milestones || []).length, 0);
  const milestoneDone = goals.reduce((n,g) => n + (g.payload.milestones || []).filter(m=>m.done).length, 0);
  const activeHabits = index.habits.filter(h=>!h.payload.deleted);
  return <div className="progress-view">
    <div className="view-heading"><div><span className="eyebrow">YOUR PROGRESS, AT A GLANCE</span><h2>Keep your momentum.</h2><p className="muted">Small actions add up. Here’s what you’ve recorded.</p></div><label>Review period<select value={period} onChange={e=>setPeriod(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={28}>Last 28 days</option></select></label></div>
    <section className="today-panel"><div><span className="eyebrow">TODAY · {dateLabel(now)}</span><h2>{current.habitsDone} of {current.habitsTotal} habits checked</h2><p>{current.tasksDone} of {current.tasksTotal} tasks complete · {current.fields.length} of 3 journal fields saved</p></div><button className="primary" onClick={()=>openDay(now)}>Open today’s check-in →</button></section>
    <p className="muted">{dateLabel(shiftDay(now, 1-period))} – {dateLabel(now)} · includes today’s progress</p>
    <div className="stats-grid">
      <Stat title="Habit consistency" value={pct(stats.consistency)} detail={`${stats.habitsDone} of ${stats.habitsTotal} due checkboxes`}/>
      <Stat title="Tasks completed" value={stats.tasksDone} detail={`${pct(stats.taskPercent)} of ${stats.tasksTotal} tasks dated in this period`}/>
      <Stat title="Days with wins" value={stats.winDays} detail="Days with a saved win entry"/>
      <Stat title="Active days" value={`${stats.activeDays}/${period}`} detail="A habit, task, or journal action recorded"/>
      <Stat title="Reflection days" value={stats.reflectionDays} detail={`${stats.gratitudeDays} days with gratitude`}/>
      <Stat title="Goal progress · all time" value={`${milestoneDone}/${milestoneTotal}`} detail={`${goals.filter(g=>g.payload.done).length} of ${goals.length} goals marked complete`}/>
    </div>
    <section><h2>Your habit streaks <small>A fresh chance to keep showing up.</small></h2>
      {!activeHabits.length && <p>Add a daily habit in your check-in to start tracking streaks.</p>}
      {activeHabits.map(h=>{const s=index.streak(h);const days=stats.list.filter(d=>index.due(h,d.date));const done=days.filter(d=>index.checks.get(`${h.id}:${d.date}`)).length;return <article className="habit-progress" key={h.id}><div className="row"><b>{h.payload.title}</b><span className="streak-number">{s.current} day{s.current===1?'':'s'}</span></div><p className="muted">Current streak · best {s.best} days · {done}/{days.length} in this period</p><div className="habit-dots" aria-label="Daily habit history">{stats.list.map(d=><button key={d.date} className={`habit-dot ${index.checks.get(`${h.id}:${d.date}`)&&index.due(h,d.date)?'complete':index.due(h,d.date)?'missed':'not-due'}`} title={`${dateLabel(d.date)}: ${!index.due(h,d.date)?'not due':index.checks.get(`${h.id}:${d.date}`)?'complete':'not checked'}`} aria-label={`${h.payload.title}, ${dateLabel(d.date)}: ${!index.due(h,d.date)?'not due':index.checks.get(`${h.id}:${d.date}`)?'complete':'not checked'}`} onClick={()=>openDay(d.date)}>{d.date.slice(8)}</button>)}</div></article>;})}
      <p className="muted">Streaks count consecutive Singapore calendar days. Today stays open: yesterday’s streak remains current until today ends. Best streaks include your full recorded history.</p>
    </section>
    <div className="dashboard-columns"><section><h2>Recent wins</h2>{!stats.recentWins.length?<p className="muted">Save something that went well in your daily check-in.</p>:stats.recentWins.slice(0,5).map(d=><article className="win-entry" key={d.date}><button onClick={()=>openDay(d.date)}>{dateLabel(d.date)} →</button><p>{d.journal.wins}</p></article>)}</section><section><h2>Goals in motion</h2>{!goals.length?<p className="muted">Add a goal and small milestones in Goals.</p>:goals.map(g=>{const ms=g.payload.milestones||[],done=ms.filter(m=>m.done).length;return <article className="goal-summary" key={g.id}><b>{g.payload.title}</b><p className="muted">{g.payload.done?'Goal complete':`${done} of ${ms.length} milestones complete`}{g.payload.target?` · target ${dateLabel(g.payload.target)}`:''}</p><Meter value={ms.length?100*done/ms.length:g.payload.done?100:0}/></article>;})}</section></div>
    <details className="calculation-notes"><summary>How the numbers are counted</summary><p>Habit consistency is checked habits ÷ habits due in the period. New habits start on their creation date; earlier dated check-ins are included if you backfill. Legacy habits start at their first recorded check-in, or when tracking begins if none exist. Archiving stops future due days and preserves earlier progress. Older archived habits without dates count only their observed check-in days.</p><p>Task statistics use the task’s assigned date, not the time you ticked it. Removed tasks are excluded. Wins count days with a non-empty saved entry, not sentences. Journal fields count saved text, including any examples you kept. Future dates are excluded. Goal progress is the current all-time snapshot. No due entries displays “—”. Pending local changes appear here; the sync banner tells you whether they have reached the cloud.</p></details>
  </div>;
}

export function Calendar({records, openDay}) {
  const now = today();
  const [month,M] = useState(now.slice(0,7));
  const [selected,Select] = useState(now);
  const index=useMemo(()=>progressIndex(records,now),[records,now]);
  const first=`${month}-01`, date=new Date(`${first}T12:00:00Z`);
  const offset=(date.getUTCDay()+6)%7;
  const start=shiftDay(first,-offset);
  const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  const count=Math.ceil((offset+last)/7)*7;
  const days=Array.from({length:count},(_,i)=>shiftDay(start,i));
  const selectedDay=index.day(selected), future=selected>now;
  function move(n){const d=new Date(`${month}-01T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+n);M(d.toISOString().slice(0,7));}
  return <div className="progress-view"><div className="view-heading"><div><span className="eyebrow">THE BIGGER PICTURE</span><h2>Your progress calendar</h2><p className="muted">Select a day to review its habits, tasks, wins, and journal.</p></div><label>Jump to month<input type="month" value={month} onChange={e=>e.target.value&&M(e.target.value)}/></label></div>
    <section className="calendar-panel"><div className="calendar-toolbar"><button aria-label="Previous month" onClick={()=>move(-1)}>←</button><h2 aria-live="polite">{monthLabel(month)}</h2><button aria-label="Next month" onClick={()=>move(1)}>→</button><button onClick={()=>{M(now.slice(0,7));Select(now);}}>Today</button></div>
      <div className="calendar-weekdays" aria-hidden="true">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span key={d}>{d}</span>)}</div>
      <div className="month-grid" role="group" aria-label={monthLabel(month)}>{days.map(d=>{const info=index.day(d),future=d>now,other=d.slice(0,7)!==month;const level=future?'future':info.percent===100?'full':info.active?'partial':'empty';return <button key={d} aria-pressed={selected===d} aria-current={d===now?'date':undefined} aria-label={`${dateLabel(d)}${future?', future':`, ${info.habitsDone} of ${info.habitsTotal} habits, ${info.tasksDone} of ${info.tasksTotal} tasks, ${info.fields.length} journal fields`}`} className={`calendar-cell ${level} ${other?'outside':''} ${selected===d?'selected':''}`} onClick={()=>Select(d)}><span className="date-number">{Number(d.slice(8))}{d===now&&<i aria-hidden="true">•</i>}</span>{!future&&<><span className="cell-count">H {info.habitsDone}/{info.habitsTotal}</span><span className="cell-count">T {info.tasksDone}/{info.tasksTotal}</span><span className="cell-journal">{info.fields.map(f=><abbr title={f} key={f}>{f==='wins'?'W':f==='gratitude'?'G':'R'}</abbr>)}</span>{info.percent!==null&&<Meter value={info.percent}/>}</>}</button>;})}</div>
      <p className="calendar-legend"><span>H = habits · T = tasks</span><span>W = win · G = gratitude · R = reflection</span></p><p className="muted">Green: all due habits and dated tasks complete. Pale green: some activity. Bars show combined habit/task completion; journal entries are shown separately. Future days have no score.</p>
    </section>
    <section className="day-detail" aria-live="polite"><div className="view-heading"><div><h2>{dateLabel(selected)}</h2><p>{future?'Planned day':selectedDay.percent===null?'No habits or tasks due':`${selectedDay.percent}% of due habits and tasks complete`}</p></div><button className="primary" onClick={()=>openDay(selected)}>{future?'Plan this day':'Open daily check-in'} →</button></div>
      <div className="detail-columns"><div><h3>Habits · {selectedDay.habitsDone}/{selectedDay.habitsTotal}</h3>{!selectedDay.habits.length?<p className="muted">No habits due.</p>:selectedDay.habits.map(h=><p key={h.id}>{index.checks.get(`${h.id}:${selected}`)?'✓':'○'} {h.payload.title}{h.payload.deleted?' (archived)':''}</p>)}<h3>Tasks · {selectedDay.tasksDone}/{selectedDay.tasksTotal}</h3>{!selectedDay.tasks.length?<p className="muted">No tasks assigned.</p>:selectedDay.tasks.map(t=><p key={t.id}>{t.payload.done?'✓':'○'} {t.payload.title}</p>)}</div><div>{[['wins','Wins'],['gratitude','Gratitude'],['reflection','Reflection']].map(([f,label])=><div key={f}><h3>{label}</h3><p className="journal-preview">{selectedDay.journal[f]?.trim()||'No saved entry.'}</p></div>)}</div></div>
    </section></div>;
}
