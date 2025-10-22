// Código principal
(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const fmt = n => Number.isFinite(n) ? (Math.round(n*100)/100) : '—';
  const nowLocalISO = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const d2 = new Date(d.getTime() - off*60000);
    return d2.toISOString().slice(0,16);
  };

  // Tema
  const darkBtn = qs('#darkToggle');
  const applyTheme = () => {
    const t = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light', t === 'light');
  };
  darkBtn.addEventListener('click', ()=>{
    const t = localStorage.getItem('theme') || 'dark';
    localStorage.setItem('theme', t === 'dark' ? 'light' : 'dark');
    applyTheme();
  });
  applyTheme();

  // Prefill onset now
  const onset = qs('#symptomOnset');
  if(!onset.value) onset.value = nowLocalISO();

  // Calculos
  const halfDose75 = () => qs('#halfDose75').checked;
  const preferUFH = () => qs('#preferUFH').checked;

  function cockcroftGault(age, weightKg, sex, scrMgDl){
    if(!age || !weightKg || !scrMgDl || scrMgDl<=0) return null;
    let crcl = ((140 - age) * weightKg) / (72 * scrMgDl);
    if(sex === 'F') crcl *= 0.85;
    return crcl; // mL/min (aprox, peso actual)
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
      // redondeo a múltiplos de 5 mg para manejo práctico
      mg = Math.round(mg/5)*5;
    }
    return mg;
  }

  function clopidogrel(age){
    let load = (age>75) ? 0 : 300;
    return {load, maint: 75};
  }

  function asa(){
    return {loadMin: 162, loadMax: 325, maint: 100};
  }

  function enoxaparina(age, crcl, weightKg){
    if(!weightKg) return null;
    // Concentración típica 100 mg/mL para cálculo de volumen aproximado
    const conc = 100; // mg/mL
    let regimen = {ivBolus: 0, scDoseMg: 0, intervalH: 12, notes: ""};

    if(crcl !== null && crcl < 30){
      regimen.ivBolus = 0; // conservador
      regimen.scDoseMg = 1.0 * weightKg;
      regimen.intervalH = 24;
      regimen.notes = "ClCr <30 mL/min: 1 mg/kg SC cada 24 h (evitar bolo IV).";
    } else {
      if(age >= 75){
        regimen.ivBolus = 0;
        regimen.scDoseMg = 0.75 * weightKg;
        regimen.intervalH = 12;
        // Primeras 2 dosis máx. 75 mg
        regimen.capFirstTwo = 75;
        regimen.notes = "≥75 a: sin bolo IV; 0.75 mg/kg SC cada 12 h. Primeras 2 dosis máx. 75 mg.";
      } else {
        regimen.ivBolus = 30; // mg IV
        regimen.scDoseMg = 1.0 * weightKg;
        regimen.intervalH = 12;
        // Primeras 2 dosis máx. 100 mg
        regimen.capFirstTwo = 100;
        regimen.notes = "<75 a: 30 mg IV → a 15 min 1 mg/kg SC cada 12 h. Primeras 2 dosis máx. 100 mg.";
      }
    }
    // Volúmenes aproximados
    const vol = (mg)=> mg/conc;
    regimen.scVolPerDoseMl = vol(regimen.scDoseMg);
    if(regimen.capFirstTwo){
      regimen.volCapFirstTwoMl = vol(regimen.capFirstTwo);
    }
    return regimen;
  }

  function ufh(weightKg){
    // UFH alternativa con fibrinolisis
    // Bolo 60 U/kg (máx 4000 U) + infusión 12 U/kg/h (máx 1000 U/h)
    const bolus = Math.min(60*weightKg, 4000);
    const rate = Math.min(12*weightKg, 1000);
    return {bolusUnits: Math.round(bolus), rateUnitsPerHour: Math.round(rate)};
  }

  function nextTimesPlan(startISO, delays){
    // startISO: string local ISO "YYYY-MM-DDTHH:MM"
    // delays: array of minutes
    const out = [];
    const base = new Date(startISO);
    for(const m of delays){
      const t = new Date(base.getTime() + m*60000);
      out.push(t);
    }
    return out;
  }

  function timeFmt(d){
    // returns local HH:MM string
    const pad = n=> String(n).padStart(2,'0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function buildPlan(){
    // Gather inputs
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

    // Checks & warnings
    const warnings = qs('#warnings');
    warnings.innerHTML = "";
    function pushWarn(msg, danger=false){
      const div = document.createElement('div');
      div.className = "alert" + (danger ? " danger" : "");
      div.textContent = msg;
      warnings.appendChild(div);
    }

    // Contra absolutas
    const cis = qsa('.absCI:checked').map(el=>el.value);
    if(cis.length>0){
      pushWarn("⚠️ Contraindicaciones absolutas marcadas: " + cis.join(" · ") + ". Evitar fibrinólisis.", true);
    }

    // Embarazo/posparto o SCAD
    if(pregnant || scad){
      pushWarn("⚠️ Embarazo/posparto o sospecha de SCAD: prefiera PCI. Evitar fibrinólisis.", true);
    }

    // HTA severa
    if(Number.isFinite(sbp) && Number.isFinite(dbp) && (sbp>180 || dbp>110)){
      pushWarn("⚠️ TA >180/110 mmHg: controle presión antes de administrar líticos.", true);
    }

    // O2
    if(Number.isFinite(spo2) && spo2<90){
      pushWarn("💡 SatO₂ <90% → administre oxígeno suplementario.", false);
    }

    if(Number.isFinite(pciDelay)){
      if(pciDelay<=120){
        pushWarn("ℹ️ PCI primaria prevista ≤120 min. La estrategia preferida es PCI (no líticos) salvo criterios particulares.");
      } else {
        pushWarn("⏱️ PCI primaria prevista >120 min → Estrategia fibrinolítica razonable si dentro de ventana temporal y sin CI.");
      }
    }

    // Calculations
    const crcl = cockcroftGault(age, weight, sex, scr);
    const tnk = tnkDose(weight, age, halfDose75());
    const clop = clopidogrel(age);
    const asaPlan = asa();

    let anticoag = null, anticoagText = "";
    let schedule = [];

    const startISO = new Date(); // now
    const startISOstr = (new Date(startISO.getTime() - startISO.getTimezoneOffset()*60000)).toISOString().slice(0,16);

    if(preferUFH()){
      const u = ufh(weight);
      anticoag = {type:"UFH", ...u};
      anticoagText = `UFH: bolo ${u.bolusUnits} U IV inmediato → infusión ${u.rateUnitsPerHour} U/h, ajustar por TTPa.`;
      // schedule: start now
      schedule.push({label:"UFH bolo IV", t: timeFmt(new Date()), note:"Iniciar de inmediato"});
      schedule.push({label:"UFH infusión", t: timeFmt(new Date()), note:"Mantener y ajustar por TTPa"});
    } else {
      const e = enoxaparina(age, crcl, weight);
      anticoag = {type:"Enoxaparina", ...e};
      // schedule enox: IV bolus time 0, first SC at +15 min (si aplica)
      if(e.ivBolus>0){
        schedule.push({label:"Enoxaparina bolo IV", t: timeFmt(new Date()), note:`${fmt(e.ivBolus)} mg IV (ahora)`});
        schedule.push({label:"Enoxaparina 1ª SC", t: timeFmt(new Date(Date.now()+15*60000)), note:`${fmt(e.scDoseMg)} mg SC (${fmt(e.scVolPerDoseMl)} mL aprox) a los 15 min`});
      } else {
        schedule.push({label:"Enoxaparina 1ª SC", t: timeFmt(new Date()), note:`${fmt(e.scDoseMg)} mg SC (${fmt(e.scVolPerDoseMl)} mL aprox) ahora`});
      }
      // Subsecuentes SC
      const interval = e.intervalH;
      const dosesToShow = 4;
      for(let i=1;i<dosesToShow;i++){
        const when = new Date(Date.now() + (i*(interval*60))*60000);
        schedule.push({label:`Enoxaparina SC (dosis ${i+1})`, t: timeFmt(when), note:`${fmt(e.scDoseMg)} mg SC cada ${interval} h${e.capFirstTwo? " (cap primeras 2: " + fmt(e.capFirstTwo) + " mg)" : ""}`});
      }
    }

    // TNK schedule
    if(!(pregnant||scad) && cis.length===0){
      schedule.unshift({label:"Tenecteplasa (TNK) bolo IV", t: timeFmt(new Date()), note:`${fmt(tnk)} mg en 5–10 s`});
    }

    // ASA & CLOPI
    schedule.unshift({label:"Aspirina (ASA) carga", t: timeFmt(new Date()), note:`${asaPlan.loadMin}–${asaPlan.loadMax} mg (VO masticable; IV si no VO)`});
    if(clop.load>0){
      schedule.push({label:"Clopidogrel carga", t: timeFmt(new Date()), note:`${clop.load} mg VO (si ≤75 a)`});
    } else {
      schedule.push({label:"Clopidogrel", t: timeFmt(new Date()), note:`${clop.maint} mg VO/día (sin carga si >75 a)`});
    }

    // EKG 60–90 min post-lisis
    schedule.push({label:"EKG de control", t: timeFmt(new Date(Date.now()+75*60000)), note:"Valorar ↓ST ≥50% · si fallo → PCI rescate"});

    // Coronariografía 2–24 h si éxito
    const corot = new Date(Date.now() + 3*60*60000);
    schedule.push({label:"Programar coronariografía/PCI", t: timeFmt(corot), note:"2–24 h tras lisis si éxito"});

    // Build output
    const planDiv = qs('#plan');
    planDiv.innerHTML = "";

    const block1 = document.createElement('div');
    block1.className = "plan-block";
    block1.innerHTML = `
      <h3>Resumen de parámetros</h3>
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
      <div class="plan-row"><div><strong>Dosis bolo IV</strong></div><div>${tnk? fmt(tnk)+' mg' : '—'}</div></div>
      <div class="plan-row"><div>Nota</div><div>${halfDose75() && age>=75 ? '½ dosis aplicada por ≥75 a (según protocolo)' : 'Dosis estándar por banda de peso'}</div></div>
    `;
    if(!(pregnant||scad) && cis.length===0){
      planDiv.appendChild(block2);
    } else {
      const skip = document.createElement('div');
      skip.className = "plan-block";
      skip.innerHTML = `<h3>Tenecteplasa (TNK)</h3><p><em>Omitida por embarazo/posparto, sospecha de SCAD o contraindicación absoluta.</em></p>`;
      planDiv.appendChild(skip);
    }

    const block3 = document.createElement('div');
    block3.className = "plan-block";
    const clcrTxt = crcl? (crcl<30? "ClCr <30" : "ClCr ≥30") : "ClCr no calculable";
    block3.innerHTML = `<h3>Anticoagulación</h3>
      <div class="plan-row"><div><strong>Preferencia</strong></div><div>${preferUFH() ? 'UFH' : 'Enoxaparina'}</div></div>
      <div class="plan-row"><div><strong>Detalle</strong></div><div>${preferUFH()? anticoagText :
        `IV bolo: ${fmt(anticoag.ivBolus)} mg · SC: ${fmt(anticoag.scDoseMg)} mg cada ${anticoag.intervalH} h ${anticoag.capFirstTwo? '(cap 2 primeras dosis: '+fmt(anticoag.capFirstTwo)+' mg)':''} · Volumen aprox/dosis: ${fmt(anticoag.scVolPerDoseMl)} mL · ${clcrTxt}`
      }</div></div>
      <div class="plan-row"><div><strong>Notas</strong></div><div>${preferUFH()? 'Ajustar por TTPa; considerar 48 h o hasta revascularización.' : anticoag.notes}</div></div>
    `;
    planDiv.appendChild(block3);

    const block4 = document.createElement('div');
    block4.className = "plan-block";
    block4.innerHTML = `<h3>Antiagregación</h3>
      <div class="plan-row"><div><strong>ASA</strong></div><div>Carga ${asaPlan.loadMin}–${asaPlan.loadMax} mg → Mantenimiento ${asaPlan.maint} mg/d</div></div>
      <div class="plan-row"><div><strong>Clopidogrel</strong></div><div>${clop.load>0? 'Carga '+clop.load+' mg → ': ''}Mantenimiento ${clop.maint} mg/d</div></div>
    `;
    planDiv.appendChild(block4);

    const block5 = document.createElement('div');
    block5.className = "plan-block";
    block5.innerHTML = `<h3>Cronograma sugerido (a partir de ahora)</h3>`;
    for(const step of schedule){
      const row = document.createElement('div');
      row.className = "plan-row";
      row.innerHTML = `<div><strong>${step.label}</strong> <span class="badge">${step.t}</span></div><div>${step.note||''}</div>`;
      block5.appendChild(row);
    }
    planDiv.appendChild(block5);

    const block6 = document.createElement('div');
    block6.className = "plan-block";
    block6.innerHTML = `<h3>Reperfusión y rescate</h3>
      <div class="plan-row"><div>EKG 60–90 min</div><div>Éxito: ↓ST ≥50% → Coro/PCI 2–24 h</div></div>
      <div class="plan-row"><div>Fallo de lisis</div><div>↓ST <50%, dolor persistente o inestabilidad → PCI de rescate inmediata</div></div>
    `;
    planDiv.appendChild(block6);

    // Export JSON payload
    const payload = {
      generatedAt: new Date().toISOString(),
      patient: {name, age, sex, weightKg: weight, scrMgDl: scr, sbp, dbp, spo2, pregnant, scad, pciDelay, onsetISO},
      risk: {absoluteCI: cis},
      renal: {crcl},
      meds: {
        tnkMg: tnk,
        asa: asaPlan,
        clopidogrel: clop,
        anticoagulation: anticoag
      },
      schedule
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

  // Restore theme after DOM ready
  window.addEventListener('DOMContentLoaded', applyTheme);
})();
