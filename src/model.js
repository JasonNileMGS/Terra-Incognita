export function today(now=new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function reconcile(state, rows) {
 const next=structuredClone(state); next.conflicts={};
 for(const row of rows){
  const local=next.records[row.id];
  if(!local || !next.pending[row.id]) next.records[row.id]=row;
  else if(local.version!==row.version) next.conflicts[row.id]=row;
 }
 return next;
}
export const emptyState=()=>({records:{},pending:{},conflicts:{}});
