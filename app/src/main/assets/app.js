/* Noor Tasbeeh – offline-first, no external JavaScript dependencies. */
'use strict';
const STORE = 'noor_tasbeeh.v1';
const THEMES = [
  {key:'midnight',name:'Ocean Blue',swatch:'linear-gradient(135deg,#3e86ba,#0d284a)'},
  {key:'emerald',name:'Emerald',swatch:'linear-gradient(135deg,#1cbd87,#063c32)'},
  {key:'rose',name:'Rosewood',swatch:'linear-gradient(135deg,#ee8da0,#6c1e35)'},
  {key:'amber',name:'Amber',swatch:'linear-gradient(135deg,#f6c67c,#72400d)'},
  {key:'obsidian',name:'Onyx',swatch:'linear-gradient(135deg,#737f86,#121c23)'},
  {key:'violet',name:'Violet',swatch:'linear-gradient(135deg,#a78ce7,#33275f)'}
];
function newRecord(id,title,target=33,count=0){return {id,title,target,count};}
function defaults(){return {
  selected:'subhan',theme:'midnight',nightMode:false,sound:false,vibration:true,confirmReset:true,
  dhikr:[newRecord('subhan','SubhanAllah',33),newRecord('alham','Alhamdulillah',33),newRecord('akbar','Allahu Akbar',34),newRecord('astag','Astaghfirullah',100)],
  daily:{}, lastChangeDay:null
};}
const id = s => document.getElementById(s);
const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const digits = n => Number(n).toLocaleString('en-US');
const today = () => { const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
let data = load();
let currentPage = 'counter';
let toastTimer;
// Night Mode is a saved preference. Apply the dark counter treatment only on
// the counter page, so Settings / My Dhikr stay readable and usable.
function applyAppearance(){
  const active = data.nightMode === true && currentPage === 'counter';
  document.body.dataset.nightMode = data.nightMode ? 'on' : 'off';
  document.body.dataset.page = currentPage;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if(themeMeta) themeMeta.setAttribute('content', active ? '#000000' : '#071e2e');
  if(window.Android && typeof Android.setNightChrome === 'function'){
    try { Android.setNightChrome(active); } catch(_) { /* Browser preview */ }
  }
}
function cleanInput(raw) {
  if(!raw || typeof raw!=='object' || !Array.isArray(raw.dhikr)) return defaults();
  const base=defaults();
  const safeItems=raw.dhikr.filter(x=>x && typeof x.title==='string' && x.title.trim()).slice(0,1000).map(x=>({
    id:String(x.id||cryptoId()).replace(/[^A-Za-z0-9_-]/g,'').slice(0,80)||cryptoId(), title:x.title.trim().slice(0,90),
    count:clampInt(x.count,0,999999999),target:clampInt(x.target,0,999999999)
  }));
  if(!safeItems.length) return base;
  const daily={};
  if(raw.daily && typeof raw.daily==='object') Object.entries(raw.daily).slice(-365).forEach(([k,v])=>{if(/^\d{4}-\d{2}-\d{2}$/.test(k))daily[k]=clampInt(v,0,999999999);});
  return {selected: String(raw.selected||safeItems[0].id),theme:THEMES.some(x=>x.key===raw.theme)?raw.theme:base.theme,
    nightMode:raw.nightMode===true,sound:raw.sound===true,vibration:raw.vibration!==false,confirmReset:raw.confirmReset!==false,
    dhikr:safeItems,daily,lastChangeDay:raw.lastChangeDay||null};
}
function cryptoId(){return 'd'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function clampInt(v,min,max){let n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):min;}
function load(){try {const val=localStorage.getItem(STORE);return val?cleanInput(JSON.parse(val)):defaults();}catch(_){return defaults();}}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(data));}catch(_){toast('Could not save data. Check phone storage.');}}
function getActive(){return data.dhikr.find(x=>x.id===data.selected)||data.dhikr[0];}
function setActive(idValue){if(!data.dhikr.some(x=>x.id===idValue))return;data.selected=idValue;persist();render();showPage('counter');}
function showPage(page){if(!['counter','dhikr','settings'].includes(page))page='counter';currentPage=page;
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('selected',x.id==='nav-'+page));
  if(page==='dhikr')renderList();if(page==='settings')renderSettings();applyAppearance();window.scrollTo(0,0);
}
function render(){const a=getActive();if(!a)return;
  document.body.dataset.theme=data.theme;
  applyAppearance();
  id('active-dhikr-title').textContent=a.title;
  id('lcd-number').textContent=String(a.count).padStart(6,'0');
  id('current-count').textContent=digits(a.count);
  id('target-display').textContent=a.target?'/ '+digits(a.target):'· Unlimited';
  const ratio=a.target?Math.min(1,a.count/a.target):0;
  id('progress-bar-fill').style.width=(ratio*100).toFixed(2)+'%';
  id('meter-fill').style.strokeDashoffset=String(150.796*(1-ratio));
  id('progress-percent').textContent=a.target?Math.floor(ratio*100)+'%':'∞';
  id('today-total').textContent=digits(data.daily[today()]||0);
  document.title=a.title+' • Noor Tasbeeh';
}
function feedback(){if(window.Android&&typeof Android.feedback==='function'){
  try{Android.feedback(data.sound,data.vibration);return;}catch(_){/*browser fallback*/}
}
  if(data.vibration&&navigator.vibrate)navigator.vibrate(22);
  if(data.sound){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;window._audio=window._audio||new Ctx();const o=window._audio.createOscillator();const g=window._audio.createGain();o.type='sine';o.frequency.setValueAtTime(780,window._audio.currentTime);g.gain.setValueAtTime(.045,window._audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,window._audio.currentTime+.05);o.connect(g);g.connect(window._audio.destination);o.start();o.stop(window._audio.currentTime+.055);}catch(_){}}
}
function increment(){const a=getActive();if(a.count>=999999999){toast('Maximum count reached');return;}
  a.count++;let date=today();data.daily[date]=Math.min(999999999,(data.daily[date]||0)+1);data.lastChangeDay=date;
  persist();render();feedback();
  if(a.target>0&&a.count===a.target){if(data.vibration){if(window.Android&&Android.goalFeedback){try{Android.goalFeedback();}catch(_){}}else if(navigator.vibrate)navigator.vibrate([75,60,110]);}toast('Goal reached • MashaAllah ✦');}
}
function undo(){const a=getActive();if(a.count===0){toast('Count is already zero');return;}a.count--;
  if(data.lastChangeDay===today()&&data.daily[today()]>0)data.daily[today()]--;
  persist();render();toast('Last count undone');}
function confirmReset(){const a=getActive();if(!a.count){toast('Already at zero');return;}
  if(!data.confirmReset){resetCurrent();return;}
  showModal('Reset this counter?',`<p class="modal-copy">Your <strong>${escapeHtml(a.title)}</strong> counter will go back to zero. This action cannot be undone.</p><div class="modal-action-row"><button class="modal-btn" onclick="closeModal()">Cancel</button><button class="modal-btn primary" onclick="resetCurrent()">Reset counter</button></div>`);
}
function resetCurrent(){getActive().count=0;persist();render();closeModal();toast('Counter reset');}
function showModal(title,html){id('modal-title').textContent=title;id('modal-content').innerHTML=html;id('modal-backdrop').hidden=false;document.body.style.overflow='hidden';}
function closeModal(){id('modal-backdrop').hidden=true;document.body.style.overflow='';}
function dismissModal(event){if(event.target===id('modal-backdrop'))closeModal();}
function openSetCount(){const a=getActive();showModal('Set counting number',`<p class="modal-copy">Continue from a specific count for <strong>${escapeHtml(a.title)}</strong>.</p><div class="field"><label for="set-count-value">CURRENT COUNT</label><input type="number" inputmode="numeric" id="set-count-value" min="0" max="999999999" value="${a.count}"></div><div class="modal-action-row"><button class="modal-btn" onclick="closeModal()">Cancel</button><button class="modal-btn primary" onclick="saveSetCount()">Save count</button></div>`);}
function saveSetCount(){const f=id('set-count-value');if(!f.value.trim()||!/^\d+$/.test(f.value)||Number(f.value)>999999999){toast('Enter a number from 0 to 999,999,999');return;}getActive().count=clampInt(f.value,0,999999999);persist();render();closeModal();toast('Count updated');}
function renderList(){id('dhikr-list').innerHTML=data.dhikr.map(item=>`<article class="dhikr-card ${item.id===data.selected?'active-dhikr-card':''}"><div class="dhikr-card-top"><span class="dhikr-symbol">۞</span><span class="dhikr-card-title"><b>${escapeHtml(item.title)}</b><small>${item.target?digits(item.target)+' target':'Unlimited'} ${item.id===data.selected?' · Selected':''}</small></span><strong class="dhikr-count">${digits(item.count)}</strong></div><div class="dhikr-card-bottom"><button class="primary-button" data-action="select" data-id="${escapeHtml(item.id)}">${item.id===data.selected?'Continue counting':'Start counting'}</button><button data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button><button aria-label="Delete ${escapeHtml(item.title)}" data-action="delete" data-id="${escapeHtml(item.id)}">✕</button></div></article>`).join('');}
function openEditDhikr(itemId){const item=itemId?data.dhikr.find(x=>x.id===itemId):null;
  const selectedTarget=item?.target??33;
  showModal(item?'Edit dhikr':'New dhikr',`<div class="field"><label for="dhikr-name">DHIKR NAME</label><input id="dhikr-name" maxlength="90" placeholder="e.g. La ilaha illallah" value="${item?escapeHtml(item.title):''}"></div><div class="field"><label for="dhikr-target">TARGET</label><select id="dhikr-target"><option value="33" ${selectedTarget===33?'selected':''}>33 counts</option><option value="34" ${selectedTarget===34?'selected':''}>34 counts</option><option value="99" ${selectedTarget===99?'selected':''}>99 counts</option><option value="100" ${selectedTarget===100?'selected':''}>100 counts</option><option value="1000" ${selectedTarget===1000?'selected':''}>1,000 counts</option><option value="0" ${selectedTarget===0?'selected':''}>Unlimited</option><option value="custom" ${![0,33,34,99,100,1000].includes(selectedTarget)?'selected':''}>Custom target</option></select></div><div class="field" id="custom-target-field" style="display:${![0,33,34,99,100,1000].includes(selectedTarget)?'block':'none'}"><label for="custom-target">CUSTOM TARGET</label><input type="number" inputmode="numeric" id="custom-target" min="1" max="999999999" value="${item?.target||108}"></div><div class="modal-action-row"><button class="modal-btn" onclick="closeModal()">Cancel</button><button class="modal-btn primary" onclick="saveDhikr(${item?JSON.stringify(item.id):'null'})">${item?'Save changes':'Create dhikr'}</button></div>`);
  id('dhikr-target').addEventListener('change',()=>{id('custom-target-field').style.display=id('dhikr-target').value==='custom'?'block':'none';});
}
function saveDhikr(itemId){const name=id('dhikr-name').value.trim();if(!name){toast('Enter a dhikr name');return;}
  let target=id('dhikr-target').value;if(target==='custom')target=id('custom-target').value;
  if(!/^\d+$/.test(String(target))||Number(target)>999999999){toast('Enter a valid target');return;}
  target=clampInt(target,0,999999999);
  if(id('dhikr-target').value==='custom'&&target<1){toast('Custom target must be greater than zero');return;}
  let item=itemId?data.dhikr.find(x=>x.id===itemId):null;
  if(item){item.title=name;item.target=target;}else{item=newRecord(cryptoId(),name,target,0);data.dhikr.push(item);data.selected=item.id;}
  persist();render();renderList();closeModal();toast(itemId?'Dhikr updated':'Dhikr created');if(!itemId)showPage('counter');}
function requestDelete(itemId){if(data.dhikr.length===1){toast('Keep at least one dhikr');return;}
  let item=data.dhikr.find(x=>x.id===itemId);if(!item)return;
  showModal('Delete dhikr?',`<p class="modal-copy">Delete <strong>${escapeHtml(item.title)}</strong> and its saved count of <strong>${digits(item.count)}</strong>? This cannot be undone.</p><div class="modal-action-row"><button class="modal-btn" onclick="closeModal()">Cancel</button><button class="modal-btn primary" onclick="deleteDhikr(${JSON.stringify(item.id)})">Delete</button></div>`);
}
function deleteDhikr(itemId){data.dhikr=data.dhikr.filter(x=>x.id!==itemId);if(data.selected===itemId)data.selected=data.dhikr[0].id;persist();render();renderList();closeModal();toast('Dhikr deleted');}
function renderSettings(){id('night-mode-toggle').checked=data.nightMode;id('vibration-toggle').checked=data.vibration;id('sound-toggle').checked=data.sound;id('confirm-toggle').checked=data.confirmReset;
  id('theme-grid').innerHTML=THEMES.map(t=>`<button class="theme-choice ${data.theme===t.key?'active-theme':''}" data-theme-key="${t.key}"><span class="theme-swatch" style="background:${t.swatch}"></span><span>${t.name}</span></button>`).join('');}
function updateSettings(){data.nightMode=id('night-mode-toggle').checked;data.vibration=id('vibration-toggle').checked;data.sound=id('sound-toggle').checked;data.confirmReset=id('confirm-toggle').checked;persist();applyAppearance();toast('Preferences saved');}
function selectTheme(theme){if(!THEMES.some(x=>x.key===theme))return;data.theme=theme;persist();render();renderSettings();}
function exportBackup(){const backup=JSON.stringify({version:1,exportedAt:new Date().toISOString(),data},null,2);
 if(window.Android&&typeof Android.shareBackup==='function'){try{Android.shareBackup(backup);toast('Choose where to save or share backup');return;}catch(_){}}
 const blob=new Blob([backup],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='noor-tasbeeh-backup-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup exported');}
function openImport(){showModal('Import backup',`<p class="modal-copy">Paste a Noor Tasbeeh JSON backup here. Importing replaces your current saved counters. Export a backup first if you want to keep them.</p><div class="field"><label for="import-json">BACKUP JSON</label><textarea id="import-json" placeholder='{ "version": 1, "data": ... }'></textarea></div><div class="modal-action-row"><button class="modal-btn" onclick="closeModal()">Cancel</button><button class="modal-btn primary" onclick="importBackup()">Import</button></div>`);}
function importBackup(){try{const parsed=JSON.parse(id('import-json').value);if(!parsed||parsed.version!==1||!parsed.data||!Array.isArray(parsed.data.dhikr)||!parsed.data.dhikr.length)throw Error('format');data=cleanInput(parsed.data);if(!data.dhikr.some(x=>x.id===data.selected))data.selected=data.dhikr[0].id;persist();render();renderSettings();closeModal();showPage('counter');toast('Backup imported successfully');}catch(_){toast('Invalid backup. Please check JSON.');}}
function toast(message){const el=id('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2300);}
function appBack(){if(!id('modal-backdrop').hidden){closeModal();return true;}if(currentPage!=='counter'){showPage('counter');return true;}return false;}
window.appBack=appBack;
window.addEventListener('keydown',event=>{if(event.key==='Escape')appBack();else if((event.key===' '||event.key==='Enter')&&currentPage==='counter'&&id('modal-backdrop').hidden&&document.activeElement===document.body){event.preventDefault();increment();}});
id('dhikr-list').addEventListener('click',event=>{const btn=event.target.closest('button[data-action]');if(!btn)return;const itemId=btn.dataset.id;if(btn.dataset.action==='select')setActive(itemId);if(btn.dataset.action==='edit')openEditDhikr(itemId);if(btn.dataset.action==='delete')requestDelete(itemId);});
id('theme-grid').addEventListener('click',event=>{const btn=event.target.closest('button[data-theme-key]');if(btn)selectTheme(btn.dataset.themeKey);});
if(!data.dhikr.some(x=>x.id===data.selected))data.selected=data.dhikr[0].id;
render();
