const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(en,ru)=>ru;
const KEY='sat_official_worksheet_v1';
const state={attempt:null};
let catalog,active=null,current=0,pdfSource='',toastTimer;
function notice(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
function saved(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function persist(){if(!active)return;const all=saved();all[active.test]=active;localStorage.setItem(KEY,JSON.stringify(all));}
function documentURL(t,index){return t.pdf+(t.pages?.[index]?'#page='+t.pages[index]:'');}
function model(){return catalog.modules[active.index];}
function questionKey(index=current){return model().key+'-'+(index+1);}
function remaining(){return Math.max(0,Math.ceil(((active.stage==='break'?active.breakEnd:active.endsAt)-Date.now())/1000));}
function fmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function header(){return `<header class="topbar"><div class="logo"><div class="logo-icon">S</div><div>SAT PRACTICE<small>ОФИЦИАЛЬНЫЕ МАТЕРИАЛЫ</small></div></div><div class="topbar-actions"><a class="btn ghost small" href="./practice.html">Авторская тренировка</a><button class="btn ghost small" data-off="home">Все пробники</button></div></header>`;}
function footer(){return `<footer class="footer">Независимый сайт для подготовки. Официальные PDF открываются с сайта College Board. Этот интерфейс не является Bluebook.</footer>`;}
function link(url,label,style='secondary'){return `<a class="btn ${style}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;}
function home(){const all=saved();return `<div class="app-shell official-shell">${header()}<section class="official-intro"><div class="eyebrow">COLLEGE BOARD · SAT PRACTICE</div><h1>Настоящие задания.<br><span>Официальный уровень SAT.</span></h1><p>Восемь открытых пробников College Board — №4–11. Выбирай тест, открывай оригинальный PDF и записывай ответы здесь. Доступны таймер, отметки и плавающий калькулятор.</p><div class="official-facts"><span>120 вопросов</span><span>R&W: 33 + 33</span><span>Math: 27 + 27</span><span>39 / 43 минуты на модуль</span></div><div class="official-note">Это бумажные, неадаптивные версии SAT. Перехода на лёгкую или сложную ветку здесь нет. Официальная адаптивная тренировка доступна в Bluebook.</div><div class="official-links">${link('https://bluebook.collegeboard.org/students/practice','Адаптивный тест в Bluebook','outline-primary')}${link(catalog.source,'Источник и все материалы','ghost')}</div></section><section class="official-grid">${catalog.tests.map(t=>`<article class="official-card"><div class="eyebrow">SAT · COLLEGE BOARD</div><h2>Practice Test <span>#${t.id}</span></h2><p>Четыре модуля · оригинальный PDF · ключи и объяснения</p>${all[t.id]?`<div class="saved-label">${all[t.id].stage==='done'?'Есть завершённая попытка':'Есть сохранённая попытка'}</div>`:''}<div class="official-card-actions"><button class="btn primary" data-off="start" data-id="${t.id}">Начать тест</button>${all[t.id]?`<button class="btn secondary" data-off="resume" data-id="${t.id}">${all[t.id].stage==='done'?'Мои ответы':'Продолжить'}</button>`:''}${link(t.pdf,'Открыть PDF','ghost')}</div></article>`).join('')}</section>${footer()}</div>`;}
function start(id){const t=catalog.tests.find(t=>t.id===id);if(!t)return;if(saved()[id]&&!confirm('Заменить предыдущий лист ответов этого пробника новой попыткой?'))return;active={test:id,stage:'module',index:0,answers:{},flags:{},marks:{},endsAt:Date.now()+catalog.modules[0].seconds*1000,breakEnd:null};current=0;pdfSource=documentURL(t,0);persist();render();}
function endModule(){if(active.stage!=='module')return;active.endsAt=null;calcState.open=false;if(active.index===3){active.stage='done';active.completedAt=Date.now();}else if(active.index===1){active.stage='break';active.breakEnd=Date.now()+600000;}else{active.index++;active.stage='between';}persist();render();}
function resumeModule(){if(active.stage==='break'){active.index=2;active.breakEnd=null;}else if(active.stage!=='between')return;active.stage='module';active.endsAt=Date.now()+model().seconds*1000;current=0;pdfSource=documentURL(catalog.tests.find(t=>t.id===active.test),active.index);persist();render();}
function sync(){if(active?.stage==='module'&&remaining()===0){endModule();return;}if(active?.stage==='break'&&remaining()===0){active.stage='between';active.index=2;active.breakEnd=null;persist();render();}}
function controls(){const m=model(),key=questionKey(),value=active.answers[key]||'';return `<div class="official-answer"><div class="question-meta"><strong>Вопрос ${current+1} / ${m.questions}</strong><button class="linklike" data-off="flag">${active.flags[key]?'⚑ Отмечен':'⚐ Отметить'}</button></div><p>Прочитай вопрос ${current+1} в нужном модуле оригинального PDF.</p><div class="official-choice">${'ABCD'.split('').map(c=>`<button class="btn ${value===c?'primary':'secondary'}" data-off="answer" data-value="${c}" aria-pressed="${value===c}">${c}</button>`).join('')}</div>${m.section==='math'?`<label for="official-number">Или введи числовой ответ, если он требуется</label><input id="official-number" inputmode="decimal" type="text" maxlength="24" placeholder="Число или дробь" value="${esc('ABCD'.includes(value)&&value.length===1?'':value)}">`:''}<button class="btn ghost small" data-off="clear">Очистить ответ</button><div class="official-nav"><button class="btn secondary" data-off="prev" ${current===0?'disabled':''}>←</button><span>${current+1} / ${m.questions}</span><button class="btn primary" data-off="next" ${current===m.questions-1?'disabled':''}>→</button></div><div class="official-answer-grid">${Array.from({length:m.questions},(_,i)=>{const k=m.key+'-'+(i+1);return `<button class="qtile ${active.answers[k]?'answered':''} ${active.flags[k]?'flagged':''} ${i===current?'current':''}" data-off="question" data-id="${i}">${i+1}</button>`}).join('')}</div><button class="btn outline-primary full" data-off="finish">Завершить модуль</button><p class="footnote">Ответы сохраняются в этом браузере. Проверка — по официальному ключу после окончания теста.</p></div>`;}
function work(){const t=catalog.tests.find(t=>t.id===active.test),m=model();return `<div class="app-shell official-shell">${header()}<div class="test-header"><span class="tag">SAT #${active.test}</span><span class="tag muted">НЕАДАПТИВНЫЙ PDF</span><h2>${m.label}</h2><span style="flex:1"></span><span class="clock" id="official-clock">${fmt(remaining())}</span>${m.section==='math'?'<button class="btn secondary small" data-off="calc">Калькулятор</button>':''}</div><div class="official-document-bar">${link(documentURL(t,active.index),'Оригинальный PDF','primary')}<button class="btn secondary small" data-off="show-pdf">Показать PDF здесь</button><span class="footnote">Если просмотр не загрузился, открой оригинал в соседней вкладке.</span></div><div class="official-work"><section class="official-document"><iframe id="official-pdf" title="Официальный PDF SAT"></iframe><div class="official-pdf-placeholder"><strong>Задания находятся в оригинальном PDF College Board</strong><p>Нажми «Показать PDF здесь» или «Оригинальный PDF». Перелистай документ до ${m.label}.</p><p>Формулировки и графики сохраняются без изменений. Для загрузки нужен интернет.</p></div></section><aside id="official-answers">${controls()}</aside></div>${footer()}</div>`;}
function intermission(){const t=catalog.tests.find(t=>t.id===active.test);return `<div class="app-shell official-shell">${header()}<section class="between"><div class="eyebrow">SAT #${t.id}</div><h1>${active.stage==='break'?'Перерыв перед Math':'Модуль завершён'}</h1><p>${active.stage==='break'?'Можно отдохнуть до 10 минут или начать математику раньше.':'Следующий этап: '+model().label}</p>${active.stage==='break'?`<div class="clock" id="official-clock">${fmt(remaining())}</div>`:''}<button class="btn primary" data-off="continue">${active.stage==='break'?'Начать Math':'Начать следующий модуль'} →</button><p class="footnote">Задания следующего модуля находятся в том же оригинальном PDF.</p></section>${footer()}</div>`;}
function result(){const t=catalog.tests.find(t=>t.id===active.test),all=catalog.modules.flatMap(m=>Array.from({length:m.questions},(_,i)=>({m,key:m.key+'-'+(i+1),number:i+1})));const answered=all.filter(q=>active.answers[q.key]).length,marked=all.filter(q=>active.marks[q.key]===true).length,checked=all.filter(q=>typeof active.marks[q.key]==='boolean').length;return `<div class="app-shell official-shell">${header()}<section class="results-hero"><div><div class="eyebrow">SAT PRACTICE TEST #${t.id}</div><h1>Твой лист ответов</h1><p>Сверь ответы с официальным ключом. Затем используй таблицу именно этого пробника для оценки диапазона баллов.</p><div class="official-links">${link(t.key,'Официальный ключ и шкала','primary')}${link(t.explanations,'Объяснения','secondary')}${link(t.pdf,'Задания','ghost')}</div></div><div class="scorebig"><strong>${answered}</strong><span>ОТВЕТОВ ИЗ 120</span></div></section><div class="official-note">Здесь нет автоматического пересчёта в баллы SAT и потолка 600. Отметки «Верно / Ошибка» ниже ты ставишь сам после сверки. Проверено: ${checked} / 120; отмечено верных: ${marked}.</div><button class="btn secondary" data-off="export">Скачать мои ответы</button>${catalog.modules.map(m=>`<section class="official-review-section"><h2>${m.label}</h2>${all.filter(q=>q.m.key===m.key).map(q=>`<div class="official-review-row"><strong>${q.number}</strong><span>${esc(active.answers[q.key]||'Нет ответа')} ${active.flags[q.key]?'⚑':''}</span><div><button class="btn small ${active.marks[q.key]===true?'primary':'ghost'}" data-off="mark-correct" data-value="${q.key}">Верно</button><button class="btn small ${active.marks[q.key]===false?'primary':'ghost'}" data-off="mark-wrong" data-value="${q.key}">Ошибка</button></div></div>`).join('')}</section>`).join('')}${footer()}</div>`;}
function render(){state.attempt=active?.stage==='module'?{stage:'module',module:{section:model().section}}:null;const root=$('#app');root.innerHTML=!active?home():active.stage==='done'?result():active.stage==='module'?work():intermission();syncCalculator();if(active?.stage==='module'&&pdfSource){const frame=$('#official-pdf');frame.src=pdfSource;frame.classList.add('loaded');frame.nextElementSibling.hidden=true;}}
function updateAnswers(){const scroll=window.scrollY;$('#official-answers').innerHTML=controls();window.scrollTo(0,scroll);}
function act(name,id,value){try{switch(name){
 case 'home':if(active?.stage==='module'&&!confirm('Вернуться к выбору? Таймер продолжит идти.'))return;active=null;calcState.open=false;render();break;
 case 'start':start(Number(id));break;
 case 'resume':active=saved()[Number(id)];if(active){current=0;pdfSource=documentURL(catalog.tests.find(t=>t.id===active.test),active.index);sync();render();}break;
 case 'answer':active.answers[questionKey()]=value;persist();updateAnswers();break;
 case 'clear':delete active.answers[questionKey()];persist();updateAnswers();break;
 case 'flag':active.flags[questionKey()]=!active.flags[questionKey()];persist();updateAnswers();break;
 case 'question':current=Number(id);updateAnswers();break;
 case 'next':current=Math.min(current+1,model().questions-1);updateAnswers();break;
 case 'prev':current=Math.max(0,current-1);updateAnswers();break;
 case 'finish':{const count=Array.from({length:model().questions},(_,i)=>active.answers[questionKey(i)]).filter(Boolean).length;if(confirm(`Завершить модуль? Ответов: ${count} из ${model().questions}. Вернуться к нему будет нельзя.`))endModule();break;}
 case 'continue':resumeModule();break;
 case 'show-pdf':{const t=catalog.tests.find(t=>t.id===active.test);pdfSource=documentURL(t,active.index);const frame=$('#official-pdf');frame.src=pdfSource;frame.classList.add('loaded');frame.nextElementSibling.hidden=true;break;}
 case 'calc':toggleCalculator();break;
 case 'mark-correct':active.marks[value]=true;persist();render();break;
 case 'mark-wrong':active.marks[value]=false;persist();render();break;
 case 'export':{const text=catalog.modules.map(m=>m.label+'\n'+Array.from({length:m.questions},(_,i)=>`${i+1}: ${active.answers[m.key+'-'+(i+1)]||'—'}`).join('\n')).join('\n\n');const a=document.createElement('a');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.href=url;a.download=`SAT-${active.test}-my-answers.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
 }}catch(e){notice(e.message);}}
async function action(name){if(name!=='calc-run')return;const input=$('#calc-input'),out=$('#calc-result');try{out.textContent='= '+calcExpression(input.value);}catch{out.textContent='Неверное выражение';}calcState.expression=input.value;calcState.result=out.textContent;}
document.addEventListener('click',event=>{const button=event.target.closest('[data-off]');if(button)act(button.dataset.off,button.dataset.id,button.dataset.value);});
document.addEventListener('input',event=>{if(event.target.id!=='official-number'||active?.stage!=='module')return;const value=event.target.value;active.answers[questionKey()]=value;persist();for(const button of document.querySelectorAll('[data-off="answer"]')){button.classList.remove('primary');button.classList.add('secondary');button.setAttribute('aria-pressed','false');}document.querySelector('[data-off="question"][data-id="'+current+'"]')?.classList.toggle('answered',!!value.trim());});
setInterval(()=>{if(!active||!['module','break'].includes(active.stage))return;sync();const clock=$('#official-clock');if(clock)clock.textContent=fmt(remaining());},500);

function calcExpression(source){
 const s=source.replace(/\s+/g,'').replace(/×/g,'*').replace(/÷/g,'/');
 if(s.length>120||!s)throw Error('Invalid expression');
 const token=s.match(/(?:\d+\.\d*|\.\d+|\d+)|sqrt|abs|pi|[()+\-*/^]/g);
 if(!token||token.join('')!==s)throw Error('Invalid characters');let pos=0;
 function atom(){const t=token[pos++];if(t==='pi')return Math.PI;if(t==='sqrt'||t==='abs'){if(token[pos++]!=='(')throw Error('Missing (');const x=sum();if(token[pos++]!==')')throw Error('Missing )');return t==='sqrt'?Math.sqrt(x):Math.abs(x)}if(t==='('){const x=sum();if(token[pos++]!==')')throw Error('Missing )');return x}if(!t||!/^\d|^\.\d/.test(t))throw Error('Missing number');return Number(t)}
 function power(){const x=atom();return token[pos]==='^'?(pos++,Math.pow(x,unary())):x}
 function unary(){if(token[pos]==='+'){pos++;return unary()}if(token[pos]==='-'){pos++;return -unary()}return power()}
 function product(){let x=unary();while(token[pos]==='*'||token[pos]==='/'){const op=token[pos++],y=unary();x=op==='*'?x*y:x/y}return x}
 function sum(){let x=product();while(token[pos]==='+'||token[pos]==='-'){const op=token[pos++],y=product();x=op==='+'?x+y:x-y}return x}
 const r=sum();if(pos!==token.length||!Number.isFinite(r))throw Error('Invalid calculation');return Number(r.toPrecision(12));
}

const calcState={open:false,x:null,y:100,expression:'',result:'',collapsed:false};
let calcWindow=null;
function clampCalculator(){
 if(!calcWindow)return;const rect=calcWindow.getBoundingClientRect();
 const maxX=Math.max(8,window.innerWidth-rect.width-8),maxY=Math.max(8,window.innerHeight-rect.height-8);
 calcState.x=Math.max(8,Math.min(calcState.x??window.innerWidth-rect.width-20,maxX));
 calcState.y=Math.max(8,Math.min(calcState.y,maxY));
 calcWindow.style.left=calcState.x+'px';calcWindow.style.top=calcState.y+'px';
}
function syncCalculator(){
 const visible=calcState.open&&state.attempt?.stage==='module'&&state.attempt.module?.section==='math';
 if(!visible){if(calcWindow)calcWindow.hidden=true;return;}
 if(!calcWindow){
  calcWindow=document.createElement('section');calcWindow.id='calculator-window';calcWindow.className='calculator-window';
  calcWindow.setAttribute('role','dialog');calcWindow.setAttribute('aria-label','Movable calculator');calcWindow.setAttribute('aria-modal','false');
  calcWindow.innerHTML=`<div class="calculator-titlebar" id="calc-drag" tabindex="0" role="button" aria-label="Move calculator. Drag or use arrow keys."><strong>⠿ ${tr('Calculator','Калькулятор')}</strong><span><button class="calc-control" data-calc="collapse" aria-label="Minimize">−</button><button class="calc-control" data-calc="close" aria-label="Close calculator">✕</button></span></div><div class="calculator-body"><p class="calc-help">${tr('Drag the title bar to move.','Перетащи за заголовок, чтобы переместить.')}</p><div class="calc-inline"><input id="calc-input" aria-label="Expression" placeholder="sqrt(81) + 2^3" autocomplete="off" value="${esc(calcState.expression)}"><button class="btn primary small" data-calc="run">=</button></div><output id="calc-result" class="calc-result" aria-live="polite">${esc(calcState.result)}</output><div class="calc-keys">${['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','(',')','sqrt(','^','pi','+'].map(key=>`<button data-calc="key" data-key="${key}">${key}</button>`).join('')}</div><div class="calculator-actions"><button class="btn small ghost" data-calc="clear">C</button><button class="btn small ghost" data-calc="back" aria-label="Backspace">⌫</button><button class="btn small secondary" data-calc="desmos">Desmos ↗</button></div><div id="desmos-container" hidden><p class="footnote">${tr('Online graphing calculator · Internet required','Графический калькулятор · нужен интернет')}</p><iframe title="Desmos Graphing Calculator" class="desmos-frame" referrerpolicy="no-referrer"></iframe></div></div>`;
  document.body.appendChild(calcWindow);
  const drag=calcWindow.querySelector('#calc-drag');let moving=null;
  drag.addEventListener('pointerdown',e=>{if(e.target.closest('button')||(e.pointerType==='mouse'&&e.button!==0))return;const r=calcWindow.getBoundingClientRect();moving={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};drag.setPointerCapture(e.pointerId);calcWindow.classList.add('dragging');e.preventDefault();});
  drag.addEventListener('pointermove',e=>{if(!moving||moving.id!==e.pointerId)return;calcState.x=e.clientX-moving.dx;calcState.y=e.clientY-moving.dy;clampCalculator();});
  const stop=()=>{moving=null;calcWindow.classList.remove('dragging')};
  drag.addEventListener('pointerup',stop);drag.addEventListener('pointercancel',stop);drag.addEventListener('lostpointercapture',stop);
  drag.addEventListener('keydown',e=>{if(e.target!==drag)return;const keys={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};if(keys[e.key]){e.preventDefault();calcState.x+=keys[e.key][0];calcState.y+=keys[e.key][1];clampCalculator();}});
  calcWindow.addEventListener('click',e=>{const target=e.target.closest('[data-calc]');if(!target)return;const input=calcWindow.querySelector('#calc-input');switch(target.dataset.calc){
   case 'close':calcState.open=false;calcWindow.hidden=true;document.querySelector('[data-act="calculator"]')?.focus();break;
   case 'collapse':calcState.collapsed=!calcState.collapsed;calcWindow.classList.toggle('collapsed',calcState.collapsed);clampCalculator();break;
   case 'run':action('calc-run');break;
   case 'clear':input.value='';calcState.expression='';calcState.result='';calcWindow.querySelector('#calc-result').textContent='';input.focus();break;
   case 'back':input.value=input.value.slice(0,-1);calcState.expression=input.value;input.focus();break;
   case 'key':{const key=target.dataset.key.replace('−','-');const start=input.selectionStart??input.value.length;const end=input.selectionEnd??start;input.value=input.value.slice(0,start)+key+input.value.slice(end);calcState.expression=input.value;input.focus();input.setSelectionRange(start+key.length,start+key.length);break;}
   case 'desmos':{const box=calcWindow.querySelector('#desmos-container');box.hidden=!box.hidden;if(!box.hidden){box.querySelector('iframe').src='https://www.desmos.com/calculator?embed';}clampCalculator();break;}
  }});
  calcWindow.addEventListener('input',e=>{if(e.target.id==='calc-input')calcState.expression=e.target.value;});
  calcWindow.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='calc-input'){e.preventDefault();action('calc-run');}if(e.key==='Escape'){calcState.open=false;calcWindow.hidden=true;document.querySelector('[data-act="calculator"]')?.focus();}});
  if(typeof ResizeObserver==='function')new ResizeObserver(clampCalculator).observe(calcWindow);
 }
 calcWindow.hidden=false;clampCalculator();
}
function toggleCalculator(){calcState.open=!calcState.open;syncCalculator();if(calcState.open)calcWindow?.querySelector('#calc-input').focus();}
window.addEventListener('resize',clampCalculator);

fetch("./official-tests.json").then(r=>{if(!r.ok)throw Error("Материалы недоступны");return r.json()}).then(data=>{catalog=data;render()}).catch(error=>{$("#app").innerHTML="<div class=\"boot\">"+esc(error.message)+"</div>"});
