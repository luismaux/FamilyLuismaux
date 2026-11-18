
// Configuración del proyecto de Firebase
const firebaseConfig={
  apiKey:"AIzaSyAghkC6qMKURoWZfyXtifMQd73soe03cKU",
  authDomain:"familyluismaux.firebaseapp.com",
  databaseURL:"https://familyluismaux-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:"familyluismaux",
  storageBucket:"familyluismaux.firebasestorage.app",
  messagingSenderId:"236987957661",
  appId:"1:236987957661:web:a766a4b706f7eabd1aaf74"
};

const CATS={
"Frutas y verduras":["manzana","plátano","platano","naranja","limón","limon","tomate","lechuga","cebolla","patata","zanahoria","pera","fresa","ajo","pimiento","calabacín","uvas","aguacate","espinacas","champiñones"],
"Lácteos y huevos":["leche","yogur","queso","mantequilla","huevos","nata","kéfir"],
"Carne y pescado":["pollo","ternera","cerdo","jamón","jamon","salmón","merluza","atún","atun","chorizo","pescado","carne","gambas","salchichas"],
"Panadería y dulces":["pan","galletas","bollo","tostadas","magdalenas","chocolate","bizcocho"],
"Despensa":["arroz","pasta","aceite","azúcar","azucar","sal","café","cafe","lentejas","garbanzos","tomate frito","cereales","conserva","harina","legumbres","mayonesa"],
"Bebidas":["agua","cerveza","vino","refresco","zumo","cola","infusión"],
"Limpieza e higiene":["detergente","lejía","lejia","papel higiénico","papel de cocina","jabón","jabon","champú","champu","fregasuelos","suavizante","gel","pasta de dientes","bolsas","estropajo","servilletas"]
};
function catOf(n){n=n.toLowerCase();let best="Otros",len=0;for(const c in CATS)for(const k of CATS[c])if(n.includes(k)&&k.length>len){best=c;len=k.length}return best}

const $=(t,a={},...k)=>{const e=document.createElement(t);for(const x in a){if(x.startsWith('on'))e.addEventListener(x.slice(2),a[x]);else if(x==='class')e.className=a[x];else e.setAttribute(x,a[x])}k.flat().forEach(c=>e.append(c));return e};
const app=document.getElementById('app');
// Android puede reducir el viewport visible al abrir el teclado. Ajustamos las
// ventanas modales a ese espacio para que los campos y acciones sigan accesibles.
(function installKeyboardViewport(){
  const vv=window.visualViewport;
  const update=()=>{
    const h=vv?vv.height:window.innerHeight;
    const top=vv?vv.offsetTop:0;
    document.documentElement.style.setProperty('--vvh',Math.max(220,h)+'px');
    document.documentElement.style.setProperty('--vvtop',Math.max(0,top)+'px');
    document.documentElement.classList.toggle('keyboard-open',!!vv&&window.innerHeight-h>140);
  };
  update();
  if(vv){vv.addEventListener('resize',update);vv.addEventListener('scroll',update)}
  window.addEventListener('resize',update);
  document.addEventListener('focusin',event=>{
    const field=event.target;
    if(!field.matches('input,select,textarea'))return;
    const dialog=field.closest('.edit-dialog,.cat-edit-dialog');
    if(!dialog)return;
    setTimeout(()=>{
      const a=field.getBoundingClientRect(),b=dialog.getBoundingClientRect();
      if(a.bottom>b.bottom-76)dialog.scrollTop+=a.bottom-(b.bottom-76);
      else if(a.top<b.top+64)dialog.scrollTop-=((b.top+64)-a.top);
    },220);
  },true);
})();
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
let db,unsub,unsubL,items=[],lists=[],hist=[],unsubH,custom=[],catIcons={},unsubC,showCats=false,inList=false,showIcons=false,editing=null,categoryEditing=null,navView='home',cur=ls('lista'),code=ls('fam'),me=ls('yo');

function login(msg){
  const nm=$('input',{placeholder:'Tu nombre (ej. Marta)',value:me||'',autocomplete:'given-name'});
  const cd=$('input',{placeholder:'Código de familia',value:code||'',autocapitalize:'characters'});
  const enter=async()=>{
    const n=nm.value.trim(),c=cd.value.trim().toUpperCase().replace(/\s+/g,'');
    if(!n||c.length<6)return login('Escribe tu nombre y un código de al menos 6 caracteres.');
    me=n;code=c;ls('yo',n);ls('fam',c);start();
  };
  const create=()=>{const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let r='';for(let i=0;i<8;i++)r+=a[Math.floor(Math.random()*a.length)];cd.value=r;nm.focus()};
  app.replaceChildren(topBar(),$('div',{class:'login'},
    $('p',{},'Toda la familia con el mismo código ve y edita la misma lista. Crea un código nuevo y pásalo a los demás, o escribe el que ya tengas.'),
    nm,cd,
    $('button',{class:'btn2',onclick:create},'Crear código nuevo'),
    $('button',{class:'btn1',onclick:enter},'Entrar'),
    $('div',{class:'err'},msg||'')));
}

async function start(){
  if(firebaseConfig.apiKey==="PEGA_AQUI"){app.replaceChildren($('div',{class:'login'},$('h1',{},'Falta configurar Firebase'),$('p',{},'Abre index.html y pega la configuración de tu proyecto de Firebase en firebaseConfig.')));return}
  try{
    if(!firebase.apps.length){firebase.initializeApp(firebaseConfig);db=firebase.firestore();db.enablePersistence({synchronizeTabs:true}).catch(()=>{})}
    await firebase.auth().signInAnonymously();
  }catch(e){return login('No se pudo conectar: '+e.message)}
  if(unsubL)unsubL();
  unsubL=lcol().orderBy('ts').onSnapshot(s=>{
    lists=s.docs.map(d=>({id:d.id,...d.data()}));
    if(!lists.length){if(!s.metadata.fromCache)lcol().add({name:'Compra',icon:'🛒',ts:Date.now()});render();return}
    if(inList&&!lists.some(l=>l.id===cur))goHome();
    else render();
  },e=>login('Error de acceso: '+e.message));
  if(unsubH)unsubH();
  unsubH=hcol().orderBy('count','desc').limit(40).onSnapshot(s=>{hist=s.docs.map(d=>d.data());render()},()=>{});
  if(unsubC)unsubC();
  unsubC=ccol().orderBy('ts').onSnapshot(s=>{const docs=s.docs.map(d=>({id:d.id,...d.data()}));custom=docs.filter(x=>!x.system);catIcons={};docs.filter(x=>x.system&&x.name&&x.icon).forEach(x=>catIcons[x.name]=x.icon);render()},()=>{});
  render();
}
function subItems(){
  if(unsub)unsub();items=[];
  unsub=col().orderBy('ts').onSnapshot(s=>{
    items=s.docs.map(d=>({id:d.id,...d.data()}));
    document.getElementById('st').style.display=s.metadata.hasPendingWrites?'block':'none';
    render();
  },e=>login('Error de acceso: '+e.message));
}

const ccol=()=>db.collection('familias').doc(code).collection('categorias');
const hcol=()=>db.collection('familias').doc(code).collection('historial');
const key=n=>n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x';
const lcol=()=>db.collection('familias').doc(code).collection('listas');
const col=()=>lcol().doc(cur).collection('items');
const ICONS=['🛒','🥦','🍎','🥖','🥩','🐟','🥛','🧴','🧹','💊','🔧','👕','🎁','🐶','🏠','🍕','🥤','📝'];
const KW=[['🛒',['compra','super','mercado']],['💊',['farmacia','medic']],['🔧',['ferret','bricol','herramient']],['🧹',['limpieza','casa','hogar']],['👕',['ropa','zapat']],['🎁',['regalo','cumple']],['🐶',['mascota','perro','gato']],['🥦',['verdura','fruta']],['🥖',['panader','pan']],['🥩',['carnic','carne']],['🥤',['bebida','fiesta']],['🍕',['cena','comida','restaurante']]];
function autoIcon(n){n=n.toLowerCase();for(const [e,ks] of KW)if(ks.some(k=>n.includes(k)))return e;return '📝'}
function pick(id){navView='home';editing=null;showIcons=false;cur=id;ls('lista',id);subItems();inList=true;history.pushState({l:1},'');render()}
function goHome(){inList=false;showIcons=false;editing=null;if(unsub){unsub();unsub=null}items=[];render()}
function back(){if(history.state&&history.state.l)history.back();else goHome()}
window.addEventListener('popstate',goHome);
function newList(){
  const n=(prompt('Nombre de la lista (ej. Farmacia)')||'').trim();if(!n)return;
  const r=lcol().doc();r.set({name:n,icon:autoIcon(n),ts:Date.now()});pick(r.id);
}
function renameList(){
  const l=lists.find(x=>x.id===cur);
  const n=(prompt('Nuevo nombre',l.name)||'').trim();if(n)lcol().doc(cur).update({name:n});
}
function delList(){
  if(lists.length<2)return alert('Tiene que quedar al menos una lista.');
  const l=lists.find(x=>x.id===cur);
  if(!confirm('¿Borrar la lista "'+l.name+'" y sus productos para todos?'))return;
  const b=db.batch();items.forEach(i=>b.delete(col().doc(i.id)));b.delete(lcol().doc(cur));b.commit();
}
const cats=()=>[...Object.keys(CATS),...custom.map(c=>c.name),'Otros'];
const catKey=i=>cats().includes(i.cat)?i.cat:'Otros';
function topBar(){return $('div',{class:'top'},$('div',{class:'topin'},$('img',{src:'icon-192.png',alt:'',width:40,height:40}),$('h1',{},'Family Luismaux')))}
function salir(){inList=false;showIcons=false;ls('fam',null);code=null;if(unsub)unsub();unsub=null;if(unsubL)unsubL();if(unsubH)unsubH();if(unsubC)unsubC();hist=[];custom=[];cur=null;login()}
function catsPanel(){
  if(!showCats)return '';
  const inp=$('input',{id:'cin',placeholder:'Nueva categoría (ej. Mascotas)','aria-label':'Nueva categoría'});
  const addC=()=>{
    const n=inp.value.trim();if(!n)return;
    if(cats().some(c=>c.toLowerCase()===n.toLowerCase()))return alert('Esa categoría ya existe.');
    ccol().add({name:n.charAt(0).toUpperCase()+n.slice(1),ts:Date.now()});inp.value='';
  };
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')addC()});
  return $('div',{class:'cp'},
    $('span',{class:'t'},custom.length?'Tus categorías':'Aún no has creado ninguna. Luego asígnalas a un producto con el lápiz ✎.'),
    custom.length?$('div',{class:'hab'},custom.map(c=>$('span',{class:'chip'},$('span',{class:'cn'},c.name),
      $('button',{class:'cx','aria-label':'Borrar categoría '+c.name,onclick:()=>{if(confirm('¿Borrar la categoría "'+c.name+'"? Sus productos pasarán a Otros.'))ccol().doc(c.id).delete()}},'×')))):'',
    $('div',{class:'bar',style:'position:static;padding:4px 0 0'},inp,$('button',{class:'add',onclick:addC},'Crear')));
}
function add(raw){
  raw=raw.trim();if(!raw||!cur)return;
  let q='',n=raw;const m=raw.match(/^(\d+(?:[.,]\d+)?\s?(?:kg|g|l|ud|uds)?)\s+(.+)$/i);
  if(m){q=m[1];n=m[2]}
  n=n.charAt(0).toUpperCase()+n.slice(1);
  put(n,q);
}
function put(n,q,c){
  const k=key(n);
  if(items.some(i=>!i.done&&key(i.name)===k))return;
  const ex=items.find(i=>i.done&&key(i.name)===k);
  const hh=hist.find(x=>key(x.name)===k);
  c=c||(hh&&hh.cat&&cats().includes(hh.cat)?hh.cat:null)||catOf(n);
  if(ex)col().doc(ex.id).update({done:false});
  else col().add({name:n,qty:q,cat:c,done:false,by:me,ts:Date.now()});
  hcol().doc(k).set({name:n,qty:q,cat:c,count:firebase.firestore.FieldValue.increment(1),last:Date.now()},{merge:true});
}
function habs(){
  const pend=new Set(items.filter(i=>!i.done).map(i=>key(i.name)));
  const h=hist.filter(x=>x.name&&!pend.has(key(x.name))).slice(0,12);
  if(!h.length)return '';
  return $('div',{class:'hab'},$('span',{class:'t'},'Habituales'),h.map(x=>
    $('span',{class:'chip'},
      $('button',{class:'cn',onclick:()=>put(x.name,x.qty||'',x.cat)},x.name),
      $('button',{class:'cx','aria-label':'Quitar '+x.name+' de habituales',onclick:()=>hcol().doc(key(x.name)).delete()},'×'))));
}
const toggle=i=>col().doc(i.id).update({done:!i.done});
const del=i=>col().doc(i.id).delete();
const clearDone=()=>{const b=db.batch();items.filter(i=>i.done).forEach(i=>b.delete(col().doc(i.id)));b.commit()};

function productIcon(i){
  const n=(i.name||'').toLowerCase(),c=catKey(i);
  const map=[['leche','🥛'],['yogur','🥣'],['cerveza','🍺'],['agua','💧'],['pan','🥖'],['tomate','🍅'],['manzana','🍎'],['plátano','🍌'],['platano','🍌'],['queso','🧀'],['huevo','🥚'],['pollo','🍗'],['pescado','🐟'],['café','☕'],['cafe','☕'],['arroz','🍚'],['pasta','🍝'],['sal','🧂'],['mejill','🦪'],['lavavajillas','🧼'],['detergente','🧴'],['papel','🧻'],['aceite','🫒'],['zumo','🧃']];
  for(const [k,v] of map)if(n.includes(k))return v;
  return ({'Frutas y verduras':'🥦','Lácteos y huevos':'🥛','Carne y pescado':'🥩','Panadería y dulces':'🥐','Despensa':'🛒','Bebidas':'🥤','Limpieza e higiene':'🧽','Otros':'📦'})[c]||'🛍️';
}
function editRow(i){
  const n=$('input',{value:i.name,'aria-label':'Nombre del producto'});
  const q=$('input',{value:i.qty||'',placeholder:'Cantidad (ej. 2, 500 g)','aria-label':'Cantidad'});
  const c=$('select',{'aria-label':'Categoría'},cats().map(o=>$('option',o===i.cat?{selected:''}:{},o)));
  const save=()=>{
    const nm=n.value.trim();if(!nm)return n.focus();
    editing=null;
    hcol().doc(key(nm)).set({name:nm.charAt(0).toUpperCase()+nm.slice(1),cat:c.value,count:firebase.firestore.FieldValue.increment(0)},{merge:true});
    col().doc(i.id).update({name:nm.charAt(0).toUpperCase()+nm.slice(1),qty:q.value.trim(),cat:c.value});
    render();
  };
  [n,q].forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter')save()}));
  const overlay=$('div',{class:'edit-overlay',onclick:e=>{if(e.target===overlay){editing=null;render()}}});
  const dialog=$('div',{class:'edit-dialog',onclick:e=>e.stopPropagation()},
    $('div',{class:'edit-title'},'✎  Editar producto'),
    $('label',{},'Nombre del producto'),n,
    $('label',{},'Cantidad'),q,
    $('label',{},'Categoría'),c,
    $('div',{class:'edit-actions'},$('button',{class:'btn1',onclick:save},'Guardar'),$('button',{class:'btn2',onclick:()=>{editing=null;render()}},'Cancelar')));
  overlay.append(dialog);setTimeout(()=>n.focus(),0);return overlay;
}
let longPressTimer=null,longPressTriggered=false;
function row(i){
  if(editing===i.id)return editRow(i);
  const card=$('div',{class:'product-card'+(i.done?' done':''),role:'button','aria-label':i.name+'. Mantén pulsado para editar.'});
  const startPress=()=>{longPressTriggered=false;clearTimeout(longPressTimer);longPressTimer=setTimeout(()=>{longPressTriggered=true;editing=i.id;render()},550)};
  const endPress=()=>clearTimeout(longPressTimer);
  card.addEventListener('pointerdown',startPress);
  card.addEventListener('pointerup',endPress);
  card.addEventListener('pointerleave',endPress);
  card.addEventListener('pointercancel',endPress);
  card.addEventListener('contextmenu',e=>{e.preventDefault();longPressTriggered=true;editing=i.id;render()});
  card.addEventListener('click',()=>{if(longPressTriggered){longPressTriggered=false;return}toggle(i)});
  card.append($('span',{class:'chk'},'✓'),$('span',{class:'prod-icon','aria-hidden':'true'},productIcon(i)),$('span',{class:'nm'},i.name),i.qty?$('span',{class:'q'},i.qty):$('span',{class:'q'},' '));
  return card;
}

function listBar(l){return $('div',{class:'top'},$('div',{class:'topin'},
  $('button',{class:'back','aria-label':'Volver a las listas',onclick:back},'‹'),
  $('span',{class:'ico2'},l.icon||'📝'),$('h1',{},l.name)))}
function iconsPanel(){
  if(!showIcons)return '';
  return $('div',{class:'cp'},$('span',{class:'t'},'Elige un icono para esta lista'),
    $('div',{class:'ig'},ICONS.map(e=>$('button',{class:'ib',onclick:()=>{showIcons=false;lcol().doc(cur).update({icon:e});render()}},e))));
}

function bottomNav(){
  const entries=[
    ['home','⌂','Inicio'],
    ['categories','▦','Categorías'],
    ['products','▤','Productos']
  ];
  return $('nav',{class:'bottom-nav','aria-label':'Navegación principal'},
    entries.map(([id,ico,label])=>$('button',{
      class:'nav-btn'+(navView===id?' active':''),
      'aria-current':navView===id?'page':'false',
      onclick:()=>{navView=id;inList=false;editing=null;if(unsub){unsub();unsub=null}items=[];render()}
    },$('span',{class:'nav-ico','aria-hidden':'true'},ico),$('span',{},label)))
  );
}
function renderHome(){
  const tiles=lists.map((l,i)=>$('button',{class:'tile t'+(i%4),onclick:()=>{navView='home';pick(l.id)}},
    $('span',{class:'ico'},l.icon||'📝'),$('span',{class:'ln'},l.name)));
  tiles.push($('button',{class:'tile plus',onclick:newList},$('span',{class:'ico'},'+'),$('span',{class:'ln'},'Nueva lista')));
  app.replaceChildren(topBar(),$('div',{class:'wrap'},
    $('div',{class:'who2'},me+' · código ',$('b',{},code),' · ',$('button',{onclick:salir},'Cambiar')),
    $('div',{class:'page-title'},'¿Qué vamos a comprar?'),
    $('p',{class:'page-sub'},'Tus listas, siempre a mano y sincronizadas con la familia.'),
    $('div',{class:'grid'},tiles),
    $('div',{class:'section-kicker'},'Accesos rápidos'),
    $('div',{class:'manage-card'},$('div',{class:'manage-row'},
      $('span',{class:'ico2'},'🛒'),$('div',{class:'grow'},$('strong',{},'Listas compartidas'),$('small',{},lists.length+' listas disponibles')),
      $('button',{class:'pill-action',onclick:newList},'Nueva +')))),
    bottomNav());
}
const CATEGORY_ICON_OPTIONS=['🥬','🥛','🥩','🥖','🧺','🥤','🧽','🧴','🍎','🍌','🍅','🧀','🥚','🍗','🐟','🍚','🍝','🧂','🧊','🍕','🍫','☕','🧻','🧼','🏠','🐶','📦','🛒','🌿','🧹'];
const DEFAULT_CATEGORY_ICONS={'Frutas y verduras':'🥬','Lácteos y huevos':'🥛','Carne y pescado':'🥩','Panadería y dulces':'🥖','Despensa':'🧺','Bebidas':'🥤','Limpieza e higiene':'🧽','Otros':'📦'};
const categoryIcon=name=>catIcons[name]||DEFAULT_CATEGORY_ICONS[name]||'🏷️';
function editCategory(c,isSystem){
  categoryEditing={...c,isSystem};render();
}
function categoryEditor(){
  if(!categoryEditing)return '';
  const c=categoryEditing, name=$('input',c.isSystem?{value:c.name,placeholder:'Nombre de la categoría',disabled:''}:{value:c.name,placeholder:'Nombre de la categoría'});
  let selected=c.icon||categoryIcon(c.name);
  const picker=$('div',{class:'cat-icon-picker'},CATEGORY_ICON_OPTIONS.map(icon=>$('button',{type:'button',class:icon===selected?'selected':'',title:'Usar '+icon,onclick:e=>{selected=icon;picker.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.textContent===icon))}},icon)));
  const close=()=>{categoryEditing=null;render()};
  const save=()=>{
    const newName=(name.value||'').trim();if(!newName)return name.focus();
    if(!c.isSystem&&custom.some(x=>x.id!==c.id&&x.name.toLowerCase()===newName.toLowerCase()))return alert('Ya existe una categoría con ese nombre.');
    if(c.isSystem){ccol().doc('sys-'+key(c.name)).set({system:true,name:c.name,icon:selected,ts:Date.now()},{merge:true});}
    else{ccol().doc(c.id).update({name:newName.charAt(0).toUpperCase()+newName.slice(1),icon:selected});}
    close();
  };
  const overlay=$('div',{class:'cat-edit-overlay',onclick:e=>{if(e.target===overlay)close()}});
  const actions=[$('button',{class:'btn1',onclick:save},'Guardar'),$('button',{class:'btn2',onclick:close},'Cancelar')];
  if(!c.isSystem)actions.unshift($('button',{class:'btn2',onclick:()=>{if(confirm('¿Borrar la categoría "'+c.name+'"? Sus productos pasarán a Otros.')){ccol().doc(c.id).delete();close()}}},'Borrar'));
  const dialog=$('div',{class:'cat-edit-dialog',onclick:e=>e.stopPropagation()},
    $('div',{class:'cat-edit-title'},'✎  Editar categoría'),
    $('label',{},'Nombre de la categoría'),name,
    c.isSystem?$('small',{},'Las categorías integradas mantienen su nombre para no alterar la clasificación de productos existentes.'):'',
    $('label',{},'Selecciona un icono'),picker,
    $('div',{class:'cat-edit-actions'},actions));
  overlay.append(dialog);return overlay;
}
let categoryPressTimer=null,categoryLongPressTriggered=false;
function categoryCard(c,isSystem,countLabel){
  const card=$('button',{class:'category-card',type:'button','aria-label':c.name+'. Mantén pulsado para editar.'},
    $('span',{class:'cat-ico','aria-hidden':'true'},c.icon||categoryIcon(c.name)),
    $('strong',{},c.name),$('small',{},countLabel|| (isSystem?'Categoría integrada':'Categoría personalizada')));
  const start=()=>{categoryLongPressTriggered=false;clearTimeout(categoryPressTimer);categoryPressTimer=setTimeout(()=>{categoryLongPressTriggered=true;editCategory(c,isSystem)},550)};
  const stop=()=>clearTimeout(categoryPressTimer);
  card.addEventListener('pointerdown',start);card.addEventListener('pointerup',stop);card.addEventListener('pointerleave',stop);card.addEventListener('pointercancel',stop);
  card.addEventListener('contextmenu',e=>{e.preventDefault();categoryLongPressTriggered=true;editCategory(c,isSystem)});
  card.addEventListener('click',()=>{if(categoryLongPressTriggered){categoryLongPressTriggered=false;return}});
  return card;
}
function renderCategoriesPage(){
  const inp=$('input',{id:'cin',placeholder:'Nombre de la nueva categoría','aria-label':'Nueva categoría'});
  const addC=()=>{
    const n=inp.value.trim();if(!n)return;
    if(cats().some(c=>c.toLowerCase()===n.toLowerCase()))return alert('Esa categoría ya existe.');
    ccol().add({name:n.charAt(0).toUpperCase()+n.slice(1),icon:'🏷️',ts:Date.now()});inp.value='';
  };
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')addC()});
  const systemCats=Object.keys(CATS).map(name=>({name,icon:categoryIcon(name)}));
  const customCats=custom.map(c=>({...c,icon:c.icon||'🏷️'}));
  app.replaceChildren(topBar(),$('div',{class:'wrap'},
    $('div',{class:'page-title'},'Categorías'),
    $('p',{class:'page-sub'},'Mantén pulsada una tarjeta para editar su nombre o cambiar su icono.'),
    $('div',{class:'bar'},inp,$('button',{class:'add',onclick:addC},'Crear')),
    $('div',{class:'section-kicker'},'Categorías disponibles'),
    $('div',{class:'category-grid'},systemCats.map(c=>categoryCard(c,true))),
    $('div',{class:'section-kicker'},'Tus categorías'),
    customCats.length?$('div',{class:'category-grid'},customCats.map(c=>categoryCard(c,false))):$('p',{class:'page-sub'},'Todavía no has creado categorías personalizadas.'),
    categoryEditor()),bottomNav());
}

function addProductFromCatalog(name,qty,cat){
  const target=cur&&lists.some(l=>l.id===cur)?cur:(lists[0]&&lists[0].id);
  if(!target)return alert('Crea primero una lista de compra.');
  const normalized=name.charAt(0).toUpperCase()+name.slice(1);
  const productKey=key(normalized);
  const ref=lcol().doc(target).collection('items');
  ref.get().then(s=>{
    const found=s.docs.find(d=>d.data().name&&key(d.data().name)===productKey&&!d.data().done);
    if(!found)ref.add({name:normalized,qty:qty||'',cat:cat||catOf(normalized),done:false,by:me,ts:Date.now()});
    else found.ref.update({done:false});
    hcol().doc(productKey).set({name:normalized,qty:qty||'',cat:cat||catOf(normalized),count:firebase.firestore.FieldValue.increment(1),last:Date.now()},{merge:true});
    cur=target;ls('lista',target);
  }).catch(e=>alert('No se pudo añadir el producto: '+e.message));
}
function renderProductsPage(){
  const inp=$('input',{id:'pin',placeholder:'Añadir producto (ej. 2 leche)','aria-label':'Nombre del producto'});
  const addP=()=>{
    const raw=inp.value.trim();if(!raw)return;
    let qty='',name=raw;const m=raw.match(/^(\d+(?:[.,]\d+)?\s?(?:kg|g|l|ud|uds)?)\s+(.+)$/i);
    if(m){qty=m[1];name=m[2]}
    addProductFromCatalog(name,qty);inp.value='';
  };
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')addP()});
  const productRows=hist.filter(x=>x.name).slice(0,40);
  app.replaceChildren(topBar(),$('div',{class:'wrap'},
    $('div',{class:'page-title'},'Productos'),
    $('p',{class:'page-sub'},'Añade rápidamente productos a tu lista desde tu catálogo habitual.'),
    $('div',{class:'bar'},inp,$('button',{class:'add',onclick:addP},'Añadir')),
    $('div',{class:'section-kicker'},'Productos habituales'),
    productRows.length?$('div',{class:'manage-card'},productRows.map(p=>$('div',{class:'manage-row'},
      $('span',{class:'ico2'},'🛍️'),
      $('div',{class:'grow'},$('strong',{},p.name),$('small',{},p.cat||'Otros')),
      $('button',{class:'pill-action',onclick:()=>addProductFromCatalog(p.name,p.qty||'',p.cat)},'+ Añadir')))):
      $('div',{class:'empty'},'Aún no hay productos habituales. Añade productos a una lista y aparecerán aquí.')),
    bottomNav());
}
function renderList(){
  const l=lists.find(x=>x.id===cur)||{name:'Lista',icon:'📝'};
  const input=$('input',{id:'in',placeholder:'Añadir producto (ej. 2 leche)',enterkeyhint:'done',list:'sug',autocomplete:'off'});
  const names=[...new Set([...hist.map(h=>h.name),...items.map(i=>i.name)])];
  const dl=$('datalist',{id:'sug'},names.map(n=>$('option',{value:n})));
  const go=()=>{add(input.value);input.value='';input.focus()};
  input.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
  const pend=items.filter(i=>!i.done),done=items.filter(i=>i.done);
  const body=[];
  if(!items.length)body.push($('div',{class:'empty'},'La lista está vacía. Escribe arriba lo primero que necesitéis.'));
  for(const c of cats()){
    const g=pend.filter(i=>catKey(i)===c);
    if(g.length)body.push($('h2',{},c),$('div',{class:'products-grid'},g.map(row)));
  }
  if(done.length)body.push($('div',{class:'head'},$('h2',{},'Comprados ('+done.length+')'),$('button',{class:'clr',onclick:clearDone},'Quitar comprados')),$('div',{class:'products-grid'},done.map(row)));
  app.replaceChildren(listBar(l),$('div',{class:'wrap'},
    $('div',{class:'acts'},$('button',{onclick:renameList},'Renombrar'),$('button',{onclick:()=>{showIcons=!showIcons;render()}},'Icono'),$('button',{onclick:delList},'Borrar lista')),
    iconsPanel(),
    $('div',{class:'bar'},input,dl,$('button',{class:'add',onclick:go},'Añadir')),
    habs(),$('p',{class:'page-sub'},'Marca un producto con un toque. Mantén pulsado para editarlo.'),body,bottomNav()));
}
function render(){
  const keep=['in','cin'].map(id=>{const e=document.getElementById(id);return e?[id,e.value,document.activeElement===e]:null});
  if(inList)renderList();
  else if(navView==='categories')renderCategoriesPage();
  else if(navView==='products')renderProductsPage();
  else renderHome();
  keep.forEach(k=>{if(!k)return;const e=document.getElementById(k[0]);if(e){e.value=k[1];if(k[2])e.focus()}});
}

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
(me&&code)?start():login();
