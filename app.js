// SinapsCore: cálculo + branding + modo solo checklist
(function(){
  
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
  });
  applyTheme();



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
  const brandLogo = qs('#brandLogo');

  function loadBrand(){
    try{
      const st = JSON.parse(localStorage.getItem('brand') || '{}');
      if(st.name){ brandName.value = st.name; qs('.brand-txt h1').textContent = st.name; }
      if(st.tagline){ brandTagline.value = st.tagline; qs('.tagline').textContent = st.tagline; }
      if(st.logo){ brandLogoURL.value = st.logo; brandLogo.src = st.logo; }
      if(st.primary){ brandPrimary.value = st.primary; document.documentElement.style.setProperty('--brand-primary', st.primary); }
      if(st.secondary){ brandSecondary.value = st.secondary; document.documentElement.style.setProperty('--brand-secondary', st.secondary); }
    } catch(e){}
  }
  function saveBrand(){
    const st = {
      name: brandName.value.trim() || 'SinapsCore',
      tagline: brandTagline.value.trim() || 'Salud Conectada. IA en el Núcleo',
      logo: brandLogoURL.value.trim() || 'sinapscore-logo-placeholder.svg',
      primary: brandPrimary.value || '#d4af37',
      secondary: brandSecondary.value || '#c0c0c0'
    };
    localStorage.setItem('brand', JSON.stringify(st));
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
      a.download = `plan-codigo-infarto-${(name||'paciente').replace(/\s+/g,'_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  qs('#generatePlan').addEventListener('click', buildPlan);
  qs('#printPlan').addEventListener('click', ()=> window.print());

  // DOM ready actions
  window.addEventListener('DOMContentLoaded', ()=>{
    loadEvoNotes();

    // Hint: on iPad/mobile, show checklist if selected
    if(document.body.classList.contains('checklist')){
      // Nothing else needed—CSS oculta lo no esencial
    }
  });
})();
