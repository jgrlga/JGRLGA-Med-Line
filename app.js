// SinapsCore: cálculo + branding + modo solo checklist
(function(){

/*! QRCode.js v1.0.0 (MIT) https://github.com/davidshimjs/qrcodejs */
var QRCode=function(a,b){this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRErrorCorrectLevel.H};if("string"==typeof b&&(b={text:b}),b)for(var c in b)this._htOption[c]=b[c];"string"==typeof a&&(a=document.getElementById(a)),this._android=navigator.userAgent.match(/Android/i),this._el=a,this._el.style.position="relative",this._el.style.padding="0",this._el.style.overflow="hidden",this._elTitle=document.createElement("div"),this._el.appendChild(this._elTitle),this._elCanvas=document.createElement("canvas"),this._elCanvas.width=this._htOption.width,this._elCanvas.height=this._htOption.height,this._el.appendChild(this._elCanvas),this._elImage=document.createElement("img"),this._elImage.style.display="none",this._el.appendChild(this._elImage),this._oQRCode=new QRCodeModel(s(b.text)),this._oQRCode.make(),this.makeImage()};QRCode.prototype.makeImage=function(){var a=this._oQRCode.getModuleCount(),b=this._htOption.width/a,c=this._htOption.height/a,d=this._elCanvas.getContext("2d");d.clearRect(0,0,this._htOption.width,this._htOption.height),d.fillStyle=this._htOption.colorLight,d.fillRect(0,0,this._htOption.width,this._htOption.height),d.fillStyle=this._htOption.colorDark;for(var e=0;e<a;e++)for(var f=0;f<a;f++)this._oQRCode.isDark(e,f)&&d.fillRect(f*b,e*c,b,c);this._elImage.src=this._elCanvas.toDataURL("image/png")};var QRErrorCorrectLevel={L:1,M:0,Q:3,H:2};function QRCodeModel(a){this.typeNumber=4,this.moduleCount=0,this.dataList=[],this.dataCache=null,this.makeImpl(a)}QRCodeModel.prototype.makeImpl=function(a){var b=QRUtil.getTypeNumber(a,QRErrorCorrectLevel.M);this.typeNumber=b,this.moduleCount=4*b+17,this.modules=new Array(this.moduleCount);for(var c=0;c<this.moduleCount;c++)this.modules[c]=new Array(this.moduleCount);QRUtil.setupPositionProbePattern(this);var d=new QRBitBuffer;d.put(a.length,8);for(var e=0;e<a.length;e++)d.put(a.charCodeAt(e),8);for(var f=0;f<this.moduleCount;f++)for(var g=0;g<this.moduleCount;g++)this.modules[f][g]=null;QRUtil.mapData(this,d,QRErrorCorrectLevel.M)};QRCodeModel.prototype.isDark=function(a,b){return this.modules[a][b]};QRCodeModel.prototype.getModuleCount=function(){return this.moduleCount};var QRUtil={getTypeNumber:function(a,b){for(var c=1;c<=40;c++){var d=4*c+17;if(a<=d*d-3)return c}return 4},setupPositionProbePattern:function(a){for(var b=[[0,0],[a.moduleCount-7,0],[0,a.moduleCount-7]],c=0;c<b.length;c++)for(var d=b[c][0],e=b[c][1],f=-1;f<=7;f++)if(!(d+f<=-1||a.moduleCount<=d+f))for(var g=-1;g<=7;g++)e+g<=-1||a.moduleCount<=e+g||(f>=0&&f<=6&&(0==g||6==g)||g>=0&&g<=6&&(0==f||6==f)||f>=2&&f<=4&&g>=2&&g<=4?a.modules[e+g][d+f]=!0:a.modules[e+g][d+f]=!1)},mapData:function(a,b,c){for(var d=0,e=a.moduleCount-1,f=a.moduleCount-1,g=!1;e>0;e-=2)for(6==e&&e--;;){for(var h=0;h<2;h++)if(a.modules[f][e-h]===null){var i=!1;d<8*b.length&&(i=((b.buffer[d>>>3]>>>7-(7&d))&1)==1),a.modules[f][e-h]=i,d++}if(f+=g?-1:1,f<0||a.moduleCount<=f){f+=g?1:-1;break}g=!g}}};function QRBitBuffer(){this.buffer=[],this.length=0}QRBitBuffer.prototype.put=function(a,b){for(var c=0;c<b;c++)this.putBit((a>>>b-c-1&1)==1)};QRBitBuffer.prototype.putBit=function(a){var b=this.length>>>3;this.buffer.length<=b&&this.buffer.push(0),a&&(this.buffer[b]|=128>>>this.length%8),this.length++};function s(a){return unescape(encodeURIComponent(a))}



  // === Folio único y utilidades de tiempo ===
  function pad2(n){return String(n).padStart(2,'0');}
  function localDateTimeStr(d=new Date()){
    return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())+" "+pad2(d.getHours())+":"+pad2(d.getMinutes());
  }
  function genFolio(seed){
    const d=new Date();
    const stamp = d.getFullYear().toString()+pad2(d.getMonth()+1)+pad2(d.getDate())+"-"+pad2(d.getHours())+pad2(d.getMinutes());
    let h=0; for(let i=0;i<seed.length;i++){ h=((h<<5)-h)+seed.charCodeAt(i); h|=0; }
    const hex=(h>>>0).toString(16).slice(-4).toUpperCase();
    return `CI-${stamp}-${hex}`;
  }
  function insertAtCursor(el, text){
    const start = el.selectionStart || 0, end = el.selectionEnd || 0;
    el.value = el.value.slice(0,start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.dispatchEvent(new Event('input'));
  }

  
  function storageGet(key, def=null){
    try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }catch{ return def; }
  }
  function storageSet(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }
  function nowHM(){
    const d=new Date(), pad=n=>String(n).padStart(2,'0');
    return pad(d.getHours())+':'+pad(d.getMinutes());
  }


  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const fmt = n => Number.isFinite(n) ? (Math.round(n*100)/100) : '—';

  
  // THEME with system preference (auto default)
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  function themePref(){
    const saved = localStorage.getItem('theme') || 'auto';
    if(saved === 'auto'){ return mq.matches ? 'light' : 'dark'; }
    return saved;
  }
  function setThemeColor(t){
    if(themeMeta){ themeMeta.setAttribute('content', t==='light' ? '#f6f8fb' : '#0b0e13'); }
  }
  function applyTheme(){
    const t = themePref();
    document.body.classList.toggle('light', t === 'light');
    setThemeColor(t);
  }
  mq.addEventListener?.('change', applyTheme);
  // toggle cycles auto -> dark -> light -> auto
  darkBtn.addEventListener('click', ()=>{
    const cur = localStorage.getItem('theme') || 'auto';
    const next = cur==='auto' ? 'dark' : (cur==='dark' ? 'light' : 'auto');
    localStorage.setItem('theme', next);
    applyTheme();

    // Controles para Notas de evolución: botón de sello y 'última edición'
    function setupEvoControls(){
      const map = [
        {id:'evoInicio', key:'evo_inicio', tsKey:'ts_evo_inicio'},
        {id:'evoIntermedia', key:'evo_intermedia', tsKey:'ts_evo_intermedia'},
        {id:'evoFinal', key:'evo_final', tsKey:'ts_evo_final'}
      ];
      map.forEach(({id,key,tsKey})=>{
        const ta = document.getElementById(id);
        if(!ta) return;
        // crear barra de controles si no existe
        if(!ta._controls){
          const bar = document.createElement('div'); bar.className='evo-controls';
          const btn = document.createElement('button'); btn.type='button'; btn.textContent='Añadir sello de tiempo'; btn.addEventListener('click',()=>{
            insertAtCursor(ta, `[${localDateTimeStr()}] `);
          });
          const info = document.createElement('small'); info.id = id+'_last';
          const savedTs = storageGet(tsKey, '');
          info.textContent = savedTs ? `Última edición: ${savedTs}` : 'Última edición: —';
          bar.appendChild(btn); bar.appendChild(info);
          ta.parentNode.insertBefore(bar, ta.nextSibling);
          ta._controls = {bar, info};
        }
        // actualizar sello al escribir
        ta.addEventListener('input', ()=>{
          const ts = localDateTimeStr();
          storageSet(tsKey, ts);
          if(ta._controls) ta._controls.info.textContent = 'Última edición: ' + ts;
          // persistir contenido ya lo hace loadEvoNotes()
        });
      });
    }

  });
  applyTheme();

    // Controles para Notas de evolución: botón de sello y 'última edición'
    function setupEvoControls(){
      const map = [
        {id:'evoInicio', key:'evo_inicio', tsKey:'ts_evo_inicio'},
        {id:'evoIntermedia', key:'evo_intermedia', tsKey:'ts_evo_intermedia'},
        {id:'evoFinal', key:'evo_final', tsKey:'ts_evo_final'}
      ];
      map.forEach(({id,key,tsKey})=>{
        const ta = document.getElementById(id);
        if(!ta) return;
        // crear barra de controles si no existe
        if(!ta._controls){
          const bar = document.createElement('div'); bar.className='evo-controls';
          const btn = document.createElement('button'); btn.type='button'; btn.textContent='Añadir sello de tiempo'; btn.addEventListener('click',()=>{
            insertAtCursor(ta, `[${localDateTimeStr()}] `);
          });
          const info = document.createElement('small'); info.id = id+'_last';
          const savedTs = storageGet(tsKey, '');
          info.textContent = savedTs ? `Última edición: ${savedTs}` : 'Última edición: —';
          bar.appendChild(btn); bar.appendChild(info);
          ta.parentNode.insertBefore(bar, ta.nextSibling);
          ta._controls = {bar, info};
        }
        // actualizar sello al escribir
        ta.addEventListener('input', ()=>{
          const ts = localDateTimeStr();
          storageSet(tsKey, ts);
          if(ta._controls) ta._controls.info.textContent = 'Última edición: ' + ts;
          // persistir contenido ya lo hace loadEvoNotes()
        });
      });
    }




  // Persistencia de Notas de Evolución
  function loadEvoNotes(){
    const i = storageGet('evo_inicio','');
    const m = storageGet('evo_intermedia','');
    const f = storageGet('evo_final','');
    const ei = document.getElementById('evoInicio');
    const em = document.getElementById('evoIntermedia');
    const ef = document.getElementById('evoFinal');
    if(ei) ei.value = i||'';
    if(em) em.value = m||'';
    if(ef) ef.value = f||'';
    [ei,em,ef].forEach((el,idx)=>{
      if(!el) return;
      el.addEventListener('input', ()=>{
        const key = idx===0? 'evo_inicio' : idx===1? 'evo_intermedia' : 'evo_final';
        storageSet(key, el.value);
      });
    });
  }

  });
  applyTheme();

    // Controles para Notas de evolución: botón de sello y 'última edición'
    function setupEvoControls(){
      const map = [
        {id:'evoInicio', key:'evo_inicio', tsKey:'ts_evo_inicio'},
        {id:'evoIntermedia', key:'evo_intermedia', tsKey:'ts_evo_intermedia'},
        {id:'evoFinal', key:'evo_final', tsKey:'ts_evo_final'}
      ];
      map.forEach(({id,key,tsKey})=>{
        const ta = document.getElementById(id);
        if(!ta) return;
        // crear barra de controles si no existe
        if(!ta._controls){
          const bar = document.createElement('div'); bar.className='evo-controls';
          const btn = document.createElement('button'); btn.type='button'; btn.textContent='Añadir sello de tiempo'; btn.addEventListener('click',()=>{
            insertAtCursor(ta, `[${localDateTimeStr()}] `);
          });
          const info = document.createElement('small'); info.id = id+'_last';
          const savedTs = storageGet(tsKey, '');
          info.textContent = savedTs ? `Última edición: ${savedTs}` : 'Última edición: —';
          bar.appendChild(btn); bar.appendChild(info);
          ta.parentNode.insertBefore(bar, ta.nextSibling);
          ta._controls = {bar, info};
        }
        // actualizar sello al escribir
        ta.addEventListener('input', ()=>{
          const ts = localDateTimeStr();
          storageSet(tsKey, ts);
          if(ta._controls) ta._controls.info.textContent = 'Última edición: ' + ts;
          // persistir contenido ya lo hace loadEvoNotes()
        });
      });
    }



  // Persistencia de Notas de Evolución
  function loadEvoNotes(){
    const i = storageGet('evo_inicio','');
    const m = storageGet('evo_intermedia','');
    const f = storageGet('evo_final','');
    const ei = document.getElementById('evoInicio');
    const em = document.getElementById('evoIntermedia');
    const ef = document.getElementById('evoFinal');
    if(ei) ei.value = i||'';
    if(em) em.value = m||'';
    if(ef) ef.value = f||'';
    [ei,em,ef].forEach((el,idx)=>{
      if(!el) return;
      el.addEventListener('input', ()=>{
        const key = idx===0? 'evo_inicio' : idx===1? 'evo_intermedia' : 'evo_final';
        storageSet(key, el.value);
      });
    });
  }


  // CHECKLIST MODE
  const checklistBtn = qs('#checklistToggle');
  const applyChecklist = () => {
    const c = localStorage.getItem('checklist') === 'true';
    document.body.classList.toggle('checklist', c);
    checklistBtn.setAttribute('aria-pressed', c ? 'true' : 'false');
  };
  checklistBtn.addEventListener('click', ()=>{
    const c = localStorage.getItem('checklist') === 'true';
    localStorage.setItem('checklist', (!c).toString());
    applyChecklist();
  });
  // Auto preferir checklist en pantallas angostas (mobile/iPad portrait) la primera vez
  if(localStorage.getItem('checklist') === null && window.innerWidth < 900){
    localStorage.setItem('checklist', 'true');
  }
  applyChecklist();

  // BRANDING
  const brandDlg = qs('#brandDialog');
  const brandBtn = qs('#brandSettingsBtn');
  const brandName = qs('#brandName');
  const brandTagline = qs('#brandTagline');
  const brandLogoURL = qs('#brandLogoURL');
  const brandPrimary = qs('#brandPrimary');
  const brandSecondary = qs('#brandSecondary');
  const brandQRBase = qs('#brandQRBase');
  const DEFAULT_QR_BASE = 'https://jgrlga.github.io/JGRLGA-Med-Line/';
  const brandLogo = qs('#brandLogo');

  function loadBrand(){
    try{ if(!localStorage.getItem('qr_base')){ localStorage.setItem('qr_base', DEFAULT_QR_BASE); } }catch(e){}
    try{
      const st = JSON.parse(localStorage.getItem('brand') || '{}');
      if(st.name){ brandName.value = st.name; qs('.brand-txt h1').textContent = st.name; }
      if(st.tagline){ brandTagline.value = st.tagline; qs('.tagline').textContent = st.tagline; }
      if(st.logo){ brandLogoURL.value = st.logo; brandLogo.src = st.logo; }
      if(st.primary){ brandPrimary.value = st.primary; document.documentElement.style.setProperty('--brand-primary', st.primary); }
      if(st.secondary){ brandSecondary.value = st.secondary; document.documentElement.style.setProperty('--brand-secondary', st.secondary); }
      if(st.qrBase){ brandQRBase.value = st.qrBase; localStorage.setItem('qr_base', st.qrBase); } else { brandQRBase.value = localStorage.getItem('qr_base') || DEFAULT_QR_BASE; }
    } catch(e){}
  }
  function saveBrand(){
    const st = {
      name: brandName.value.trim() || 'SinapsCore',
      tagline: brandTagline.value.trim() || 'Salud Conectada. IA en el Núcleo',
      logo: brandLogoURL.value.trim() || 'sinapscore-logo-placeholder.svg',
      primary: brandPrimary.value || '#d4af37',
      secondary: brandSecondary.value || '#c0c0c0',
      qrBase: brandQRBase.value.trim() || ''
    };
    localStorage.setItem('brand', JSON.stringify(st));
    if(st.qrBase){ localStorage.setItem('qr_base', st.qrBase); } else { localStorage.removeItem('qr_base'); }
    loadBrand();
  }
  brandBtn.addEventListener('click', ()=> brandDlg.showModal());
  qs('#saveBrand').addEventListener('click', (e)=>{ e.preventDefault(); saveBrand(); brandDlg.close(); });
  loadBrand();

  // Helpers
  const nowLocalISO = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const d2 = new Date(d.getTime() - off*60000);
    return d2.toISOString().slice(0,16);
  };
  const onset = qs('#symptomOnset');
  if(!onset.value) onset.value = nowLocalISO();

  const halfDose75 = () => qs('#halfDose75').checked;
  const preferUFH = () => qs('#preferUFH').checked;

  function cockcroftGault(age, weightKg, sex, scrMgDl){
    if(!age || !weightKg || !scrMgDl || scrMgDl<=0) return null;
    let crcl = ((140 - age) * weightKg) / (72 * scrMgDl);
    if(sex === 'F') crcl *= 0.85;
    return crcl;
  }

  function tnkDose(weightKg, age, halfFor75){
    if(!weightKg) return null;
    let mg = 0;
    if(weightKg < 60) mg = 30;
    else if(weightKg < 70) mg = 35;
    else if(weightKg < 80) mg = 40;
    else if(weightKg < 90) mg = 45;
    else mg = 50;
    if(halfFor75 && age >= 75){
      mg = mg/2;
      mg = Math.round(mg/5)*5;
    }
    return mg;
  }

  function clopidogrel(age){
    const load = (age>75) ? 0 : 300;
    return {load, maint: 75};
  }
  function asa(){ return {loadMin: 162, loadMax: 325, maint: 100}; }

  function enoxaparina(age, crcl, weightKg){
    if(!weightKg) return null;
    const conc = 100; // mg/mL
    let regimen = {ivBolus: 0, scDoseMg: 0, intervalH: 12, notes: ""};
    if(crcl !== null && crcl < 30){
      regimen.ivBolus = 0;
      regimen.scDoseMg = 1.0 * weightKg;
      regimen.intervalH = 24;
      regimen.notes = "ClCr <30 mL/min: 1 mg/kg SC cada 24 h (evitar bolo IV).";
    } else {
      if(age >= 75){
        regimen.ivBolus = 0;
        regimen.scDoseMg = 0.75 * weightKg;
        regimen.intervalH = 12;
        regimen.capFirstTwo = 75;
        regimen.notes = "≥75 a: sin bolo IV; 0.75 mg/kg SC c/12 h. Cap primeras 2: 75 mg.";
      } else {
        regimen.ivBolus = 30;
        regimen.scDoseMg = 1.0 * weightKg;
        regimen.intervalH = 12;
        regimen.capFirstTwo = 100;
        regimen.notes = "<75 a: 30 mg IV → a 15 min 1 mg/kg SC c/12 h. Cap primeras 2: 100 mg.";
      }
    }
    const vol = (mg)=> mg/100;
    regimen.scVolPerDoseMl = vol(regimen.scDoseMg);
    if(regimen.capFirstTwo){ regimen.volCapFirstTwoMl = vol(regimen.capFirstTwo); }
    return regimen;
  }

  function ufh(weightKg){
    const bolus = Math.min(60*weightKg, 4000);
    const rate = Math.min(12*weightKg, 1000);
    return {bolusUnits: Math.round(bolus), rateUnitsPerHour: Math.round(rate)};
  }

  // Build plan with checklist
  function buildPlan(){
    const mdName = qs('#mdName').value.trim();
    const mdLicense = qs('#mdLicense').value.trim();
    const name = qs('#pxName').value.trim();
    const age = parseInt(qs('#age').value,10);
    const sex = qs('#sex').value;
    const weight = parseFloat(qs('#weight').value);
    const scr = parseFloat(qs('#scr').value);
    const sbp = parseFloat(qs('#sbp').value);
    const dbp = parseFloat(qs('#dbp').value);
    const spo2 = parseFloat(qs('#spo2').value);
    const pregnant = qs('#pregnant').value === 'si';
    const scad = qs('#scad').value === 'si';
    const pciDelay = parseFloat(qs('#pciDelay').value);
    const onsetISO = qs('#symptomOnset').value || nowLocalISO();

    const warnings = qs('#warnings');
    warnings.innerHTML = "";
    function pushWarn(msg, danger=false){
      const div = document.createElement('div');
      div.className = "alert" + (danger ? " danger" : "");
      div.textContent = msg;
      warnings.appendChild(div);
    }

    const cis = qsa('.absCI:checked').map(el=>el.value);
    if(cis.length>0){ pushWarn("⚠️ Contraindicaciones absolutas marcadas: " + cis.join(" · ") + ". Evitar fibrinólisis.", true); }
    if(pregnant || scad){ pushWarn("⚠️ Embarazo/posparto o sospecha de SCAD: prefiera PCI. Evitar fibrinólisis.", true); }
    if(Number.isFinite(sbp) && Number.isFinite(dbp) && (sbp>180 || dbp>110)){
      pushWarn("⚠️ TA >180/110 mmHg: controle la PA antes de administrar líticos.", true);
    }
    if(Number.isFinite(spo2) && spo2<90){ pushWarn("💡 SatO₂ <90% → administre oxígeno suplementario.", false); }
    if(Number.isFinite(pciDelay)){
      if(pciDelay<=120){ pushWarn("ℹ️ PCI primaria ≤120 min. Estrategia preferida: PCI (no líticos) salvo criterios particulares."); }
      else { pushWarn("⏱️ PCI primaria >120 min → Fibrinólisis razonable si en ventana y sin CI."); }
    }

    const crcl = cockcroftGault(age, weight, sex, scr);
    const tnk = tnkDose(weight, age, halfDose75());
    const clop = clopidogrel(age);
    const asaPlan = asa();
    let anticoag = null;

    let schedule = [];
    const timeFmt = (d)=>{
      const pad = n=> String(n).padStart(2,'0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const now = new Date();

    // Anticoag
    if(preferUFH()){
      const u = ufh(weight);
      anticoag = {type:"UFH", ...u};
      schedule.push({label:"UFH bolo IV", time: timeFmt(now), note:`${u.bolusUnits} U IV ahora`, key:"ufh_bolus"});
      schedule.push({label:"UFH infusión", time: timeFmt(now), note:`${u.rateUnitsPerHour} U/h, ajustar por TTPa`, key:"ufh_infusion"});
    } else {
      const e = enoxaparina(age, crcl, weight);
      anticoag = {type:"Enoxaparina", ...e};
      if(e.ivBolus>0){
        schedule.push({label:"Enoxaparina bolo IV", time: timeFmt(now), note:`${fmt(e.ivBolus)} mg IV ahora`, key:"enox_bolus"});
        schedule.push({label:"Enoxaparina 1ª SC", time: timeFmt(new Date(now.getTime()+15*60000)), note:`${fmt(e.scDoseMg)} mg SC (${fmt(e.scVolPerDoseMl)} mL) a +15 min`, key:"enox_sc_1"});
      } else {
        schedule.push({label:"Enoxaparina 1ª SC", time: timeFmt(now), note:`${fmt(e.scDoseMg)} mg SC (${fmt(e.scVolPerDoseMl)} mL) ahora`, key:"enox_sc_1"});
      }
      const interval = e.intervalH;
      for(let i=1;i<4;i++){
        const when = new Date(now.getTime() + i*interval*60*60000);
        schedule.push({label:`Enoxaparina SC (dosis ${i+1})`, time: timeFmt(when), note:`${fmt(e.scDoseMg)} mg SC c/${interval} h${e.capFirstTwo? " (cap 2 primeras: "+fmt(e.capFirstTwo)+" mg)":""}`, key:`enox_sc_${i+1}`});
      }
    }

    // TNK (si procede)
    if(!(pregnant||scad) && cis.length===0){
      schedule.unshift({label:"Tenecteplasa (TNK) bolo IV", time: timeFmt(now), note:`${fmt(tnk)} mg en 5–10 s`, key:"tnk"});
    }

    // ASA & CLOPI
    schedule.unshift({label:"Aspirina (ASA) carga", time: timeFmt(now), note:`${asaPlan.loadMin}–${asaPlan.loadMax} mg (VO masticable; IV si no VO)`, key:"asa"});
    if(clop.load>0){
      schedule.push({label:"Clopidogrel carga", time: timeFmt(now), note:`${clop.load} mg VO si ≤75 a`, key:"clop_load"});
    } else {
      schedule.push({label:"Clopidogrel", time: timeFmt(now), note:`${clop.maint} mg VO/día (sin carga si >75 a)`, key:"clop"});
    }

    // EKG y PCI
    schedule.push({label:"EKG de control", time: timeFmt(new Date(now.getTime()+75*60000)), note:"Valorar ↓ST ≥50% · si fallo → PCI rescate", key:"ekg_90"});
    schedule.push({label:"Programar coronariografía/PCI", time: timeFmt(new Date(now.getTime()+3*60*60000)), note:"2–24 h tras lisis si éxito", key:"pci_224"});

    // Render
    const planDiv = qs('#plan');
    planDiv.innerHTML = "";

    const block1 = document.createElement('div');
    block1.className = "plan-block";
    block1.innerHTML = `
      <h3>Resumen</h3>
      <div class="kv"><span><strong>Médico:</strong> ${mdName||'________________'}</span><span><strong>Cédula:</strong> ${mdLicense||'________________'}</span></div>
      <div class="kv">
        <span><strong>Paciente:</strong> ${name || '—'}</span>
        <span><strong>Edad:</strong> ${fmt(age)} a</span>
        <span><strong>Sexo:</strong> ${sex}</span>
        <span><strong>Peso:</strong> ${fmt(weight)} kg</span>
        <span><strong>Scr:</strong> ${Number.isFinite(scr)? fmt(scr)+' mg/dL' : '—'}</span>
        <span><strong>ClCr (CG):</strong> ${crcl? fmt(crcl)+' mL/min' : '—'}</span>
        <span><strong>TA:</strong> ${Number.isFinite(sbp)&&Number.isFinite(dbp)? `${sbp}/${dbp} mmHg`:'—'}</span>
        <span><strong>SatO₂:</strong> ${Number.isFinite(spo2)? `${spo2}%`:'—'}</span>
        <span><strong>Onset:</strong> ${onsetISO || '—'}</span>
      </div>
    `;
    planDiv.appendChild(block1);
    const folio = storageGet('folio_current', null) || genFolio((name||'') + (onsetISO||''));
    storageSet('folio_current', folio);
    const genStr = localDateTimeStr(new Date());
    const folioKV = document.createElement('div'); folioKV.className='kv'; folioKV.innerHTML = `<span><strong>Folio:</strong> ${folio}</span><span><strong>Generado:</strong> ${genStr}</span>`; block1.appendChild(folioKV);
    const pf=document.getElementById('printFolioBar'); if(pf){ pf.textContent = `Folio: ${folio} · Generado: ${genStr}`; }
    document.title = `${folio} – ${(name||'Paciente')} – Código Infarto (SinapsCore)`;
    // Render print header QR + fields
    try {
      const phLogo = document.getElementById('printHeaderLogo');
      const brandLogo = document.getElementById('brandLogo');
      if (phLogo && brandLogo) phLogo.src = brandLogo.src;
      const phF = document.getElementById('phFolio');
      const phG = document.getElementById('phGen');
      if (phF) phF.textContent = 'Folio: ' + folio;
      if (phG) phG.textContent = 'Generado: ' + genStr;
      const qrTarget = document.getElementById('printQR');
      if (qrTarget) {
        qrTarget.innerHTML='';
        const base = localStorage.getItem('qr_base') || '';
        const qrText = base ? (base + folio) : ('FOLIO:' + folio);
        new QRCode(qrTarget, {text: qrText, width: 84, height: 84});
      }
    } catch(e) {}


    const block2 = document.createElement('div');
    block2.className = "plan-block";
    block2.innerHTML = `<h3>Tenecteplasa (TNK)</h3>
      <div class="plan-row"><div><strong>Dosis bolo IV</strong></div><div>${(!(pregnant||scad) && cis.length===0 && Number.isFinite(tnk)) ? fmt(tnk)+' mg' : '—'}</div></div>
      <div class="plan-row"><div>Nota</div><div>${halfDose75() && age>=75 ? '½ dosis por ≥75 a (según protocolo)' : 'Dosis por banda de peso'}</div></div>
    `;
    planDiv.appendChild(block2);

    const block3 = document.createElement('div');
    block3.className = "plan-block";
    const e = preferUFH() ? null : enoxaparina(age, crcl, weight);
    block3.innerHTML = `<h3>Anticoagulación</h3>
      <div class="plan-row"><div><strong>Preferencia</strong></div><div>${preferUFH() ? 'UFH' : 'Enoxaparina'}</div></div>
      <div class="plan-row"><div><strong>Detalle</strong></div><div>${preferUFH()? 
        `UFH: bolo ${anticoag.bolusUnits} U IV → infusión ${anticoag.rateUnitsPerHour} U/h (ajustar por TTPa)` :
        `IV bolo: ${fmt(anticoag.ivBolus)} mg · SC: ${fmt(anticoag.scDoseMg)} mg c/${anticoag.intervalH} h ${e&&e.capFirstTwo? '(cap 2 primeras: '+fmt(e.capFirstTwo)+' mg)':''} · Volumen aprox/dosis: ${fmt(anticoag.scVolPerDoseMl)} mL`
      }</div></div>
      <div class="plan-row"><div><strong>Notas</strong></div><div>${preferUFH()? 'Considerar 48 h o hasta revascularización.' : anticoag.notes}</div></div>
    `;
    planDiv.appendChild(block3);

    const block4 = document.createElement('div');
    block4.className = "plan-block";
    block4.innerHTML = `<h3>Antiagregación</h3>
      <div class="plan-row"><div><strong>ASA</strong></div><div>Carga ${asaPlan.loadMin}–${asaPlan.loadMax} mg → Mantenimiento ${asaPlan.maint} mg/d</div></div>
      <div class="plan-row"><div><strong>Clopidogrel</strong></div><div>${clop.load>0? 'Carga '+clop.load+' mg → ': ''}Mantenimiento ${clop.maint} mg/d</div></div>
      <div class="small">Evitar punciones no compresibles; control riguroso de PA.</div>
    `;
    planDiv.appendChild(block4);

    const block5 = document.createElement('div');
    block5.className = "plan-block";
    block5.innerHTML = `<h3>Checklist de administración (desde ahora)</h3>`;
    const ul = document.createElement('div');
    
    schedule.forEach(step=>{
      const row = document.createElement('div');
      row.className = "plan-row";
      row.innerHTML = `<div class="check">
          <input type="checkbox" id="${step.key}">
          <label for="${step.key}"><strong>${step.label}</strong> <span class="badge">${step.time}</span></label>
        </div>
        <div class="small">${step.note||''}</div>`;
      // Campos de administración
      const admin = document.createElement('div');
      admin.className = 'admin-fields';
      // cargar estado previo
      const saved = storageGet('admin_'+step.key, {});
      const tf = document.createElement('div');
      tf.innerHTML = `<label>Hora admin.<input type="time" value="${saved.time || step.time || nowHM()}"></label>`;
      const qf = document.createElement('div');
      qf.innerHTML = `<label>Cantidad aplicada<input type="text" placeholder="mg, mL, U" value="${saved.qty || ''}"></label>`;
      const nf = document.createElement('div');
      nf.innerHTML = `<label>Notas<input type="text" placeholder="Lote, vía, sitio, eventos..." value="${saved.note || ''}"></label>`;
      admin.appendChild(tf); admin.appendChild(qf); admin.appendChild(nf);
      // guardar en cambios
      const [timeInput, qtyInput, noteInput] = admin.querySelectorAll('input');
      [timeInput, qtyInput, noteInput].forEach(()=>{});
      timeInput.addEventListener('change', ()=> storageSet('admin_'+step.key, {time: timeInput.value, qty: qtyInput.value, note: noteInput.value}));
      qtyInput.addEventListener('input', ()=> storageSet('admin_'+step.key, {time: timeInput.value, qty: qtyInput.value, note: noteInput.value}));
      noteInput.addEventListener('input', ()=> storageSet('admin_'+step.key, {time: timeInput.value, qty: qtyInput.value, note: noteInput.value}));
      row.appendChild(admin);
      block5.appendChild(row);
    });

    planDiv.appendChild(block5);

    const block6 = document.createElement('div');
    block6.className = "plan-block";
    block6.innerHTML = `<h3>Reperfusión y rescate</h3>
      <div class="plan-row"><div>EKG 60–90 min</div><div>Éxito: ↓ST ≥50% → Coro/PCI 2–24 h</div></div>
      <div class="plan-row"><div>Fallo de lisis</div><div>↓ST <50%, dolor persistente o inestabilidad → PCI rescate inmediata</div></div>
    `;
    planDiv.appendChild(block6);

    // Export JSON
    
    // recolectar registros de administración y notas de evolución
    const adminRecords = {};
    schedule.forEach(s=>{
      adminRecords[s.key] = storageGet('admin_'+s.key, {});
    });
    const evoNotes = {
      inicio: storageGet('evo_inicio',''),
      intermedia: storageGet('evo_intermedia',''),
      final: storageGet('evo_final','')
    };
    const payload = {
      folio: storageGet('folio_current', null),
      generatedLocal: localDateTimeStr(new Date()),
      generatedAt: new Date().toISOString(),
      physician: {name: mdName, license: mdLicense},
      patient: {name, age, sex, weightKg: weight, scrMgDl: scr, sbp, dbp, spo2, pregnant, scad, pciDelay, onsetISO},
      risk: {absoluteCI: cis},
      renal: {crcl},
      meds: { tnkMg: tnk, asa: asaPlan, clopidogrel: clop, anticoagulation: anticoag },
      schedule,
      adminRecords,
      evoNotes
    };

    qs('#exportJson').onclick = () => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(storageGet('folio_current', null) || 'CI')}-${(name||'Paciente').replace(/\s+/g,'_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  qs('#generatePlan').addEventListener('click', buildPlan);
  qs('#printPlan').addEventListener('click', ()=> window.print());

  // DOM ready actions
  window.addEventListener('DOMContentLoaded', ()=>{
    loadEvoNotes();
    setupEvoControls();

    // Hint: on iPad/mobile, show checklist if selected
    if(document.body.classList.contains('checklist')){
      // Nothing else needed—CSS oculta lo no esencial
    }
  });
})();
