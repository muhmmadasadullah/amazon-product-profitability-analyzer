import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import './App.css'

const defaultInputs = {
  sellingPrice: 29.99, landedCost: 8.50, fbaFees: 5.80, referralFee: 4.50,
  storageFees: 0.40, otherCosts: 0.00, cpc: 1.20, cvr: 12, targetAcos: 30,
  targetTacos: 12, monthlyAdSpend: 1500, monthlyTotalRevenue: 15000, monthlyAdRevenue: 6000,
}

function calculate(inputs) {
  const { sellingPrice, landedCost, fbaFees, referralFee, storageFees, otherCosts,
    cpc, cvr, targetAcos, targetTacos, monthlyAdSpend, monthlyTotalRevenue, monthlyAdRevenue } = inputs
  const cvrD = cvr / 100
  const totalCost = landedCost + fbaFees + referralFee + storageFees + otherCosts
  const margin = sellingPrice - totalCost
  const marginPct = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0
  const cpa = cvrD > 0 ? cpc / cvrD : 0
  const acos = sellingPrice > 0 ? (cpa / sellingPrice) * 100 : 0
  const tacos = monthlyTotalRevenue > 0 ? (monthlyAdSpend / monthlyTotalRevenue) * 100 : 0
  const adDep = monthlyTotalRevenue > 0 ? (monthlyAdRevenue / monthlyTotalRevenue) * 100 : 0
  const orgRatio = 100 - adDep
  const profitPerUnit = margin - cpa
  const beAcos = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0
  const maxCpc = (targetAcos / 100) * sellingPrice * cvrD
  const moUnits = sellingPrice > 0 ? monthlyTotalRevenue / sellingPrice : 0
  const moProfit = moUnits * profitPerUnit
  const roi = monthlyAdSpend > 0 ? ((moProfit / monthlyAdSpend) * 100) : 0
  let decision, dColor, reasoning
  const ok = profitPerUnit > 0, aOk = acos <= targetAcos, tOk = tacos <= targetTacos, hAd = adDep > 60
  if (!ok || (acos > beAcos && tacos > targetTacos * 1.5)) { decision='KILL'; dColor='#ef4444'; reasoning='Unit economics broken. Every sale loses money after ad costs.' }
  else if (!aOk && !tOk) { decision='REPRICE'; dColor='#f97316'; reasoning='Both ACoS and TACoS exceed targets. Adjust pricing or reduce costs.' }
  else if (ok && !aOk && tOk) { decision='TEST'; dColor='#eab308'; reasoning='TACoS healthy but ACoS high. Test new ad creatives or bid strategies.' }
  else if (ok && aOk && hAd) { decision='OPTIMIZE'; dColor='#3b82f6'; reasoning='Profitable but over-reliant on ads. Build organic ranking.' }
  else { decision='SCALE'; dColor='#22c55e'; reasoning='Strong fundamentals. Increase ad spend to capture more market share.' }
  return { totalCost, margin, marginPct, cpa, acos, tacos, adDependency:adDep, organicRatio:orgRatio, profitPerUnit, breakEvenAcos:beAcos, maxCpc, monthlyUnits:moUnits, monthlyProfit:moProfit, roi, decision, decisionColor:dColor, reasoning }
}
function InputField({ label, name, value, onChange, prefix = '$', suffix, tooltip }) {
  return (<div className="input-field"><label>{label}{tooltip && <span className="tooltip" title={tooltip}>i</span>}</label><div className="input-wrapper">{prefix && <span className="prefix">{prefix}</span>}<input type="number" step="0.01" value={value} onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)} />{suffix && <span className="suffix">{suffix}</span>}</div></div>)
}

function MetricCard({ label, value, subtext, color }) {
  return (<div className="metric-card" style={color ? { borderColor: color } : {}}><div className="metric-label">{label}</div><div className="metric-value" style={color ? { color } : {}}>{value}</div>{subtext && <div className="metric-subtext">{subtext}</div>}</div>)
}

function exportToExcel(inputs, r) {
  const wb = XLSX.utils.book_new()
  const iD = [['Amazon PPC Decision Tool - Inputs'],[],['Product Economics',''],['Selling Price',inputs.sellingPrice],['Landed Cost',inputs.landedCost],['FBA Fees',inputs.fbaFees],['Referral Fee',inputs.referralFee],['Storage Fees',inputs.storageFees],['Other Costs',inputs.otherCosts],[],['PPC Metrics',''],['CPC',inputs.cpc],['CVR %',inputs.cvr],['Target ACoS %',inputs.targetAcos],['Target TACoS %',inputs.targetTacos],[],['Monthly Data',''],['Ad Spend',inputs.monthlyAdSpend],['Total Revenue',inputs.monthlyTotalRevenue],['Ad Revenue',inputs.monthlyAdRevenue]]
  const ws1 = XLSX.utils.aoa_to_sheet(iD); ws1['!cols']=[{wch:25},{wch:15}]; XLSX.utils.book_append_sheet(wb, ws1, 'Inputs')
  const aD = [['Analysis'],[],['Total Cost','$'+r.totalCost.toFixed(2)],['Margin','$'+r.margin.toFixed(2)],['CPA','$'+r.cpa.toFixed(2)],['Profit/Unit','$'+r.profitPerUnit.toFixed(2)],[],['ACoS',r.acos.toFixed(1)+'%'],['BE ACoS',r.breakEvenAcos.toFixed(1)+'%'],['TACoS',r.tacos.toFixed(1)+'%'],['Ad Dep',r.adDependency.toFixed(1)+'%'],[],['Max CPC','$'+r.maxCpc.toFixed(2)],['Mo Profit','$'+r.monthlyProfit.toFixed(2)],['ROI',r.roi.toFixed(1)+'%'],[],['DECISION',r.decision],['Reason',r.reasoning]]
  const ws2 = XLSX.utils.aoa_to_sheet(aD); ws2['!cols']=[{wch:20},{wch:35}]; XLSX.utils.book_append_sheet(wb, ws2, 'Analysis')
  const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' })
  saveAs(new Blob([wbout], {type:'application/octet-stream'}), 'amazon-ppc-analysis.xlsx')
}

function exportToCSV(inputs, r) {
  const rows = [['Metric','Value'],['Price',inputs.sellingPrice],['Cost',r.totalCost.toFixed(2)],['CPA',r.cpa.toFixed(2)],['Profit',r.profitPerUnit.toFixed(2)],['ACoS',r.acos.toFixed(1)+'%'],['TACoS',r.tacos.toFixed(1)+'%'],['Decision',r.decision]]
  saveAs(new Blob([rows.map(x=>x.join(',')).join('\n')],{type:'text/csv'}),'amazon-ppc.csv')
}
export default function App() {
  const [inputs, setInputs] = useState(defaultInputs)
  const handleChange = (n, v) => setInputs(p => ({ ...p, [n]: v }))
  const r = useMemo(() => calculate(inputs), [inputs])
  return (
    <div className="app">
      <header><div className="header-content"><h1>Amazon PPC Decision Tool</h1><p className="subtitle">Dual ACoS + TACoS Profitability Analyzer</p></div><div className="header-actions"><button className="btn btn-secondary" onClick={() => exportToCSV(inputs, r)}>Export CSV</button><button className="btn btn-primary" onClick={() => exportToExcel(inputs, r)}>Download Excel</button></div></header>
      <div className="decision-banner" style={{ borderColor: r.decisionColor }}><div className="decision-badge" style={{ backgroundColor: r.decisionColor }}>{r.decision}</div><p className="decision-reasoning">{r.reasoning}</p></div>
      <div className="layout">
        <aside className="input-panel">
          <h2>Product Economics</h2>
          <InputField label="Selling Price" name="sellingPrice" value={inputs.sellingPrice} onChange={handleChange} tooltip="Amazon listing price" />
          <InputField label="Landed Cost" name="landedCost" value={inputs.landedCost} onChange={handleChange} tooltip="COGS + shipping" />
          <InputField label="FBA Fees" name="fbaFees" value={inputs.fbaFees} onChange={handleChange} tooltip="FBA fulfillment fees" />
          <InputField label="Referral Fee" name="referralFee" value={inputs.referralFee} onChange={handleChange} tooltip="Amazon commission" />
          <InputField label="Storage Fees" name="storageFees" value={inputs.storageFees} onChange={handleChange} tooltip="Monthly storage/unit" />
          <InputField label="Other Costs" name="otherCosts" value={inputs.otherCosts} onChange={handleChange} tooltip="Returns, prep, etc." />
          <h2>PPC Metrics</h2>
          <InputField label="CPC" name="cpc" value={inputs.cpc} onChange={handleChange} tooltip="Cost Per Click" />
          <InputField label="CVR" name="cvr" value={inputs.cvr} onChange={handleChange} prefix="" suffix="%" tooltip="Conversion Rate" />
          <InputField label="Target ACoS" name="targetAcos" value={inputs.targetAcos} onChange={handleChange} prefix="" suffix="%" tooltip="ACoS goal" />
          <InputField label="Target TACoS" name="targetTacos" value={inputs.targetTacos} onChange={handleChange} prefix="" suffix="%" tooltip="TACoS goal" />
          <h2>Monthly Data</h2>
          <InputField label="Ad Spend" name="monthlyAdSpend" value={inputs.monthlyAdSpend} onChange={handleChange} />
          <InputField label="Total Revenue" name="monthlyTotalRevenue" value={inputs.monthlyTotalRevenue} onChange={handleChange} />
Tokia        </aside>
        <main className="results-panel">
          <section><h2>Unit Economics</h2><div className="metrics-grid">
            <MetricCard label="Total Cost" value={'$'+r.totalCost.toFixed(2)} />
            <MetricCard label="Margin (pre-ad)" value={'$'+r.margin.toFixed(2)} subtext={r.marginPct.toFixed(1)+'%'} />
            <MetricCard label="CPA" value={'$'+r.cpa.toFixed(2)} />
            <MetricCard label="Profit / Unit" value={'$'+r.profitPerUnit.toFixed(2)} color={r.profitPerUnit>=0?'#22c55e':'#ef4444'} />
          </div></section>
          <section><h2>Dual Signal Analysis</h2><div className="metrics-grid">
            <MetricCard label="ACoS" value={r.acos.toFixed(1)+'%'} subtext={'Target: '+inputs.targetAcos+'%'} color={r.acos<=inputs.targetAcos?'#22c55e':'#ef4444'} />
            <MetricCard label="Break-even ACoS" value={r.breakEvenAcos.toFixed(1)+'%'} subtext="Max before loss" />
            <MetricCard label="TACoS" value={r.tacos.toFixed(1)+'%'} subtext={'Target: '+inputs.targetTacos+'%'} color={r.tacos<=inputs.targetTacos?'#22c55e':'#ef4444'} />
            <MetricCard label="Ad Dependency" value={r.adDependency.toFixed(1)+'%'} subtext={r.organicRatio.toFixed(1)+'% organic'} color={r.adDependency<=60?'#22c55e':'#f97316'} />
          </div></section>
          <section><h2>Guardrails & Projections</h2><div className="metrics-grid">
            <MetricCard label="Max CPC" value={'$'+r.maxCpc.toFixed(2)} subtext={'At '+inputs.targetAcos+'% ACoS'} />
            <MetricCard label="Monthly Units" value={r.monthlyUnits.toFixed(0)} />
            <MetricCard label="Monthly Profit" value={'$'+r.monthlyProfit.toFixed(2)} color={r.monthlyProfit>=0?'#22c55e':'#ef4444'} />
            <MetricCard label="Ad Spend ROI" value={r.roi.toFixed(1)+'%'} color={r.roi>=0?'#22c55e':'#ef4444'} />
          </div></section>
        </main>
      </div>
      <footer><p>Amazon PPC Decision Tool | Dual ACoS + TACoS Analysis | 
