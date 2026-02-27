import { useState, useCallback, useMemo } from "react";

const GLOSSARY = {
  "catecholamine": "우리 몸에서 자연적으로 만들어지는 호르몬(dopamine, epinephrine, norepinephrine). 심장을 더 세게 뛰게 하고, 혈관을 조이거나 넓혀서 혈압과 심박출량을 조절함. NICU에서 가장 많이 쓰는 승압제/강심제 계열",
  "inotrope": "심장 근육의 수축력을 높이는 약물. 심장이 한 번 뛸 때 더 많은 피를 내보내게 해줌(심박출량↑). 심부전이나 수술 후 심기능 저하 시 사용. positive inotrope = 수축력↑, negative inotrope = 수축력↓",
  "vasopressor": "혈관을 수축시켜 혈압을 올리는 약물. 주로 α1 receptor를 자극해서 말초혈관저항(SVR)을 높임. 패혈증 등으로 혈압이 떨어질 때 수액만으로 안 되면 사용",
  "PDE3 inhibitor": "PDE3(phosphodiesterase 3)라는 효소를 차단하는 약물. 이 효소가 차단되면 세포 안에 cAMP가 쌓여서 심근 수축력↑ + 혈관 확장이 동시에 일어남. catecholamine과 완전히 다른 기전이라 병용 가능",
  "inodilator": "inotrope(심근수축력↑) + vasodilator(혈관확장)를 동시에 하는 약물. 심장은 더 세게 짜주면서 혈관은 넓혀줘서 심장의 부담(afterload)을 줄여줌. 대표 약물: milrinone",
  "α-agonist": "α-adrenergic receptor를 자극하는 약물. α1 자극→혈관수축(혈압↑), α2 자극→뇌에서 교감신경 억제(진정 효과). α1은 주로 혈관에, α2는 주로 뇌에 작용",
  "β-agonist": "β-adrenergic receptor를 자극하는 약물. β1(주로 심장)→심박수↑, 수축력↑. β2(주로 폐·혈관)→기관지 확장, 혈관 확장. 용량에 따라 β1/β2 비율이 달라짐",
  "α2-agonist": "뇌의 α2 receptor를 자극해서 교감신경을 억제하는 약물. 호흡을 억제하지 않으면서 진정·진통 효과를 냄. 자연수면과 비슷한 패턴으로 재울 수 있어 NICU에서 유용. 대표 약물: dexmedetomidine(Precedex)",
  "opioid": "뇌와 척수의 opioid receptor(μ, κ, δ)에 작용하는 강력한 진통제. 통증 조절에 가장 효과적이지만 호흡억제·서맥·장운동 저하 등 부작용 주의. NICU에서는 fentanyl을 가장 많이 사용",
  "benzodiazepine": "뇌의 GABA-A receptor에 작용하여 억제성 신경전달을 강화하는 약물. 진정·항불안·항경련·근이완 효과. 호흡억제 있으므로 용량 조절 중요. 대표 약물: midazolam",
  "NMDA antagonist": "NMDA receptor(글루타메이트 수용체의 한 종류)를 차단하는 약물. 의식이 분리되는 '해리성 마취' 상태를 만들어 진통 효과. opioid와 완전히 다른 경로로 통증을 조절해서 opioid 사용량을 줄일 수 있음(opioid-sparing)",
  "neuromuscular blocker": "신경-근육 접합부에서 acetylcholine의 작용을 차단→골격근 마비. 환자가 움직이지 못하게 되므로 반드시 진정제·진통제와 함께 사용해야 함. 의식이 있는 상태에서 마비되면 극심한 고통",
  "prostaglandin": "체내에서 만들어지는 지질 매개체. 다양한 종류가 있으며, PGE1은 동맥관(ductus arteriosus)의 평활근을 이완시켜 PDA를 열어놓는 역할. 선천성 심장병에서 수술 전까지 동맥관을 유지할 때 필수",
  "prostacyclin analogue": "PGI2(prostacyclin)와 유사한 구조의 약물. 폐혈관을 선택적으로 확장시키고 혈소판 응집을 억제. 폐동맥 고혈압(PPHN) 치료에 사용. 대표 약물: treprostinil(Remodulin)",
};

const DRUG_CATEGORIES = [
  {
    id: "cardiac", label: "💓 심혈관",
    drugs: [
      { name: "Dopamine", generic: "dopamine HCl", unit: "mcg/kg/min", defaultDrug: 130, defaultFluid: "5DW", defaultTotal: 20, rangeMin: 2, rangeMax: 20, note: "①저용량(2-5): renal 신혈류↑\n②중용량(5-10): β1-agonist 심박출량↑\n③고용량(10-20): α1-agonist 혈관수축", desc: "내인성 catecholamine. 용량에 따라 작용이 다름", keywords: ["catecholamine", "inotrope", "vasopressor"], compatibleFluid: ["5DW", "NS"], incompatible: ["NaHCO3", "Furosemide", "Insulin", "Aminophylline"] },
      { name: "Dobutamine", generic: "dobutamine HCl", unit: "mcg/kg/min", defaultDrug: 130, defaultFluid: "5DW", defaultTotal: 20, rangeMin: 2, rangeMax: 20, note: "심근수축력 보조(inotropic support)", desc: "합성 catecholamine. β1-agonist→심근수축력·심박출량↑. dopamine 대비 혈관수축 효과 적어 afterload를 크게 올리지 않음", keywords: ["catecholamine", "inotrope", "β-agonist"], compatibleFluid: ["5DW", "NS"], incompatible: ["NaHCO3", "Furosemide", "Aminophylline", "Heparin"] },
      { name: "Epinephrine", generic: "epinephrine", unit: "mcg/kg/min", defaultDrug: 1, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.01, rangeMax: 1, note: "①저용량(0.01-0.05): β-agonist 심박출량↑\n②고용량(>0.1): α-agonist 혈관수축", desc: "내인성 catecholamine. CPR 1차 약물. 용량에 따라 β/α 효과 비율이 달라짐", keywords: ["catecholamine", "inotrope", "vasopressor", "α-agonist", "β-agonist"], compatibleFluid: ["NS", "5DW"], incompatible: ["NaHCO3", "Aminophylline"] },
      { name: "Norepinephrine", generic: "norepinephrine bitartrate", unit: "mcg/kg/min", defaultDrug: 1, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.01, rangeMax: 1, note: "①α1-agonist→말초혈관수축\n②β1-agonist→심수축력↑", desc: "내인성 catecholamine. warm shock에서 1차 vasopressor", keywords: ["catecholamine", "vasopressor", "α-agonist"], compatibleFluid: ["5DW", "NS"], incompatible: ["NaHCO3", "Insulin", "Aminophylline"] },
      { name: "Milrinone", generic: "milrinone lactate", unit: "mcg/kg/min", defaultDrug: 10, defaultFluid: "5DW", defaultTotal: 20, rangeMin: 0.25, rangeMax: 0.75, note: "①수축력↑ + 혈관확장 동시(inodilator)\n②catecholamine과 다른 기전", desc: "PDE3 inhibitor. 심장수술 후, PPHN에 유용", keywords: ["PDE3 inhibitor", "inodilator"], compatibleFluid: ["5DW", "NS"], incompatible: ["Furosemide", "NaHCO3", "Procainamide"] },
      { name: "Vasopressin", generic: "arginine vasopressin", unit: "units/kg/hr", defaultDrug: 10, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.0001, rangeMax: 0.002, note: "catecholamine-refractory shock에서 보조적 사용", desc: "ADH(antidiuretic hormone). V1 receptor→혈관수축", keywords: ["vasopressor"], compatibleFluid: ["NS"], incompatible: ["Furosemide", "Phenytoin"] },
    ],
  },
  {
    id: "pulm", label: "🫁 호흡/폐혈관",
    drugs: [
      { name: "Prostaglandin E1", generic: "alprostadil", unit: "mcg/kg/min", defaultDrug: 0.5, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.01, rangeMax: 0.1, note: "ductal-dependent CHD에서 필수\napnea·hypotension·발열 모니터링", desc: "PGE1. 동맥관 평활근 이완→PDA 유지", keywords: ["prostaglandin"], compatibleFluid: ["NS"], incompatible: ["단독 라인 권장"] },
      { name: "Remodulin", generic: "treprostinil sodium", unit: "ng/kg/min", defaultDrug: 1, defaultFluid: "NS", defaultTotal: 20, rangeMin: 1.25, rangeMax: 40, note: "①폐혈관 선택적 확장\n②platelet aggregation 억제\n③반감기 길어 안정적 주입 가능", desc: "prostacyclin(PGI2) analogue. PPHN 치료", keywords: ["prostacyclin analogue"], compatibleFluid: ["NS"], incompatible: ["단독 라인 권장"] },
    ],
  },
  {
    id: "sedation", label: "😴 진정/진통",
    drugs: [
      { name: "Fentanyl", generic: "fentanyl citrate", unit: "mcg/kg/hr", defaultDrug: 0.5, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.5, rangeMax: 4, note: "①morphine 대비 50-100배 potent\n②hemodynamic stability 우수→NICU 선호\n③chest wall rigidity 주의(rapid bolus 시)", desc: "합성 opioid. rapid onset, 지속 진정", keywords: ["opioid"], compatibleFluid: ["NS", "5DW"], incompatible: ["Phenytoin", "NaHCO3", "Thiopental"] },
      { name: "Midazolam", generic: "midazolam HCl", unit: "mcg/kg/min", defaultDrug: 10, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.5, rangeMax: 6, note: "①GABA-A receptor→sedation·anticonvulsant\n②rapid onset, short half-life\n③신생아에서 반감기 연장→축적 모니터링", desc: "수용성 benzodiazepine 진정", keywords: ["benzodiazepine"], compatibleFluid: ["NS", "5DW"], incompatible: ["NaHCO3", "Furosemide", "Dexamethasone", "Lipid 제제"] },
      { name: "Ketamine", generic: "ketamine HCl", unit: "mcg/kg/min", defaultDrug: 50, defaultFluid: "NS", defaultTotal: 20, rangeMin: 5, rangeMax: 20, note: "①dissociative anesthesia·강력한 analgesia\n②sympathetic stimulation→hemodynamic stability 유리\n③opioid-sparing 효과\n④secretion↑ 주의", desc: "NMDA receptor antagonist. 해리성 진정", keywords: ["NMDA antagonist"], compatibleFluid: ["NS", "5DW"], incompatible: ["Phenobarbital", "Diazepam"] },
      { name: "Precedex", generic: "dexmedetomidine HCl", unit: "mcg/kg/hr", defaultDrug: 0.2, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.2, rangeMax: 0.7, note: "①respiratory depression 없이 sedation·analgesia\n②natural sleep 유사 패턴\n③opioid·BZD sparing 효과\n④bradycardia·hypotension 모니터링", desc: "selective α2-agonist 진정", keywords: ["α2-agonist"], compatibleFluid: ["NS"], incompatible: ["Amphotericin B", "Diazepam"] },
      { name: "Sufentanil", generic: "sufentanil citrate", unit: "mcg/kg/hr", defaultDrug: 0.25, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.05, rangeMax: 0.5, note: "①fentanyl 대비 5-10배 potent\n②높은 μ-receptor affinity\n③cardiac surgery 후 sedation에 사용", desc: "합성 opioid. hemodynamic stability 우수", keywords: ["opioid"], compatibleFluid: ["NS"], incompatible: ["Phenytoin", "NaHCO3", "Thiopental"] },
    ],
  },
  {
    id: "nmb", label: "💪 근이완",
    drugs: [
      { name: "Vecuronium", generic: "vecuronium bromide", unit: "mcg/kg/min", defaultDrug: 10, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.5, rangeMax: 1.7, note: "①nicotinic receptor blockade→skeletal muscle paralysis\n②ventilator dyssynchrony, 수술 중 사용\n③반드시 sedation·analgesia와 함께", desc: "non-depolarizing neuromuscular blocker", keywords: ["neuromuscular blocker"], compatibleFluid: ["NS", "5DW"], incompatible: ["Furosemide", "NaHCO3", "Thiopental"] },
    ],
  },
  {
    id: "metabolic", label: "🧪 대사/기타",
    drugs: [
      { name: "Humalog", generic: "insulin lispro", unit: "units/kg/hr", defaultDrug: 5, defaultFluid: "NS", defaultTotal: 50, rangeMin: 0.01, rangeMax: 0.1, note: "①RI 대비 onset 빠르고 duration 짧음\n②세밀한 혈당 조절\n③hypoglycemia·hypokalemia 모니터링 필수", desc: "rapid-acting insulin analogue", keywords: [], compatibleFluid: ["NS"], incompatible: ["NaHCO3", "Dopamine", "TPN별도라인"] },
      { name: "Lasix", generic: "furosemide", unit: "mg/kg/hr", defaultDrug: 10, defaultFluid: "NS", defaultTotal: 20, rangeMin: 0.1, rangeMax: 0.4, note: "①Henle Na-K-2Cl cotransporter 차단→강력한 diuresis\n②BPD·heart failure·volume overload에서 사용\n③hypokalemia·hyponatremia·metabolic alkalosis 모니터링", desc: "loop diuretics. continuous infusion", keywords: [], compatibleFluid: ["NS", "5DW"], incompatible: ["Dobutamine", "Milrinone", "Midazolam", "Vecuronium", "Vasopressin"] },
      { name: "Heparin", generic: "heparin sodium", unit: "units/kg/hr", defaultDrug: 500, defaultFluid: "NS", defaultTotal: 50, rangeMin: 10, rangeMax: 28, note: "①antithrombin III→thrombin·factor Xa 불활성화\n②thrombosis 치료·예방, ECMO, hemodialysis\n③aPTT 모니터링 필수\n④HIT(heparin-induced thrombocytopenia) 주의", desc: "anticoagulant", keywords: [], compatibleFluid: ["NS"], incompatible: ["Dobutamine", "Morphine", "Alteplase", "Vancomycin", "Amiodarone"] },
    ],
  },
  {
    id: "nutrition", label: "🍼 영양수액",
    drugs: [
      { name: "소아 TPN", generic: "total parenteral nutrition", unit: "ml/hr", defaultDrug: 0, defaultFluid: "", defaultTotal: 0, rangeMin: 0, rangeMax: 0, note: "개별 처방", desc: "total parenteral nutrition(경정맥). AA, glucose, electrolyte, trace element, vitamin 포함. 별도 line 또는 filter 사용 권장. lipid와 Y-site 가능하나 다른 약물과 혼합 주의", keywords: [], incompatible: ["NaHCO3", "Phenytoin", "Amphotericin B", "Acyclovir", "Ceftriaxone(Ca 침전)"] },
      { name: "SMOFlipid", generic: "SMOFlipid 20%", unit: "ml/hr", defaultDrug: 0, defaultFluid: "", defaultTotal: 0, rangeMin: 0, rangeMax: 0, note: "①지방유제\n②개봉 후 12시간 내 폐기\n③TPN과 Y-site 가능", desc: "4종 혼합 lipid emulsion(soybean·MCT·olive·fish oil). essential fatty acid 공급 및 calorie 보충. 다른 약물과 같은 line 사용 시 precipitation·separation 위험", keywords: [], incompatible: ["Midazolam", "Phenytoin", "Amphotericin B", "Cyclosporine", "NaHCO3", "Acyclovir"] },
    ],
  },
  {
    id: "custom", label: "✏️ 단위 직접 입력",
    drugs: [
      { name: "단위 직접 입력", generic: "", unit: "mcg/kg/min", defaultDrug: 0, defaultFluid: "", defaultTotal: 20, rangeMin: 0, rangeMax: 0, note: "", desc: "", keywords: [], incompatible: [] },
    ],
  },
];

const DRUG_PRESETS = DRUG_CATEGORIES.flatMap((cat) =>
  cat.drugs.map((d) => ({ ...d, category: cat.id, categoryLabel: cat.label }))
);

const getTimeFactor = (unit) => (unit.includes("/min") ? 60 : 1);
const getMassFactor = (unit) => {
  if (unit.startsWith("ng")) return 1000000;
  if (unit.startsWith("mcg")) return 1000;
  if (unit.startsWith("units")) return 1;
  if (unit.startsWith("mg")) return 1;
  return 1000;
};

// trailing zero 제거: 5.00→5, 2.50→2.5, 0.0010→0.001
const n = (v) => {
  if (v === 0) return "0";
  const s = Number(v.toPrecision(6));
  return String(s);
};

// 프리셋 비율 생성
const generateRatioPresets = (drug) => {
  if (!drug.rangeMin || !drug.rangeMax) return [];
  const min = drug.rangeMin;
  const max = drug.rangeMax;
  // 치료 범위 중간값 기준으로 대표 비율 5개 생성
  const mid = (min + max) / 2;
  const rates = [0.1, 0.2, 0.5, 1];
  const all = [];
  for (const r of rates) {
    // 해당 rate에서 "깔끔한" dose 값 찾기
    const candidates = [];
    for (let exp = -4; exp <= 2; exp++) {
      const base = Math.pow(10, exp);
      for (const mult of [1, 2, 2.5, 5]) {
        const v = Math.round(base * mult * 100000) / 100000;
        if (v >= min && v <= max) candidates.push({ rate: r, dose: v, dist: Math.abs(v - mid) });
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    if (candidates.length > 0) all.push(candidates[0]);
  }
  // 중복 제거 후 5개로 제한
  const seen = new Set();
  const result = [];
  for (const p of all) {
    const key = `${p.rate}|${p.dose}`;
    if (!seen.has(key)) { seen.add(key); result.push({ rate: p.rate, dose: p.dose }); }
    if (result.length >= 5) break;
  }
  return result;
};

function InfoPanel() {
  const cats = DRUG_CATEGORIES.filter(c => c.id !== "custom");
  const [activeCat, setActiveCat] = useState(cats[0].id);
  const [expandedGlossary, setExpandedGlossary] = useState(null);
  const [expandedDrug, setExpandedDrug] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const currentCat = cats.find(c => c.id === activeCat);
  const allKeywords = [...new Set(currentCat.drugs.flatMap(d => d.keywords || []))];
  return (
    <>
      <div className="flex gap-1 bg-white rounded-xl p-1 mb-4 border border-gray-100 shadow-sm overflow-x-auto">
        {cats.map((cat) => (
          <button key={cat.id} onClick={() => { setActiveCat(cat.id); setExpandedGlossary(null); }}
            className={`flex-shrink-0 py-2 px-3 rounded-lg text-center transition-all ${activeCat === cat.id ? "bg-[#F48C25] text-white shadow-sm" : "text-gray-500 hover:text-gray-600"}`}>
            <span className="text-xs font-semibold whitespace-nowrap">{cat.label}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 mb-5">
        {currentCat.drugs.map((d, i) => {
          const isOpen = expandedDrug === `${activeCat}-${i}`;
          return (
          <button key={i} onClick={() => setExpandedDrug(isOpen ? null : `${activeCat}-${i}`)} className="text-left w-full">
            <div className={`bg-white rounded-2xl p-4 border transition-all ${isOpen ? "border-[#F48C25]/30 shadow-md" : "border-gray-100 shadow-sm"}`}>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-bold text-gray-800">{d.name}</p>
                  {d.rangeMin > 0 && <span className="text-xs font-semibold text-[#F48C25]">{d.rangeMin}–{d.rangeMax} {d.unit}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400 italic">{d.generic}</p>
                  <span className="text-xs text-gray-400">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {d.desc && <p className="text-xs text-gray-500 leading-relaxed mb-2">{d.desc}</p>}
                  {d.note && <div className="text-xs text-amber-600 mb-2">{d.note.split("\n").map((line, j) => <p key={j} className="mb-0.5">📌 {line}</p>)}</div>}
                  {d.compatibleFluid && d.compatibleFluid.length > 0 && <p className="text-xs text-teal-600 mb-2">💧 호환 수액: {d.compatibleFluid.join(", ")}</p>}
                  {d.incompatible && d.incompatible.length > 0 && <p className="text-xs text-red-400">⛔ {d.incompatible.join(" · ")}</p>}
                </div>
              )}
            </div>
          </button>
        ); })}
      </div>
      {allKeywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
          <button onClick={() => setShowGlossary(!showGlossary)} className="w-full p-4 flex items-center justify-between text-left">
            <p className="text-sm font-bold text-gray-700">📚 용어 해설</p>
            <span className="text-xs text-gray-400">{showGlossary ? "▲" : "▼"}</span>
          </button>
          {showGlossary && <div className="flex flex-col gap-1.5 px-4 pb-4">
            {allKeywords.map((kw) => (
              <button key={kw} onClick={() => setExpandedGlossary(expandedGlossary === kw ? null : kw)} className="text-left w-full">
                <div className={`rounded-xl p-3 border transition-all ${expandedGlossary === kw ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-600">* {kw}</span>
                    <span className="text-xs text-gray-500">{expandedGlossary === kw ? "▲" : "▼"}</span>
                  </div>
                  {expandedGlossary === kw && GLOSSARY[kw] && <p className="text-xs text-gray-600 leading-relaxed mt-2">{GLOSSARY[kw]}</p>}
                </div>
              </button>
            ))}
          </div>}
        </div>
      )}
      <p className="text-center text-xs text-gray-500 mt-2">⚠ 참고용 정보입니다. 병원 프로토콜을 우선합니다.</p>
    </>
  );
}

export default function NICUDrugCalculator() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [weight, setWeight] = useState("");
  const [selectedDrug, setSelectedDrug] = useState(0);
  const [drugAmount, setDrugAmount] = useState("");
  const [totalVolume, setTotalVolume] = useState("");
  const [customUnit, setCustomUnit] = useState("mcg/kg/min");
  const [desiredDose, setDesiredDose] = useState("");
  const [givenRate, setGivenRate] = useState("");
  const [activeTab, setActiveTab] = useState("verify");
  const [selectedCategory, setSelectedCategory] = useState("cardiac");
  const [mixVolume, setMixVolume] = useState("");
  const [mainView, setMainView] = useState("calc");
  const [selectedPresetKey, setSelectedPresetKey] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customDose, setCustomDose] = useState("");
  const [showMiniCalc, setShowMiniCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPrev, setCalcPrev] = useState(null);
  const [calcOp, setCalcOp] = useState(null);
  const [calcReset, setCalcReset] = useState(false);

  const calcInput = (v) => {
    if (calcReset) { setCalcDisplay(v === "." ? "0." : v); setCalcReset(false); }
    else if (v === ".") { if (!calcDisplay.includes(".")) setCalcDisplay(calcDisplay + "."); }
    else { setCalcDisplay(calcDisplay === "0" ? v : calcDisplay + v); }
  };
  const calcOperate = (op) => {
    const cur = parseFloat(calcDisplay);
    if (calcPrev !== null && calcOp && !calcReset) {
      let res;
      if (calcOp === "+") res = calcPrev + cur;
      else if (calcOp === "-") res = calcPrev - cur;
      else if (calcOp === "×") res = calcPrev * cur;
      else if (calcOp === "÷") res = cur !== 0 ? calcPrev / cur : 0;
      setCalcDisplay(String(parseFloat(res.toPrecision(10))));
      setCalcPrev(res);
    } else { setCalcPrev(cur); }
    setCalcOp(op); setCalcReset(true);
  };
  const calcEqual = () => {
    if (calcPrev === null || !calcOp) return;
    const cur = parseFloat(calcDisplay);
    let res;
    if (calcOp === "+") res = calcPrev + cur;
    else if (calcOp === "-") res = calcPrev - cur;
    else if (calcOp === "×") res = calcPrev * cur;
    else if (calcOp === "÷") res = cur !== 0 ? calcPrev / cur : 0;
    setCalcDisplay(String(parseFloat(res.toPrecision(10))));
    setCalcPrev(null); setCalcOp(null); setCalcReset(true);
  };
  const calcClear = () => { setCalcDisplay("0"); setCalcPrev(null); setCalcOp(null); setCalcReset(false); };

  const drug = DRUG_PRESETS[selectedDrug];
  const isCustom = drug.category === "custom";
  const unit = isCustom ? customUnit : drug.unit;
  const timeFactor = getTimeFactor(unit);
  const massFactor = getMassFactor(unit);

  const resetInputs = () => { setDrugAmount(""); setTotalVolume(""); setDesiredDose(""); setGivenRate(""); setMixVolume(""); setSelectedPresetKey(""); setCustomRate(""); setCustomDose(""); };

  const handleCategorySelect = (catId) => { setSelectedCategory(catId); const firstIdx = DRUG_PRESETS.findIndex((d) => d.category === catId); if (firstIdx >= 0) handleDrugSelect(firstIdx); };
  const handleDrugSelect = (idx) => { setSelectedDrug(idx); resetInputs(); };

  const concentration = useMemo(() => { const a = parseFloat(drugAmount), v = parseFloat(totalVolume); return a && v ? (a * massFactor) / v : 0; }, [drugAmount, totalVolume, massFactor]);
  const rateToDose = useCallback((r) => { const w = parseFloat(weight); return w && concentration ? (parseFloat(r) * concentration) / (w * timeFactor) : 0; }, [weight, concentration, timeFactor]);
  const doseToRate = useCallback((d) => { const w = parseFloat(weight); return w && concentration ? (parseFloat(d) * w * timeFactor) / concentration : 0; }, [weight, concentration, timeFactor]);
  const isInRange = (dose) => (!drug.rangeMin && !drug.rangeMax) ? null : dose >= drug.rangeMin && dose <= drug.rangeMax;

  // 현재 mix 비율 자동 계산
  const currentRatio = useMemo(() => {
    if (!concentration || !parseFloat(weight)) return null;
    const tryRates = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.001];
    for (const r of tryRates) { const d = rateToDose(r); if (d > 0 && d <= 10) return { rate: r, dose: d }; }
    const d = rateToDose(0.1);
    if (d > 0) return { rate: 0.1, dose: d };
    return null;
  }, [concentration, weight, rateToDose]);

  const ratioPresets = useMemo(() => generateRatioPresets(drug), [drug]);

  // 현재 mix 기준 희석 프리셋 생성
  const dilutionPresets = useMemo(() => {
    if (!currentRatio) return [];
    const { rate, dose } = currentRatio;
    return [
      { rate: rate * 2, dose, factor: "1/2 희석" },
      { rate: rate * 4, dose, factor: "1/4 희석" },
      { rate: rate * 10, dose, factor: "1/10 희석" },
      { rate: rate * 20, dose, factor: "1/20 희석" },
    ];
  }, [currentRatio]);

  // 선택된 프리셋 파싱
  const selectedPreset = useMemo(() => {
    if (selectedPresetKey === "current") return currentRatio;
    if (selectedPresetKey === "custom") {
      const r = parseFloat(customRate), d = parseFloat(customDose);
      return r > 0 && d > 0 ? { rate: r, dose: d } : null;
    }
    if (!selectedPresetKey) return null;
    const [r, d] = selectedPresetKey.split("|").map(Number);
    return { rate: r, dose: d };
  }, [selectedPresetKey, customRate, customDose, currentRatio]);

  // 실제 사용할 희석용량: mixVolume 우선, 비었으면 totalVolume
  const effectiveMixVol = parseFloat(mixVolume) || parseFloat(totalVolume) || 0;

  // 필요 약물량 역산
  const neededDrugForMix = useMemo(() => {
    if (!selectedPreset || !parseFloat(weight) || !effectiveMixVol) return null;
    const { rate, dose } = selectedPreset;
    return (dose * parseFloat(weight) * timeFactor * effectiveMixVol) / (rate * massFactor);
  }, [selectedPreset, weight, effectiveMixVol, timeFactor, massFactor]);

  const rateTable = useMemo(() => {
    if (!concentration || !parseFloat(weight)) return [];
    const min = drug.rangeMin || 0; const max = drug.rangeMax || 20; const range = max - min;
    let step; if (range <= 0.05) step = 0.002; else if (range <= 0.1) step = 0.005; else if (range <= 0.5) step = 0.01; else if (range <= 1) step = 0.05; else if (range <= 5) step = 0.25; else step = 0.5;
    const start = step; const end = Math.ceil(max / step) * step + step * 2; const rows = [];
    for (let d = start; d <= end && rows.length < 80; d += step) { const rounded = Math.round(d * 10000) / 10000; rows.push({ dose: rounded, rate: doseToRate(rounded) }); }
    return rows;
  }, [concentration, weight, doseToRate, drug.rangeMin, drug.rangeMax]);

  const tabs = [
    { key: "verify", label: "처방 검증", icon: "🔍" },
    { key: "table", label: "환산표", icon: "📊" },
    { key: "calc", label: "용량→속도", icon: "🏥" },
    { key: "reverse", label: "속도→용량", icon: "🔄" },
  ];

  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/80 text-gray-800 text-base font-medium focus:outline-none focus:border-[#F48C25] focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all placeholder:text-gray-400";
  const lbl = "block text-xs font-medium text-gray-500 mb-1.5 tracking-wide";
  const unitLabel = unit.startsWith("units") ? "units" : "mg";

  const RangeBadge = ({ dose }) => { if (!drug.rangeMin && !drug.rangeMax) return null; const ok = isInRange(dose); return (<span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{ok ? "✓ 범위 내" : "⚠ 범위 밖"} <span className="text-gray-500 font-normal">({drug.rangeMin}–{drug.rangeMax})</span></span>); };

  const BigResult = ({ label, value, sub, dose, color = "blue" }) => {
    const bg = { blue: "bg-[#FEF3E2] border-[#F48C25]/30", green: "bg-emerald-50 border-emerald-100", amber: "bg-amber-50 border-amber-200" }[color];
    const accent = { blue: "text-[#F48C25]", green: "text-emerald-400", amber: "text-amber-500" }[color];
    return (<div className={`${bg} rounded-2xl p-6 text-center border`}><div className={`text-xs ${accent} font-medium mb-1`}>{label.split("\n").map((l,i) => <p key={i}>{l}</p>)}</div><p className="text-4xl font-extrabold text-gray-800 tracking-tight">{value} <span className="text-lg font-bold text-gray-500">{sub}</span></p>{dose !== undefined && <div className="mt-3"><RangeBadge dose={dose} /></div>}</div>);
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F8F9FA 0%, #ffffff 100%)", fontFamily: "'Inter', 'Pretendard', -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg w-full" style={{ maxWidth: 360 }}>
          <div className="flex justify-center mb-4">
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #F48C25, #E67E17)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 16px rgba(244,140,37,0.3)" }}>🏥</div>
          </div>
          <h1 className="text-xl font-extrabold text-gray-800 text-center mb-1">NICU Calculator</h1>
          <p className="text-sm text-gray-500 text-center mb-6">비밀번호를 입력하세요</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (pin === "1885") setAuthed(true);
                else { setPinError(true); setPin(""); }
              }
            }}
            className={`w-full px-4 py-3 rounded-xl border-2 text-center text-2xl font-bold tracking-widest focus:outline-none transition-all ${pinError ? "border-red-400 bg-red-50 shake" : "border-gray-200 bg-gray-50 focus:border-[#F48C25] focus:bg-white"}`}
            placeholder="••••"
            autoFocus
          />
          {pinError && <p className="text-xs text-red-500 text-center mt-2">비밀번호가 올바르지 않습니다</p>}
          <button
            onClick={() => { if (pin === "1885") setAuthed(true); else { setPinError(true); setPin(""); } }}
            className="w-full mt-4 py-3 rounded-xl bg-[#F48C25] text-white font-semibold text-sm hover:bg-[#E67E17] transition-all"
          >입장</button>
          <p className="text-xs text-gray-500 text-center mt-6">제작 : NURDS</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F8F9FA 0%, #ffffff 100%)", fontFamily: "'Inter', 'Pretendard', -apple-system, sans-serif", padding: "16px 16px 32px", maxWidth: 540, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />

      <div className="mb-4 pt-2">
        <div className="flex items-center gap-3 mb-1">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #F48C25, #E67E17)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(244,140,37,0.3)" }}>🏥</div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-gray-800 leading-tight cursor-pointer" onClick={() => window.location.reload()}>NICU Calculator</h1>
            <p className="text-xs text-gray-500">주입속도 계산 · 처방 검증 · 약물 레퍼런스</p>
          </div>
          <button onClick={() => setShowMiniCalc(!showMiniCalc)}
            className={`px-3 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${showMiniCalc ? "bg-[#F48C25] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>계산기</button>
        </div>
        {showMiniCalc && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg mt-2 relative">
            <button onClick={() => setShowMiniCalc(false)} className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
            <div className="bg-gray-50 rounded-xl px-4 mb-3 text-right flex flex-col justify-end" style={{ height: 80 }}>
              {calcOp && <p className="text-sm text-gray-400">{calcPrev} {calcOp}</p>}
              <p className="text-4xl font-bold text-gray-800 font-mono truncate">{calcDisplay}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["⌫","AC","%","÷","7","8","9","×","4","5","6","-","1","2","3","+","±","0",".","="].map((b,i) => {
                const isOp = ["+","-","×","÷"].includes(b);
                const isEq = b === "=";
                const isClear = b === "AC";
                const isDel = b === "⌫";
                const isPct = b === "%";
                const isSign = b === "±";
                return (
                  <button key={i} onClick={() => {
                    if (isClear) calcClear();
                    else if (isDel) setCalcDisplay(calcDisplay.length > 1 ? calcDisplay.slice(0,-1) : "0");
                    else if (isPct) setCalcDisplay(String(parseFloat(calcDisplay) / 100));
                    else if (isSign) setCalcDisplay(String(parseFloat(calcDisplay) * -1));
                    else if (isEq) calcEqual();
                    else if (isOp) calcOperate(b);
                    else calcInput(b);
                  }}
                  className={`py-4 rounded-full text-base font-bold transition-all ${
                    isEq || isOp ? "bg-[#F48C25] text-white active:bg-[#E67E17]" :
                    isClear || isDel || isPct ? "bg-gray-200 text-gray-700 active:bg-gray-300" :
                    "bg-gray-100 text-gray-800 active:bg-gray-200"
                  }`}>{b}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex bg-white rounded-xl p-1 mb-4 border border-gray-100 shadow-sm">
        <button onClick={() => setMainView("calc")} className={`flex-1 py-2.5 rounded-lg text-center transition-all ${mainView === "calc" ? "bg-[#F48C25] text-white shadow-sm" : "text-gray-500 hover:text-gray-600"}`}><span className="text-sm font-semibold">💊 주입속도 계산</span></button>
        <button onClick={() => setMainView("info")} className={`flex-1 py-2.5 rounded-lg text-center transition-all ${mainView === "info" ? "bg-[#F48C25] text-white shadow-sm" : "text-gray-500 hover:text-gray-600"}`}><span className="text-sm font-semibold">📖 약물 정보</span></button>
      </div>

      {mainView === "calc" && (<>
      <div className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
        <p className="text-sm font-bold text-gray-700 mb-3">기본 정보</p>
        <div className="mb-3">
          <p className={lbl}>카테고리</p>
          <div className="flex flex-wrap gap-1.5">
            {DRUG_CATEGORIES.filter(cat => cat.id !== "nutrition").map((cat) => (
              <button key={cat.id} onClick={() => handleCategorySelect(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat.id ? "bg-[#F48C25] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{cat.label}</button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <p className={lbl}>약물</p>
          <div className="flex flex-wrap gap-1.5">
            {DRUG_PRESETS.filter(d => d.category === selectedCategory).map((d) => { const idx = DRUG_PRESETS.indexOf(d); return (<button key={idx} onClick={() => handleDrugSelect(idx)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedDrug === idx ? "bg-[#F48C25] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>{d.name}</button>); })}
          </div>
          {drug.rangeMin > 0 && (
            <div className="mt-2 bg-amber-50/80 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-[#F48C25]">{drug.rangeMin}–{drug.rangeMax} {unit}</p>
            </div>
          )}
        </div>
        {isCustom && (<div className="mb-3"><p className={lbl}>단위</p><select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className={inp}><option value="mcg/kg/min">mcg/kg/min</option><option value="mcg/kg/hr">mcg/kg/hr</option><option value="ng/kg/min">ng/kg/min</option><option value="units/kg/hr">units/kg/hr</option></select></div>)}
        <div className="grid grid-cols-3 gap-2.5">
          <div><p className={lbl}>체중 (kg)</p><input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} className={inp} /></div>
          <div><p className={lbl}>약물량 ({unitLabel})</p><input type="number" step="0.01" value={drugAmount} onChange={(e) => setDrugAmount(e.target.value)} className={inp} /></div>
          <div><p className={lbl}>총 용량 (cc)</p><input type="number" step="0.1" value={totalVolume} onChange={(e) => setTotalVolume(e.target.value)} className={inp} /></div>
        </div>
      </div>

      <div className="flex bg-white rounded-xl p-1 mb-4 border border-gray-100 shadow-sm">
        {tabs.map((t) => (<button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 py-2.5 rounded-lg text-center transition-all ${activeTab === t.key ? "bg-[#F48C25] text-white shadow-sm" : "text-gray-500 hover:text-gray-600"}`}><span className="text-xs font-semibold">{t.icon} {t.label}</span></button>))}
      </div>

      {!isCustom && drug.name && (
        <p className="text-xs font-bold text-[#F48C25] mb-2">{drug.name}{drug.rangeMin > 0 ? ` (${drug.rangeMin}–${drug.rangeMax} ${unit})` : ""}</p>
      )}

      {/* ===== 처방 검증 ===== */}
      {activeTab === "verify" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-0.5">처방 검증</p>
          <p className="text-xs text-gray-500 mb-4">기본 정보를 입력하면 현재 mix 비율을 자동 계산합니다</p>

          {/* 현재 mix 비율 */}
          {currentRatio ? (
            <div className="bg-[#FEF3E2] rounded-2xl p-4 border border-[#F48C25]/30 mb-4">
              <p className="text-xs text-[#F48C25] font-semibold mb-2">📋 현재 mix 비율</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-extrabold text-gray-800">{n(currentRatio.rate)}</span>
                <span className="text-sm text-gray-500">cc/hr</span>
                <span className="text-xl font-bold text-[#F48C25]/50">=</span>
                <span className="text-2xl font-extrabold text-[#F48C25]">{n(currentRatio.dose)}</span>
                <span className="text-sm text-gray-500">{unit}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{drugAmount} {unitLabel} + {totalVolume} cc · {weight} kg</p>
              <RangeBadge dose={currentRatio.dose} />
            </div>
          ) : (
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mb-4 text-center">
              <p className="text-xs text-gray-500">체중 · 약물량 · 총용량을 입력하면 현재 비율이 표시됩니다</p>
            </div>
          )}

          {/* 원하는 비율 선택 */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-700 mb-1">🎯 원하는 비율 선택</p>
            <p className="text-xs text-gray-500 mb-2.5">의도한 처방 비율을 선택하면 해당 비율에 맞는 약물량을 확인할 수 있습니다</p>
            <select
              value={selectedPresetKey}
              onChange={(e) => { setSelectedPresetKey(e.target.value); setMixVolume(""); }}
              className={inp + " !text-sm"}
            >
              <option value="">비율을 선택하세요</option>
              {ratioPresets.map((p, i) => {
                let tag = "";
                if (currentRatio) {
                  const f = (p.dose / p.rate) / (currentRatio.dose / currentRatio.rate);
                  if (Math.abs(f - 1) > 0.01) tag = f > 1 ? ` (${f % 1 === 0 ? f : f.toFixed(1)}배 농축)` : ` (${1/f % 1 === 0 ? 1/f : (1/f).toFixed(1)}배 희석)`;
                }
                return <option key={i} value={`${p.rate}|${p.dose}`}>{n(p.rate)} = {n(p.dose)}{tag}</option>;
              })}
              {currentRatio && <option value="current">{n(currentRatio.rate)} = {n(currentRatio.dose)} (현재 mix)</option>}
              {dilutionPresets.map((p, i) => (
                <option key={`dil${i}`} value={`${p.rate}|${p.dose}`}>{n(p.rate)} = {n(p.dose)} ({p.factor})</option>
              ))}
              <option value="custom">직접 입력</option>
            </select>
            {selectedPresetKey === "custom" && (
              <div className="flex gap-2 mt-2 items-center">
                <input type="number" step="0.01" value={customRate} onChange={(e) => setCustomRate(e.target.value)} className={inp} placeholder="속도 (cc/hr)" />
                <span className="text-sm font-bold text-gray-500">=</span>
                <input type="number" step="0.01" value={customDose} onChange={(e) => setCustomDose(e.target.value)} className={inp} placeholder={`용량 (${unit})`} />
              </div>
            )}
          </div>

          {/* 선택한 비율로 믹싱 계산 */}
          {selectedPreset && (
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200">
              <p className="text-xs font-bold text-amber-700 mb-1">
                💡 {n(selectedPreset.rate)} cc/hr = {n(selectedPreset.dose)} {unit} 맞추려면?
              </p>
              <p className="text-xs text-gray-500 mb-3">희석 총용량을 변경할 수 있습니다 (기본 {totalVolume || "20"} cc){!mixVolume && totalVolume ? " · 기본 정보 적용중" : ""}</p>
              <div className="flex items-end gap-2.5">
                <div className="flex-1">
                  <p className={lbl}>희석 총용량 (cc)</p>
                  <input type="number" step="0.1" value={mixVolume} onChange={(e) => setMixVolume(e.target.value)} className={inp} placeholder={totalVolume || "20"} />
                </div>
                <div className="text-lg text-gray-500 pb-2.5">→</div>
                <div className="flex-1">
                  <p className={lbl}>필요 약물량</p>
                  <div className="px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-lg font-bold text-amber-700">
                    {neededDrugForMix !== null ? n(neededDrugForMix) : "-"}
                    <span className="text-xs text-gray-500 font-normal ml-1">{unitLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "calc" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-4">용량 → 주입속도</p>
          <div className="mb-4"><p className={lbl}>원하는 용량</p><div className="flex items-center gap-2"><input type="number" step="0.01" value={desiredDose} onChange={(e) => setDesiredDose(e.target.value)} className={inp + " flex-1"} /><span className="text-xs text-gray-500 font-medium whitespace-nowrap">{unit}</span></div></div>
          {parseFloat(desiredDose) > 0 && (concentration > 0 || selectedPreset) && (
            <div className="flex flex-col gap-3">
              {concentration > 0 && currentRatio && <BigResult label={`현재 mix 기준\n${n(currentRatio.rate)} = ${n(currentRatio.dose)}`} value={doseToRate(desiredDose).toFixed(2)} sub="cc/hr" dose={parseFloat(desiredDose)} color="blue" />}
              {selectedPreset && (() => { const presetRate = parseFloat(desiredDose) * selectedPreset.rate / selectedPreset.dose; return (
                <BigResult label={`선택 비율 기준\n${n(selectedPreset.rate)} = ${n(selectedPreset.dose)}`} value={presetRate.toFixed(2)} sub="cc/hr" dose={parseFloat(desiredDose)} color="amber" />
              ); })()}
            </div>
          )}
        </div>
      )}

      {activeTab === "reverse" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-4">주입속도 → 용량</p>
          <div className="mb-4"><p className={lbl}>현재 주입속도</p><div className="flex items-center gap-2"><input type="number" step="0.01" value={givenRate} onChange={(e) => setGivenRate(e.target.value)} className={inp + " flex-1"} /><span className="text-xs text-gray-500 font-medium whitespace-nowrap">cc/hr</span></div></div>
          {parseFloat(givenRate) > 0 && (concentration > 0 || selectedPreset) && (
            <div className="flex flex-col gap-3">
              {concentration > 0 && currentRatio && <BigResult label={`현재 mix 기준\n${n(currentRatio.rate)} = ${n(currentRatio.dose)}`} value={rateToDose(givenRate).toFixed(2)} sub={unit} dose={rateToDose(givenRate)} color="green" />}
              {selectedPreset && (() => { const presetDose = parseFloat(givenRate) * selectedPreset.dose / selectedPreset.rate; return (
                <BigResult label={`선택 비율 기준\n${n(selectedPreset.rate)} = ${n(selectedPreset.dose)}`} value={n(presetDose)} sub={unit} dose={presetDose} color="amber" />
              ); })()}
            </div>
          )}
        </div>
      )}

      {activeTab === "table" && (
        <div className="flex flex-col gap-4">
          {/* 현재 mix 기준 환산표 */}
          {concentration > 0 && parseFloat(weight) > 0 && (
            <div className="bg-[#FEF3E2] rounded-2xl p-4 border border-[#F48C25]/30 shadow-sm">
              <p className="text-sm font-bold text-[#E67E17] mb-0.5">현재 mix 환산표</p>
              {currentRatio && <p className="text-xs text-gray-500 mb-0.5">{n(currentRatio.rate)} cc/hr = {n(currentRatio.dose)} {unit}</p>}
              <p className="text-xs text-gray-400 mb-2">{drug.name} {drugAmount}{unit.startsWith("units") ? " units" : " mg"} + {totalVolume} cc · {weight} kg</p>
              <div className="overflow-auto max-h-40 rounded-lg border border-[#F48C25]/20">
                <table className="w-full text-xs">
                  <thead><tr style={{background:"#fde8c8"}} className="sticky top-0 z-10"><th className="text-left px-3 py-1.5 font-medium text-[#E67E17]">cc/hr</th><th className="text-right px-3 py-1.5 font-medium text-[#E67E17]">{unit}</th><th className="text-center px-2 py-1.5 font-medium text-[#E67E17]">범위</th></tr></thead>
                  <tbody>
                    {rateTable.map((row, i) => { const ok = isInRange(row.dose); return (
                      <tr key={i} className={`border-t border-[#F48C25]/10 ${ok === true ? "bg-emerald-50/40" : ""}`}>
                        <td className="px-3 py-1.5 font-mono font-semibold text-[#F48C25]">{row.rate.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-gray-700">{row.dose}</td>
                        <td className="px-2 py-1.5 text-center">{ok === true ? <span className="text-emerald-400">●</span> : ok === false ? <span className="text-gray-200">○</span> : ""}</td>
                      </tr>); })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 선택 비율 기준 환산표 */}
          {selectedPreset && (
            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200 shadow-sm">
              <p className="text-sm font-bold text-amber-700 mb-0.5">선택 비율 환산표{currentRatio && selectedPresetKey !== "current" && (() => {
                const ratio = (currentRatio.rate / currentRatio.dose) / (selectedPreset.rate / selectedPreset.dose);
                if (Math.abs(ratio - 1) < 0.001) return "";
                return ratio > 1 ? ` (${ratio % 1 === 0 ? ratio : ratio.toFixed(1)}배 농축)` : ` (1/${Math.round(1/ratio)}배 농축 · ${Math.round(1/ratio)}배 희석)`;
              })()}</p>
              <p className="text-xs text-gray-500 mb-2">{n(selectedPreset.rate)} cc/hr = {n(selectedPreset.dose)} {unit}</p>
              <div className="overflow-auto max-h-40 rounded-lg border border-amber-100">
                <table className="w-full text-xs">
                  <thead><tr style={{background:"#fef3c7"}} className="sticky top-0 z-10"><th className="text-left px-3 py-1.5 font-medium text-amber-600">cc/hr</th><th className="text-right px-3 py-1.5 font-medium text-amber-600">{unit}</th><th className="text-center px-2 py-1.5 font-medium text-amber-600">범위</th></tr></thead>
                  <tbody>
                    {rateTable.map((row, i) => { const ok = isInRange(row.dose); const presetRate = row.dose * selectedPreset.rate / selectedPreset.dose; return (
                      <tr key={i} className={`border-t border-amber-50 ${ok === true ? "bg-emerald-50/40" : ""}`}>
                        <td className="px-3 py-1.5 font-mono font-semibold text-amber-700">{presetRate.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-gray-700">{row.dose}</td>
                        <td className="px-2 py-1.5 text-center">{ok === true ? <span className="text-emerald-400">●</span> : ok === false ? <span className="text-gray-200">○</span> : ""}</td>
                      </tr>); })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!concentration && !selectedPreset && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-500">기본 정보를 입력하거나 비율을 선택하면 환산표가 표시됩니다</p>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-500 mt-4">⚠ 참고용 계산기입니다. 최종 투여 전 반드시 이중 확인하세요.</p>
      </>)}

      {mainView === "info" && <InfoPanel />}
      <p className="text-center text-xs text-gray-400 mt-8 pb-2">제작 : NURDS</p>
    </div>
  );
}
