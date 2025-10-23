(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const fmt = n => Number.isFinite(n) ? (Math.round(n*100)/100) : '—';
  function storageGet(key, def=null){ try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }catch{ return def; } }
  function storageSet(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  const pad2 = n => String(n).padStart(2,'0');
  const localDateTimeStr = (d=new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  // THEME
  const darkBtn = qs('#darkToggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  function themePref(){ const saved = localStorage.getItem('theme') || 'auto'; return saved==='auto' ? (mq.matches ? 'light':'dark') : saved; }
  function setThemeColor(t){ if(themeMeta){ themeMeta.setAttribute('content', t==='light' ? '#f6f8fb' : '#0b0e13'); } }
  function applyTheme(){ const t = themePref(); document.body.classList.toggle('light', t==='light'); setThemeColor(t); }
  mq.addEventListener?.('change', applyTheme);
  darkBtn.addEventListener('click', ()=>{ const cur = localStorage.getItem('theme') || 'auto'; const next = cur==='auto' ? 'dark' : (cur==='dark' ? 'light' : 'auto'); localStorage.setItem('theme', next); applyTheme(); });
  applyTheme();

  // Checklist
  const checklistBtn = qs('#checklistToggle');
  function applyChecklist(){ const c = storageGet('checklist','true')==='true'; document.body.classList.toggle('checklist', c); checklistBtn?.setAttribute('aria-pressed', c?'true':'false'); }
  checklistBtn.addEventListener('click', ()=>{ const c = storageGet('checklist','true')==='true'; storageSet('checklist', (!c).toString()); applyChecklist(); });
  applyChecklist();

  // Branding
  const brandDlg = qs('#brandDialog'), brandBtn=qs('#brandSettingsBtn'), brandName=qs('#brandName'), brandTagline=qs('#brandTagline'), brandLogoURL=qs('#brandLogoURL'), brandPrimary=qs('#brandPrimary'), brandSecondary=qs('#brandSecondary'), brandQRBase=qs('#brandQRBase'), brandLogo=qs('#brandLogo');
  const DEFAULT_QR_BASE = 'https://jgrlga.github.io/JGRLGA-Med-Line/';
  function loadBrand(){
    try{ if(!localStorage.getItem('qr_base')){ localStorage.setItem('qr_base', DEFAULT_QR_BASE); } }catch(e){}
    const st = storageGet('brand',{});
    if(st.name){ brandName.value = st.name; qs('.brand-txt h1').textContent = st.name; }
    if(st.tagline){ brandTagline.value = st.tagline; qs('.tagline').textContent = st.tagline; }
    if(st.logo){ brandLogoURL.value = st.logo; brandLogo.src = st.logo; }
    if(st.primary){ brandPrimary.value = st.primary; document.documentElement.style.setProperty('--brand-primary', st.primary); }
    if(st.secondary){ brandSecondary.value = st.secondary; document.documentElement.style.setProperty('--brand-secondary', st.secondary); }
    brandQRBase.value = st.qrBase || (localStorage.getItem('qr_base') || DEFAULT_QR_BASE);
  }
  function saveBrand(){
    const st = { name: brandName.value.trim()||'SinapsCore', tagline: brandTagline.value.trim()||'Salud Conectada. IA en el Núcleo', logo: brandLogoURL.value.trim()||brandLogo.src, primary: brandPrimary.value||'#d4af37', secondary: brandSecondary.value||'#c0c0c0', qrBase: brandQRBase.value.trim()||'' };
    storageSet('brand', st); if(st.qrBase){ localStorage.setItem('qr_base', st.qrBase); } else { localStorage.removeItem('qr_base'); } loadBrand();
  }
  brandBtn.addEventListener('click', ()=> brandDlg.showModal());
  qs('#saveBrand').addEventListener('click', (e)=>{ e.preventDefault(); saveBrand(); brandDlg.close(); });
  loadBrand();

  // Calcs
  function cockcroftGault(age, weightKg, sex, scrMgDl){ if(!age || !weightKg || !scrMgDl || scrMgDl<=0) return null; let crcl = ((140 - age) * weightKg) / (72 * scrMgDl); if(sex==='F') crcl*=0.85; return crcl; }
  function tnkDose(weightKg, age, halfFor75){ if(!weightKg) return null; let mg=0; if(weightKg<60) mg=30; else if(weightKg<70) mg=35; else if(weightKg<80) mg=40; else if(weightKg<90) mg=45; else mg=50; if(halfFor75 && age>=75){ mg = Math.round((mg/2)/5)*5; } return mg; }
  function clopidogrel(age){ return {load: (age>75)?0:300, maint:75}; }
  function asa(){ return {loadMin:162, loadMax:325, maint:100}; }
  function enoxaparina(age, crcl, weightKg){ if(!weightKg) return null; const conc=100; let r={ivBolus:0,scDoseMg:0,intervalH:12,notes:""}; if(crcl!==null && crcl<30){ r.ivBolus=0; r.scDoseMg=1.0*weightKg; r.intervalH=24; r.notes="ClCr <30 mL/min: 1 mg/kg SC c/24 h (evitar bolo IV)."; } else { if(age>=75){ r.ivBolus=0; r.scDoseMg=0.75*weightKg; r.intervalH=12; r.capFirstTwo=75; r.notes="≥75 a: sin bolo; 0.75 mg/kg SC c/12 h (cap 2 primeras: 75 mg)."; } else { r.ivBolus=30; r.scDoseMg=1.0*weightKg; r.intervalH=12; r.capFirstTwo=100; r.notes="<75 a: 30 mg IV → a 15 min 1 mg/kg SC c/12 h (cap 2 primeras: 100 mg)."; } } r.scVolPerDoseMl = r.scDoseMg/conc; if(r.capFirstTwo) r.volCapFirstTwoMl = r.capFirstTwo/conc; return r; }
  function ufh(weightKg){ const bolus=Math.min(60*weightKg,4000); const rate=Math.min(12*weightKg,1000); return {bolusUnits:Math.round(bolus), rateUnitsPerHour:Math.round(rate)}; }

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
    const onsetISO = qs('#symptomOnset').value;

    const warnings = qs('#warnings'); warnings.innerHTML = "";
    const pushWarn = (msg,danger=false)=>{ const div=document.createElement('div'); div.className="alert"+(danger?" danger":""); div.textContent=msg; warnings.appendChild(div); };
    const cis = qsa('.absCI:checked').map(el=>el.value);
    if(cis.length>0){ pushWarn("⚠️ Contraindicaciones absolutas marcadas: " + cis.join(" · ") + ". Evitar fibrinólisis.", true); }
    if(pregnant || scad){ pushWarn("⚠️ Embarazo/posparto o sospecha de SCAD: prefiera PCI. Evitar fibrinólisis.", true); }
    if(Number.isFinite(sbp)&&Number.isFinite(dbp)&&(sbp>180||dbp>110)){ pushWarn("⚠️ TA >180/110 mmHg: controle la PA antes de administrar líticos.", true); }
    if(Number.isFinite(spo2)&&spo2<90){ pushWarn("💡 SatO₂ <90% → administre oxígeno suplementario.", false); }
    if(Number.isFinite(pciDelay)){ pushWarn(pciDelay<=120? "ℹ️ PCI primaria ≤120 min. Preferir PCI salvo criterios particulares." : "⏱️ PCI primaria >120 min → Fibrinólisis razonable si en ventana y sin CI."); }

    const crcl = cockcroftGault(age, weight, sex, scr);
    const tnk = tnkDose(weight, age, qs('#halfDose75').checked);
    const clop = clopidogrel(age);
    const asaPlan = asa();

    let anticoag, schedule=[], now=new Date(), timeFmt=(d)=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    if(qs('#preferUFH').checked){
      const u = ufh(weight); anticoag = {type:"UFH", ...u};
      schedule.push({label:"UFH bolo IV", time: timeFmt(now), note:`${u.bolusUnits} U IV ahora`, key:"ufh_bolus"});
      schedule.push({label:"UFH infusión", time: timeFmt(now), note:`${u.rateUnitsPerHour} U/h, ajustar por TTPa`, key:"ufh_infusion"});
    } else {
      const e = enoxaparina(age, crcl, weight); anticoag = {type:"Enoxaparina", ...e};
      if(e.ivBolus>0){
        schedule.push({label:"Enoxaparina bolo IV", time: timeFmt(now), note:`${fmt(e.ivBolus)} mg IV ahora`, key:"enox_bolus"});
        schedule.push({label:"Enoxaparina 1ª SC", time: timeFmt(new Date(now.getTime()+15*60000)), note:`${fmt(e.scDoseMg)} mg SC (${fmt(e.scVolPerDoseMl)} mL) a +15 min`, key:"enox_sc_1"});
      } else {
        schedule.push({label:"Enoxaparina 1ª SC", time: timeFmt(now), note:`${fmt(e.scDoseMg)} mg SC (${fmt(e.scVolPerDoseMl)} mL) ahora`, key:"enox_sc_1"});
      }
      const interval=e.intervalH; for(let i=1;i<4;i++){ const when=new Date(now.getTime()+i*interval*60*60000); schedule.push({label:`Enoxaparina SC (dosis ${i+1})`, time: timeFmt(when), note:`${fmt(e.scDoseMg)} mg SC c/${interval} h${e.capFirstTwo? " (cap 2 primeras: "+fmt(e.capFirstTwo)+" mg)":""}`, key:`enox_sc_${i+1}`}); }
    }
    if(!(pregnant||scad) && cis.length===0){ schedule.unshift({label:"Tenecteplasa (TNK) bolo IV", time: timeFmt(now), note:`${fmt(tnk)} mg en 5–10 s`, key:"tnk"}); }
    schedule.unshift({label:"Aspirina (ASA) carga", time: timeFmt(now), note:`${asaPlan.loadMin}–${asaPlan.loadMax} mg (VO masticable; IV si no VO)`, key:"asa"});
    if(clop.load>0){ schedule.push({label:"Clopidogrel carga", time: timeFmt(now), note:`${clop.load} mg VO si ≤75 a`, key:"clop_load"}); }
    else { schedule.push({label:"Clopidogrel", time: timeFmt(now), note:`${clop.maint} mg VO/día (sin carga si >75 a)`, key:"clop"}); }
    schedule.push({label:"EKG de control", time: timeFmt(new Date(now.getTime()+75*60000)), note:"Valorar ↓ST ≥50% · si fallo → PCI rescate", key:"ekg_90"});
    schedule.push({label:"Programar coronariografía/PCI", time: timeFmt(new Date(now.getTime()+3*60*60000)), note:"2–24 h tras lisis si éxito", key:"pci_224"});

    const planDiv = qs('#plan'); planDiv.innerHTML="";
    const block1=document.createElement('div'); block1.className='plan-block';
    const onsetStr = onsetISO || '';
    block1.innerHTML = `<h3>Resumen</h3>
      <div class="kv"><span><strong>Médico:</strong> ${mdName||'________________'}</span><span><strong>Cédula:</strong> ${mdLicense||'________________'}</span></div>
      <div class="kv">
        <span><strong>Paciente:</strong> ${name||'—'}</span>
        <span><strong>Edad:</strong> ${fmt(age)} a</span>
        <span><strong>Sexo:</strong> ${sex||'—'}</span>
        <span><strong>Peso:</strong> ${fmt(weight)} kg</span>
        <span><strong>Scr:</strong> ${Number.isFinite(scr)? fmt(scr)+' mg/dL' : '—'}</span>
        <span><strong>ClCr (CG):</strong> ${Number.isFinite(cockcroftGault(age,weight,sex,scr))? fmt(cockcroftGault(age,weight,sex,scr))+' mL/min' : '—'}</span>
        <span><strong>TA:</strong> ${Number.isFinite(sbp)&&Number.isFinite(dbp)? `${sbp}/${dbp} mmHg`:'—'}</span>
        <span><strong>SatO₂:</strong> ${Number.isFinite(spo2)? `${spo2}%`:'—'}</span>
        <span><strong>Onset:</strong> ${onsetStr||'—'}</span>
      </div>`;
    planDiv.appendChild(block1);

    // Folio
    const seed = (name||'') + (onsetStr||'') + (new Date().toISOString()); let h=0; for(let i=0;i<seed.length;i++){ h=((h<<5)-h)+seed.charCodeAt(i); h|=0; }
    const hex=(h>>>0).toString(16).slice(-4).toUpperCase();
    const d=new Date(); const stamp = `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
    const folio = `CI-${stamp}-${hex}`; storageSet('folio_current', folio);
    const genStr = localDateTimeStr(new Date());
    const folioKV=document.createElement('div'); folioKV.className='kv'; folioKV.innerHTML=`<span><strong>Folio:</strong> ${folio}</span><span><strong>Generado:</strong> ${genStr}</span>`; block1.appendChild(folioKV);
    const pf=document.getElementById('printFolioBar'); if(pf){ pf.textContent = `Folio: ${folio} · Generado: ${genStr}`; }
    document.title = `${folio} – ${(name||'Paciente')} – Código Infarto (SinapsCore)`;

    try{
      const phLogo=qs('#printHeaderLogo'), brandLogo=qs('#brandLogo'); if(phLogo&&brandLogo) phLogo.src=brandLogo.src;
      const phF=qs('#phFolio'), phG=qs('#phGen'); if(phF) phF.textContent='Folio: '+folio; if(phG) phG.textContent='Generado: '+genStr;
      const qrTarget=qs('#printQR'); const base=localStorage.getItem('qr_base')||''; const qrText= base ? (base+folio) : ('FOLIO:'+folio);
      if(window.QRCode){ qrTarget.innerHTML=''; new QRCode(qrTarget,{text:qrText,width:84,height:84}); }
      else { qrTarget.innerHTML='<div style="width:84px;height:84px;display:flex;align-items:center;justify-content:center;border:1px solid #ccc;font-size:10px;text-align:center;padding:4px">QR<br>no<br>cargado</div>'; }
    }catch(e){}

    const block2=document.createElement('div'); block2.className='plan-block';
    const tnk = tnkDose(weight, age, qs('#halfDose75').checked);
    block2.innerHTML = `<h3>Tenecteplasa (TNK)</h3>
      <div class="plan-row"><div><strong>Dosis bolo IV</strong></div><div>${(!(pregnant||scad) && cis.length===0 && Number.isFinite(tnk)) ? fmt(tnk)+' mg' : '—'}</div></div>
      <div class="plan-row"><div>Nota</div><div>${(qs('#halfDose75').checked && age>=75) ? '½ dosis por ≥75 a (según protocolo)' : 'Dosis por banda de peso'}</div></div>`;
    planDiv.appendChild(block2);

    const block3=document.createElement('div'); block3.className='plan-block';
    const crcl = cockcroftGault(age, weight, sex, scr);
    if(qs('#preferUFH').checked){
      const u = ufh(weight);
      block3.innerHTML = `<h3>Anticoagulación (UFH)</h3>
        <div class="plan-row"><div>Bolo</div><div>${u.bolusUnits} U IV ahora</div></div>
        <div class="plan-row"><div>Infusión</div><div>${u.rateUnitsPerHour} U/h (ajustar por TTPa)</div></div>`;
    } else {
      const e = enoxaparina(age, crcl, weight);
      block3.innerHTML = `<h3>Anticoagulación (Enoxaparina)</h3>
        <div class="plan-row"><div>Bolo IV</div><div>${fmt(e.ivBolus)} mg</div></div>
        <div class="plan-row"><div>Dosis SC</div><div>${fmt(e.scDoseMg)} mg c/${e.intervalH} h (vol/dosis ${fmt(e.scVolPerDoseMl)} mL) ${e.capFirstTwo? ' · Cap 2 primeras: '+fmt(e.capFirstTwo)+' mg':''}</div></div>
        <div class="plan-row"><div>Notas</div><div>${e.notes}</div></div>`;
    }
    planDiv.appendChild(block3);

    const clop = clopidogrel(age); const asaPlan = asa();
    const block4=document.createElement('div'); block4.className='plan-block';
    block4.innerHTML = `<h3>Antiagregación</h3>
      <div class="plan-row"><div><strong>ASA</strong></div><div>Carga ${asaPlan.loadMin}–${asaPlan.loadMax} mg → Mantenimiento ${asaPlan.maint} mg/d</div></div>
      <div class="plan-row"><div><strong>Clopidogrel</strong></div><div>${clop.load>0? 'Carga '+clop.load+' mg → ': ''}Mantenimiento ${clop.maint} mg/d</div></div>`;
    planDiv.appendChild(block4);

    const block5=document.createElement('div'); block5.className='plan-block'; block5.innerHTML='<h3>Checklist de administración (desde ahora)</h3>';
    const schedule=[];
    schedule.push({label:'Aspirina (ASA) carga', time:'', note:'', key:'asa'});
    if(!(pregnant||scad) && cis.length===0){ schedule.push({label:'Tenecteplasa (TNK) bolo IV', time:'', note:'', key:'tnk'}); }
    if(qs('#preferUFH').checked){
      schedule.push({label:'UFH bolo IV', time:'', note:'', key:'ufh_bolus'});
      schedule.push({label:'UFH infusión', time:'', note:'', key:'ufh_infusion'});
    }else{
      schedule.push({label:'Enoxaparina bolo IV', time:'', note:'', key:'enox_bolus'});
      schedule.push({label:'Enoxaparina SC', time:'', note:'', key:'enox_sc'});
    }
    schedule.push({label:'Clopidogrel', time:'', note:'', key:'clop'});
    schedule.push({label:'EKG 60–90 min', time:'', note:'', key:'ekg_90'});
    schedule.push({label:'Programar coro/PCI 2–24 h', time:'', note:'', key:'pci_224'});
    schedule.forEach(step=>{
      const row=document.createElement('div'); row.className='plan-row';
      row.innerHTML=`<div class="check"><input type="checkbox" id="${step.key}"><label for="${step.key}"><strong>${step.label}</strong></label></div>`;
      const admin=document.createElement('div'); admin.className='admin-fields';
      const saved=storageGet('admin_'+step.key,{});
      const tf=document.createElement('div'); tf.innerHTML=`<label>Hora admin.<input type="time" value="${saved.time||''}"></label>`;
      const qf=document.createElement('div'); qf.innerHTML=`<label>Cantidad aplicada<input type="text" placeholder="mg, mL, U" value="${saved.qty||''}"></label>`;
      const nf=document.createElement('div'); nf.innerHTML=`<label>Notas<input type="text" placeholder="Lote, vía, sitio, eventos..." value="${saved.note||''}"></label>`;
      admin.appendChild(tf); admin.appendChild(qf); admin.appendChild(nf);
      const [timeInput, qtyInput, noteInput]=admin.querySelectorAll('input');
      const save=()=> storageSet('admin_'+step.key,{time:timeInput.value, qty:qtyInput.value, note:noteInput.value});
      timeInput.addEventListener('change',save); qtyInput.addEventListener('input',save); noteInput.addEventListener('input',save);
      row.appendChild(admin); block5.appendChild(row);
    });
    planDiv.appendChild(block5);

    const adminRecords = {}; schedule.forEach(s=> adminRecords[s.key]=storageGet('admin_'+s.key,{}));
    const evoNotes = {inicio: storageGet('evo_inicio',''), intermedia: storageGet('evo_intermedia',''), final: storageGet('evo_final','')};
    const payload = {folio, generatedLocal: genStr, physician:{name:mdName, license:mdLicense}, patient:{name, age, sex, weightKg:weight, scrMgDl:scr, sbp, dbp, spo2, pregnant, scad, pciDelay, onsetISO}, meds:{tnkMg:tnkDose(weight,age,qs('#halfDose75').checked), asa:asa(), clopidogrel:clopidogrel(age)}, adminRecords, evoNotes };
    qs('#exportJson').onclick = ()=>{ const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${folio}-${(name||'Paciente').replace(/\s+/g,'_')}.json`; a.click(); URL.revokeObjectURL(url); };
  }

  function loadEvoNotes(){ const ei=qs('#evoInicio'),em=qs('#evoIntermedia'),ef=qs('#evoFinal'); if(ei) ei.value=storageGet('evo_inicio','')||''; if(em) em.value=storageGet('evo_intermedia','')||''; if(ef) ef.value=storageGet('evo_final','')||''; [[ei,'evo_inicio'],[em,'evo_intermedia'],[ef,'evo_final']].forEach(([el,key])=>{ if(!el) return; el.addEventListener('input', ()=> storageSet(key, el.value)); }); }
  function insertAtCursor(el, text){ const start=el.selectionStart||0,end=el.selectionEnd||0; el.value=el.value.slice(0,start)+text+el.value.slice(end); el.selectionStart=el.selectionEnd=start+text.length; el.dispatchEvent(new Event('input')); }
  function setupEvoControls(){ const map=[{id:'evoInicio',k:'evo_inicio',ts:'ts_evo_inicio'},{id:'evoIntermedia',k:'evo_intermedia',ts:'ts_evo_intermedia'},{id:'evoFinal',k:'evo_final',ts:'ts_evo_final'}]; map.forEach(({id,k,ts})=>{ const ta=document.getElementById(id); if(!ta || ta._controls) return; const bar=document.createElement('div'); bar.className='evo-controls'; const btn=document.createElement('button'); btn.type='button'; btn.textContent='Añadir sello de tiempo'; const info=document.createElement('small'); info.id=id+'_last'; const savedTs=storageGet(ts,''); info.textContent=savedTs?`Última edición: ${savedTs}`:'Última edición: —'; btn.addEventListener('click', ()=> insertAtCursor(ta, `[${localDateTimeStr()}] `)); ta.addEventListener('input', ()=>{ const t=localDateTimeStr(); storageSet(ts,t); info.textContent='Última edición: '+t; }); bar.appendChild(btn); bar.appendChild(info); ta.parentNode.insertBefore(bar, ta.nextSibling); ta._controls={bar,info}; }); }

  // Buttons
  qs('#generatePlan').addEventListener('click', buildPlan);
  qs('#printPlan').addEventListener('click', ()=> window.print());

  // On load
  window.addEventListener('DOMContentLoaded', ()=>{
    const onset = qs('#symptomOnset'); if(onset && !onset.value){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); onset.value = d.toISOString().slice(0,16); }
    loadBrand(); loadEvoNotes(); applyChecklist(); applyTheme();
  });
})();