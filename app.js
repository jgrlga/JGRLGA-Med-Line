(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const pad2 = n => String(n).padStart(2,'0');
  const fmt = n => (Number.isFinite(n) ? (Math.round(n*100)/100) : '—');
  const storageGet = (k,def=null)=>{ try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); }catch{return def;} };
  const storageSet = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
  const localDateTimeStr = (d=new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  // ===== Lock / Unlock =====
  function setLocked(lock){
    const allow = new Set(['loadSaved','clearAll','printPlan','exportJson']);
    qsa('input, select, textarea, button').forEach(el=>{
      if(allow.has(el.id)) return;
      if(el.id==='saveAll'){ el.disabled = !!lock; return; }
      el.disabled = !!lock;
    });
  }

  // ===== Medical calcs =====
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
    if(halfFor75 && age >= 75){ mg = Math.round((mg/2)/5)*5; }
    return mg;
  }
  function asa(){ return {loadMin:162, loadMax:325, maint:100}; }
  function clopidogrel(age){ return {load: (age>75)?0:300, maint:75}; }
  function enoxaparina(age, crcl, weightKg){
    if(!weightKg) return {ivBolus:0, scDoseMg:0, intervalH:12, notes:""};
    const conc=100;
    let r={ivBolus:0, scDoseMg:0, intervalH:12, notes:""};
    if(crcl!==null && crcl<30){
      r.ivBolus=0; r.scDoseMg=1.0*weightKg; r.intervalH=24; r.notes="ClCr <30 mL/min: 1 mg/kg SC c/24 h (evitar bolo IV).";
    } else {
      if(age>=75){ r.ivBolus=0; r.scDoseMg=0.75*weightKg; r.intervalH=12; r.capFirstTwo=75; r.notes="≥75 a: sin bolo; 0.75 mg/kg SC c/12 h (cap 2 primeras: 75 mg)."; }
      else { r.ivBolus=30; r.scDoseMg=1.0*weightKg; r.intervalH=12; r.capFirstTwo=100; r.notes="<75 a: 30 mg IV → a 15 min 1 mg/kg SC c/12 h (cap 2 primeras: 100 mg)."; }
    }
    r.scVolPerDoseMl = r.scDoseMg/conc;
    if(r.capFirstTwo) r.volCapFirstTwoMl = r.capFirstTwo/conc;
    return r;
  }
  function ufh(weightKg){
    const bolus = Math.min(60*weightKg, 4000);
    const rate = Math.min(12*weightKg, 1000);
    return {bolusUnits: Math.round(bolus), rateUnitsPerHour: Math.round(rate)};
  }

  // ===== Build plan =====
  function buildPlan(){
    // Read form
    const mdName = qs('#mdName')?.value.trim() || '';
    const mdLicense = qs('#mdLicense')?.value.trim() || '';
    const name = qs('#pxName')?.value.trim() || '';
    const age = parseInt(qs('#age')?.value || '0',10);
    const sex = qs('#sex')?.value || 'M';
    const weight = parseFloat(qs('#weight')?.value || '0');
    const scr = parseFloat(qs('#scr')?.value || '0');
    const sbp = parseFloat(qs('#sbp')?.value || '0');
    const dbp = parseFloat(qs('#dbp')?.value || '0');
    const spo2 = parseFloat(qs('#spo2')?.value || '0');
    const pregnant = (qs('#pregnant')?.value || 'no') === 'si';
    const scad = (qs('#scad')?.value || 'no') === 'si';
    const pciDelay = parseFloat(qs('#pciDelay')?.value || '0');
    const onsetISO = qs('#symptomOnset')?.value || '';

    const warnings = qs('#warnings'); if(warnings) warnings.innerHTML = "";
    const pushWarn = (msg,danger=false)=>{ const div=document.createElement('div'); div.className="alert"+(danger?" danger":""); div.textContent=msg; warnings?.appendChild(div); };
    const cis = qsa('.absCI:checked').map(el=>el.value);
    if(cis.length>0){ pushWarn("⚠️ Contraindicaciones absolutas marcadas: " + cis.join(" · ") + ". Evitar fibrinólisis.", true); }
    if(pregnant || scad){ pushWarn("⚠️ Embarazo/posparto o sospecha de SCAD: prefiera PCI. Evitar fibrinólisis.", true); }
    if(Number.isFinite(sbp)&&Number.isFinite(dbp)&&(sbp>180||dbp>110)){ pushWarn("⚠️ TA >180/110 mmHg: controle la PA antes de administrar líticos.", true); }
    if(Number.isFinite(spo2)&&spo2<90){ pushWarn("💡 SatO₂ <90% → administre oxígeno suplementario.", false); }
    if(Number.isFinite(pciDelay) && pciDelay>0){ pushWarn(pciDelay<=120? "ℹ️ PCI primaria ≤120 min. Preferir PCI salvo criterios particulares." : "⏱️ PCI primaria >120 min → Fibrinólisis razonable si en ventana y sin CI."); }

    const crcl = cockcroftGault(age, weight, sex, scr);
    const tnk = tnkDose(weight, age, qs('#halfDose75')?.checked);
    const clop = clopidogrel(age);
    const asaPlan = asa();

    // Schedule / anticoag
    let anticoag;
    const schedule=[];
    const now = new Date();
    const timeFmt = (d)=>`${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

    if(qs('#preferUFH')?.checked){
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

    // Render plan
    const plan = qs('#plan'); if(plan) plan.innerHTML = "";
    const block1 = document.createElement('div'); block1.className="plan-block";
    const onsetStr = onsetISO || '';
    block1.innerHTML = `<h3>Resumen</h3>
      <div class="kv"><span><strong>Médico:</strong> ${mdName||'________________'}</span><span><strong>Cédula:</strong> ${mdLicense||'________________'}</span></div>
      <div class="kv">
        <span><strong>Paciente:</strong> ${name||'—'}</span>
        <span><strong>Edad:</strong> ${fmt(age)} a</span>
        <span><strong>Sexo:</strong> ${sex||'—'}</span>
        <span><strong>Peso:</strong> ${fmt(weight)} kg</span>
        <span><strong>Scr:</strong> ${Number.isFinite(scr)? fmt(scr)+' mg/dL' : '—'}</span>
        <span><strong>ClCr (CG):</strong> ${Number.isFinite(crcl)? fmt(crcl)+' mL/min' : '—'}</span>
        <span><strong>TA:</strong> ${Number.isFinite(sbp)&&Number.isFinite(dbp)? `${sbp}/${dbp} mmHg`:'—'}</span>
        <span><strong>SatO₂:</strong> ${Number.isFinite(spo2)? `${spo2}%`:'—'}</span>
        <span><strong>Onset:</strong> ${onsetStr||'—'}</span>
      </div>`;
    plan?.appendChild(block1);

    // Folio + header QR
    const seed = (name||'') + (onsetStr||'') + (new Date().toISOString());
    let h=0; for(let i=0;i<seed.length;i++){ h=((h<<5)-h)+seed.charCodeAt(i); h|=0; }
    const hex=(h>>>0).toString(16).slice(-4).toUpperCase();
    const d=new Date(); const stamp = `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
    const folio = `CI-${stamp}-${hex}`;
    storageSet('folio_current', folio);
    const genStr = localDateTimeStr(new Date());
    const folioKV = document.createElement('div'); folioKV.className='kv'; folioKV.innerHTML = `<span><strong>Folio:</strong> ${folio}</span><span><strong>Generado:</strong> ${genStr}</span>`; block1.appendChild(folioKV);
    const pf=document.getElementById('printFolioBar'); if(pf){ pf.textContent = `Folio: ${folio} · Generado: ${genStr}`; }
    document.title = `${folio} – ${(name||'Paciente')} – Código Infarto (SinapsCore)`;
    try{
      const phLogo=document.getElementById('printHeaderLogo'); const brandLogo=document.getElementById('brandLogo'); if(phLogo&&brandLogo) phLogo.src=brandLogo.src;
      const phF=document.getElementById('phFolio'); const phG=document.getElementById('phGen'); if(phF) phF.textContent='Folio: '+folio; if(phG) phG.textContent='Generado: '+genStr;
      const qrTarget=document.getElementById('printQR'); const base=localStorage.getItem('qr_base')||'https://jgrlga.github.io/JGRLGA-Med-Line/'; const qrText= base ? (base+folio) : ('FOLIO:'+folio);
      if(window.QRCode){ qrTarget.innerHTML=''; new QRCode(qrTarget,{text:qrText,width:84,height:84}); } else { qrTarget.innerHTML='<div style="width:84px;height:84px;display:flex;align-items:center;justify-content:center;border:1px solid #ccc;font-size:10px;text-align:center;padding:4px">QR<br>no<br>cargado</div>'; }
    }catch(e){}

    const block2 = document.createElement('div'); block2.className="plan-block";
    block2.innerHTML = `<h3>Tenecteplasa (TNK)</h3>
      <div class="plan-row"><div><strong>Dosis bolo IV</strong></div><div>${(!(pregnant||scad) && cis.length===0 && Number.isFinite(tnk)) ? fmt(tnk)+' mg' : '—'}</div></div>
      <div class="plan-row"><div>Nota</div><div>${(qs('#halfDose75')?.checked && age>=75) ? '½ dosis por ≥75 a (según protocolo)' : 'Dosis por banda de peso'}</div></div>`;
    plan?.appendChild(block2);

    const block3 = document.createElement('div'); block3.className="plan-block";
    if(qs('#preferUFH')?.checked){
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
    plan?.appendChild(block3);

    const block4 = document.createElement('div'); block4.className="plan-block";
    block4.innerHTML = `<h3>Antiagregación</h3>
      <div class="plan-row"><div><strong>ASA</strong></div><div>Carga ${asaPlan.loadMin}–${asaPlan.loadMax} mg → Mantenimiento ${asaPlan.maint} mg/d</div></div>
      <div class="plan-row"><div><strong>Clopidogrel</strong></div><div>${clop.load>0? 'Carga '+clop.load+' mg → ': ''}Mantenimiento ${clop.maint} mg/d</div></div>`;
    plan?.appendChild(block4);

    const block5 = document.createElement('div'); block5.className="plan-block"; block5.innerHTML = `<h3>Checklist de administración (desde ahora)</h3>`;
    schedule.forEach(step=>{
      const row=document.createElement('div'); row.className='plan-row';
      row.innerHTML=`<div class="check"><input type="checkbox" id="${step.key}"><label for="${step.key}"><strong>${step.label}</strong> <span class="badge">${step.time}</span></label></div><div class="small">${step.note||''}</div>`;
      const admin=document.createElement('div'); admin.className='admin-fields';
      const saved=storageGet('admin_'+step.key,{});
      const tf=document.createElement('div'); tf.innerHTML=`<label>Hora admin.<input type="time" value="${saved.time||step.time||''}"></label>`;
      const qf=document.createElement('div'); qf.innerHTML=`<label>Cantidad aplicada<input type="text" placeholder="mg, mL, U" value="${saved.qty||''}"></label>`;
      const nf=document.createElement('div'); nf.innerHTML=`<label>Notas<input type="text" placeholder="Lote, vía, sitio, eventos..." value="${saved.note||''}"></label>`;
      admin.appendChild(tf); admin.appendChild(qf); admin.appendChild(nf);
      const [timeInput, qtyInput, noteInput]=admin.querySelectorAll('input');
      const save=()=> storageSet('admin_'+step.key, {time:timeInput.value, qty:qtyInput.value, note:noteInput.value});
      timeInput.addEventListener('change',save); qtyInput.addEventListener('input',save); noteInput.addEventListener('input',save);
      row.appendChild(admin); block5.appendChild(row);
    });
    plan?.appendChild(block5);

    const block6 = document.createElement('div'); block6.className="plan-block";
    block6.innerHTML = `<h3>Reperfusión y rescate</h3>
      <div class="plan-row"><div>EKG 60–90 min</div><div>Éxito: ↓ST ≥50% → Coro/PCI 2–24 h</div></div>
      <div class="plan-row"><div>Fallo de lisis</div><div>↓ST <50%, dolor persistente o inestabilidad → PCI rescate inmediata</div></div>`;
    plan?.appendChild(block6);

    // Save payload for export
    const adminRecords = {}; schedule.forEach(s=> adminRecords[s.key]=storageGet('admin_'+s.key,{}));
    const evoNotes = {inicio: storageGet('evo_inicio',''), intermedia: storageGet('evo_intermedia',''), final: storageGet('evo_final','')};
    const payload = { folio, generatedLocal: genStr, physician:{name:mdName, license:mdLicense}, patient:{name, age, sex, weightKg:weight, scrMgDl:scr, sbp, dbp, spo2, pregnant, scad, pciDelay, onsetISO}, renal:{crcl}, meds:{tnkMg:tnk, asa:asaPlan, clopidogrel:clop, anticoagulation:anticoag}, schedule, adminRecords, evoNotes };
    window._lastPayload = payload;
  }

  // ===== Evo notes persistence =====
  function loadEvoNotes(){
    [['#evoInicio','evo_inicio'],['#evoIntermedia','evo_intermedia'],['#evoFinal','evo_final']].forEach(([sel,key])=>{
      const ta=qs(sel); if(!ta) return;
      ta.value = storageGet(key,'')||'';
      ta.addEventListener('input', ()=> storageSet(key, ta.value));
    });
  }

  // ===== Save/Modify/Clear logic =====
  const CASE_KEY='sinapscore_case_v1';
  function getFormState(){
    const pick = sel => (qs(sel)?.value ?? '').trim();
    const pickNum = sel => { const v=qs(sel)?.value; return v===''? '' : v; };
    const pickChk = sel => !!qs(sel)?.checked;
    const absCI = qsa('.absCI:checked').map(el=>el.value);
    const admin = {};
    Object.keys(localStorage).forEach(k=>{ if(k.startsWith('admin_')){ try{ admin[k]=storageGet(k,{});}catch(e){} } });
    return {
      mdName: pick('#mdName'), mdLicense: pick('#mdLicense'),
      pxName: pick('#pxName'), age: pickNum('#age'), sex: pick('#sex'),
      weight: pickNum('#weight'), scr: pickNum('#scr'), sbp: pickNum('#sbp'), dbp: pickNum('#dbp'), spo2: pickNum('#spo2'),
      pregnant: pick('#pregnant'), scad: pick('#scad'), pciDelay: pickNum('#pciDelay'), onset: pick('#symptomOnset'),
      halfDose75: pickChk('#halfDose75'), preferUFH: pickChk('#preferUFH'),
      absCI, evo:{ inicio: storageGet('evo_inicio',''), intermedia: storageGet('evo_intermedia',''), final: storageGet('evo_final','') },
      admin, folio: storageGet('folio_current', null)
    };
  }
  function setFormState(st){
    if(!st) return;
    const setVal=(sel,val)=>{ const el=qs(sel); if(el!=null && val!==undefined) el.value=val; };
    const setChk=(sel,val)=>{ const el=qs(sel); if(el!=null) el.checked=!!val; };
    setVal('#mdName', st.mdName); setVal('#mdLicense', st.mdLicense);
    setVal('#pxName', st.pxName); setVal('#age', st.age); setVal('#sex', st.sex);
    setVal('#weight', st.weight); setVal('#scr', st.scr); setVal('#sbp', st.sbp);
    setVal('#dbp', st.dbp); setVal('#spo2', st.spo2); setVal('#pregnant', st.pregnant);
    setVal('#scad', st.scad); setVal('#pciDelay', st.pciDelay); setVal('#symptomOnset', st.onset);
    setChk('#halfDose75', st.halfDose75); setChk('#preferUFH', st.preferUFH);
    qsa('.absCI').forEach(cb=> cb.checked = (st.absCI||[]).includes(cb.value));
    storageSet('evo_inicio', st.evo?.inicio || ''); storageSet('evo_intermedia', st.evo?.intermedia || ''); storageSet('evo_final', st.evo?.final || '');
    Object.keys(st.admin||{}).forEach(k=> storageSet(k, st.admin[k]));
    if(st.folio) storageSet('folio_current', st.folio);
  }
  function saveAll(){ try{ buildPlan(); }catch(e){} const st=getFormState(); storageSet(CASE_KEY, st); setLocked(true); alert('Información guardada localmente y bloqueada.'); }
  function loadSaved(){ const st=storageGet(CASE_KEY,null); if(!st){ alert('No hay información guardada.'); return; } setLocked(false); setFormState(st); try{ buildPlan(); }catch(e){} alert('Información cargada y desbloqueada.'); }
  function clearAll(){ localStorage.removeItem(CASE_KEY); Object.keys(localStorage).forEach(k=>{ if(k.startsWith('admin_')||k==='evo_inicio'||k==='evo_intermedia'||k==='evo_final'||k==='folio_current'){ localStorage.removeItem(k); } }); qsa('input').forEach(i=>{ if(i.type==='checkbox') i.checked=false; else if(i.type!=='datetime-local') i.value=''; }); qsa('select').forEach(s=> s.selectedIndex=0); const plan=qs('#plan'); if(plan) plan.innerHTML=''; setLocked(false); alert('Se limpió la información local y se desbloqueó.'); }

  // ===== Wire buttons =====
  function attachHandlers(){
    qs('#generatePlan')?.addEventListener('click', buildPlan);
    qs('#calcPlan2')?.addEventListener('click', buildPlan);
    qs('#saveAll')?.addEventListener('click', saveAll);
    qs('#loadSaved')?.addEventListener('click', loadSaved);
    qs('#clearAll')?.addEventListener('click', clearAll);

    // print (all buttons with .btn-print)
    document.querySelectorAll('.btn-print').forEach(btn=> btn.addEventListener('click', ()=> window.print()));

    // export JSON (for multiple instances)
    document.querySelectorAll('#exportJson').forEach(btn=>
      btn.addEventListener('click', ()=>{
        const payload = window._lastPayload || {};
        const folio = payload.folio || (storageGet('folio_current', 'CI'));
        const name = (payload.patient?.name || 'Paciente').replace(/\\s+/g,'_');
        const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${folio}-${name}.json`; a.click(); URL.revokeObjectURL(url);
      })
    );
  }

  // ===== Init =====
  window.addEventListener('DOMContentLoaded', ()=>{
    // default onset now
    const onset = qs('#symptomOnset'); if(onset && !onset.value){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); onset.value = d.toISOString().slice(0,16); }
    loadEvoNotes();
    attachHandlers();
  });
})();