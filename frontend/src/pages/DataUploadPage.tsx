import { useState, useRef } from 'react';
import { PageHeader, Disclaimer } from '../components/ui';
import { Upload, FileText, Download, CheckCircle, XCircle, Check, Database, RefreshCw, Layers, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store/useStore';

const REQUIRED_COLS = [
  'name', 'latitude', 'longitude', 'population', 'district', 'state',
  'hazard_type', 'hazard_severity', 'housing_quality', 'road_accessibility',
  'shelter_capacity_persons', 'healthcare_beds', 'water_capacity_liters_per_day',
  'children_count', 'elderly_count', 'disabled_count', 'food_stock_days',
  'sanitation_coverage_pct', 'safe_land_area_sqkm', 'historical_event_count',
];

const TEMPLATE_ROWS = [
  'Rampur,27.574,81.618,4820,Bahraich,Uttar Pradesh,flood,0.9,2,2,200,10,50000,1200,600,150,3,45,0.5,5',
  'Devipuram,30.416,79.314,920,Chamoli,Uttarakhand,landslide,0.9,2,1,50,2,10000,200,100,20,5,50,0.1,3',
].join('\n');

function downloadTemplate() {
  const content = [REQUIRED_COLS.join(','), TEMPLATE_ROWS].join('\n');
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'purva_drishti_habitation_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCurrentDataset() {
  const a = document.createElement('a');
  a.href = '/purva_drishti_current_50_habitations.csv';
  a.download = 'purva_drishti_current_50_habitations.csv';
  a.click();
}

function exportSession(habitations: any[], isReplaceMode: boolean, relocationPlans: any, weightConfig: any) {
  const sessionData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    platform: 'Purva Drishti',
    isReplaceMode,
    habitations,
    relocationPlans,
    weightConfig,
  };
  const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `purva_drishti_session_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}


export default function DataUploadPage() {
  const addUploadedHabitations = useStore(s => s.addUploadedHabitations);
  const replaceAllHabitations = useStore(s => s.replaceAllHabitations);
  const clearUploadedHabitations = useStore(s => s.clearUploadedHabitations);
  const customHabs = useStore(s => s.habitations);
  const isReplaceMode = useStore(s => s.isReplaceMode);
  const relocationPlans = useStore(s => s.relocationPlans);
  const weightConfig = useStore(s => s.weightConfig);
  const applyWeights = useStore(s => s.applyWeights);

  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ rows: string[][]; headers: string[]; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionInputRef = useRef<HTMLInputElement>(null);

  const handleImportSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.platform !== 'Purva Drishti') {
          setSessionMsg('❌ Invalid session file — not a Purva Drishti export.');
          return;
        }
        // Restore habitations
        if (Array.isArray(data.habitations) && data.habitations.length > 0) {
          if (data.isReplaceMode) {
            replaceAllHabitations(data.habitations);
          } else {
            replaceAllHabitations(data.habitations); // always replace on import so no duplicates
          }
        }
        // Restore relocation plans
        if (data.relocationPlans) {
          try {
            localStorage.setItem('purva_drishti_relocation_plans', JSON.stringify(data.relocationPlans));
            // Force store reload
            window.location.reload();
          } catch (e) {}
        }
        // Restore weights
        if (data.weightConfig) {
          applyWeights(data.weightConfig);
        }
        setSessionMsg(`✅ Session imported: ${data.habitations?.length || 0} habitations, ${Object.keys(data.relocationPlans || {}).length} relocation plans, exported on ${data.exportedAt?.slice(0, 10) || '?'}.`);
      } catch {
        setSessionMsg('❌ Failed to parse session file. Make sure it is a valid Purva Drishti JSON export.');
      }
      setTimeout(() => setSessionMsg(null), 8000);
    };
    reader.readAsText(f);
    e.target.value = '';
  };


  const parseAndScoreHabitations = (lines: string[], headers: string[]) => {
    const newItems = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(p => p.trim());
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] || '';
      });

      const pop = parseInt(row.population) || 1000;
      const hazardSev = parseFloat(row.hazard_severity) || 0.5;
      const waterCap = parseFloat(row.water_capacity_liters_per_day) || pop * 30;
      const shelterCap = parseFloat(row.shelter_capacity_persons) || Math.round(pop * 0.15);
      const beds = parseFloat(row.healthcare_beds) || Math.max(1, Math.round(pop / 500));

      // Calculate Real Risk Score (0-100)
      const hazardScore = hazardSev * 100;
      const vulScore = Math.min(100, (((parseInt(row.children_count) || 0) + (parseInt(row.elderly_count) || 0) + (parseInt(row.disabled_count) || 0)) / pop) * 100);
      const calculatedRisk = Math.round(hazardScore * 0.45 + vulScore * 0.35 + (5 - (parseInt(row.housing_quality) || 3)) * 4);
      const finalRisk = Math.min(100, Math.max(10, calculatedRisk));

      const riskClass = finalRisk >= 75 ? 'CRITICAL' : finalRisk >= 50 ? 'HIGH' : finalRisk >= 25 ? 'MODERATE' : 'LOW';

      // Calculate Capacity Utilization
      const waterUtil = Math.round(((pop * 50) / Math.max(1, waterCap)) * 100);
      const shelterUtil = Math.round(((pop * 0.25) / Math.max(1, shelterCap)) * 100);
      const avgUtil = Math.round((waterUtil + shelterUtil) / 2);
      const capStatus = avgUtil > 120 ? 'CRITICAL' : avgUtil > 100 ? 'OVERLOADED' : avgUtil > 70 ? 'STRESSED' : 'SAFE';

      // Calculate Relocation Priority
      const priority = finalRisk >= 75 || avgUtil > 120
        ? 'P1-IMMEDIATE'
        : finalRisk >= 50 || avgUtil > 100
        ? 'P2-URGENT'
        : finalRisk >= 25
        ? 'P3-PLANNED'
        : 'P4-MONITOR';

      newItems.push({
        id: `UPL-${Date.now()}-${i}`,
        name: row.name || `Habitation ${i}`,
        latitude: parseFloat(row.latitude) || 20.0,
        longitude: parseFloat(row.longitude) || 78.0,
        population: pop,
        district: row.district || 'Custom District',
        state: row.state || 'Custom State',
        hazard_type: (row.hazard_type || 'flood').toLowerCase(),
        primary_hazard: (row.hazard_type || 'flood').toLowerCase(),
        hazard_severity: hazardSev,
        elevation: parseFloat(row.elevation) || 100,
        children_count: parseInt(row.children_count) || Math.round(pop * 0.2),
        elderly_count: parseInt(row.elderly_count) || Math.round(pop * 0.1),
        disabled_count: parseInt(row.disabled_count) || Math.round(pop * 0.02),
        pregnant_women_count: 0,
        below_poverty_count: Math.round(pop * 0.35),
        housing_quality: parseInt(row.housing_quality) || 3,
        road_accessibility: parseInt(row.road_accessibility) || 3,
        historical_event_count: parseInt(row.historical_event_count) || 2,
        last_event_year: 2023,
        water_capacity_liters_per_day: waterCap,
        shelter_capacity_persons: shelterCap,
        healthcare_beds: beds,
        evacuation_route_quality: 3,
        food_stock_days: parseFloat(row.food_stock_days) || 5,
        sanitation_coverage_pct: parseFloat(row.sanitation_coverage_pct) || 60,
        safe_land_area_sqkm: parseFloat(row.safe_land_area_sqkm) || 1.0,
        nearby_hospital_count: 1,
        nearby_school_count: 2,
        nearby_shelter_count: 1,
        rainfall_annual_mm: 1000,
        slope_degrees: 2,
        soil_type: 'Alluvial',
        risk_score: finalRisk,
        risk_class: riskClass,
        capacity_utilization: avgUtil,
        capacity_status: capStatus,
        relocation_priority: priority,
        contributing_factors: [
          { factor: 'Hazard Intensity', score: Math.round(hazardSev * 100), contribution: 45, description: `${row.hazard_type || 'Hazard'} severity rating` },
          { factor: 'Population Vulnerability', score: Math.round(vulScore), contribution: 35, description: 'Demographic vulnerability density' }
        ],
        explanation: `${riskClass} risk assessed based on ${row.hazard_type || 'hazard'} severity (${hazardSev}) and ${avgUtil}% resource capacity stress.`,
        recommended_actions: priority === 'P1-IMMEDIATE' ? ['Trigger Immediate Relocation Plan', 'Alert District Magistrate'] : ['Pre-position resources', 'Monitor capacity']
      });
    }
    return newItems;
  };

  const handleImport = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text.split('\n').filter(Boolean);
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
      const parsedHabs = parseAndScoreHabitations(lines, headers);
      if (parsedHabs.length > 0) {
        if (uploadMode === 'replace') {
          replaceAllHabitations(parsedHabs);
        } else {
          addUploadedHabitations(parsedHabs);
        }
        setImportedCount(parsedHabs.length);
      }
    };
    reader.readAsText(file);
  };

  const handleFile = (f: File) => {
    setFile(f);
    setImportedCount(null);
    if (f.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        const lines = text.split('\n').filter(Boolean);
        const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
        const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
        const errors = missing.length > 0 ? [`Missing required columns: ${missing.join(', ')}`] : [];
        const rows = lines.slice(1, 6).map(l => l.split(',').map(v => v.trim()));
        setPreview({ headers, rows, errors });
      };
      reader.readAsText(f);
    } else {
      setPreview({ headers: [], rows: [], errors: [] });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Data Upload & Management"
        subtitle="Ingest geospatial and demographic survey records, configure merge or replace mode, or export current datasets."
      />

      {/* ===== SESSION SYNC PANEL ===== */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔄</span>
          <h3 className="font-bold text-blue-900 text-sm">Cross-Browser Session Sync</h3>
          <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded ml-1">IMPORTANT</span>
        </div>
        <p className="text-xs text-blue-700 mb-4 leading-relaxed">
          Uploaded data is stored in <strong>this browser only</strong>. To use the same data in another browser or device, 
          export a session file here and import it there.
        </p>

        {sessionMsg && (
          <div className={`mb-3 p-3 rounded-lg text-sm font-medium border ${sessionMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {sessionMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export */}
          <button
            onClick={() => exportSession(customHabs, isReplaceMode, relocationPlans, weightConfig)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow"
          >
            <Download className="w-4 h-4" />
            <div className="text-left">
              <div>Export Session</div>
              <div className="text-xs font-normal opacity-80">{customHabs.length} habs · {Object.keys(relocationPlans).length} relocations · weights saved</div>
            </div>
          </button>

          {/* Import */}
          <div>
            <input
              ref={sessionInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportSession}
            />
            <button
              onClick={() => sessionInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-300 rounded-xl font-semibold text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              <div className="text-left">
                <div>Import Session</div>
                <div className="text-xs font-normal text-blue-500">Load .json from another browser</div>
              </div>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-blue-500 mt-3">
          💡 Workflow: Upload data here → Export Session → Open new browser → Go to Data Upload → Import Session
        </p>
      </div>

      {/* Active Dataset Status / Revert */}
      {customHabs.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm text-indigo-900">
                Custom Dataset Active: {customHabs.length} Habitations
              </div>
              <p className="text-xs text-indigo-700">
                Mode: {isReplaceMode ? 'Replacing default 50 habitations' : 'Appended with 50 default habitations (Total: ' + (50 + customHabs.length) + ' habitations)'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              clearUploadedHabitations();
              setImportedCount(null);
              setFile(null);
              setPreview(null);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset to Default 50 Habitations
          </button>
        </div>
      )}

      {/* Mode Selector */}
      <div className="bg-white rounded-xl border p-5 shadow-sm mb-6">
        <h3 className="font-semibold text-sm text-slate-800 mb-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Choose Ingestion Mode
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Decide whether newly uploaded habitations should be merged with existing records or completely replace them.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setUploadMode('append')}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
              uploadMode === 'append'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm text-slate-800">1. Append & Merge</span>
              <input
                type="radio"
                name="uploadMode"
                checked={uploadMode === 'append'}
                onChange={() => setUploadMode('append')}
                className="text-blue-600 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Keeps the 50 default habitations</strong> and adds your new rows to them. Best for adding new survey clusters or neighboring tehsils.
            </p>
          </div>

          <div
            onClick={() => setUploadMode('replace')}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
              uploadMode === 'replace'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm text-slate-800">2. Replace All (Overwrite)</span>
              <input
                type="radio"
                name="uploadMode"
                checked={uploadMode === 'replace'}
                onChange={() => setUploadMode('replace')}
                className="text-blue-600 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Replaces all previous habitations</strong> with the uploaded dataset across the GIS Map, Dashboard, Relocation, and Capacity engines.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6 ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="font-semibold text-lg text-slate-700 mb-1">
          {file ? file.name : 'Click to upload or drag & drop habitations CSV'}
        </h3>
        <p className="text-slate-400 text-sm">Supports .csv (with required 20+ columns) — Max 50MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json,.geojson"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* File Info */}
      {file && (
        <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-slate-500">
                {(file.size / 1024).toFixed(1)} KB — {file.type || 'text/csv'}
              </div>
            </div>
            {preview?.errors.length === 0 ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>
      )}

      {/* Validation Results */}
      {preview && (
        <div className="bg-white rounded-lg border shadow-sm mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 font-medium text-sm flex items-center justify-between">
            <span>Validation Results</span>
            <span className={preview.errors.length === 0 ? 'text-green-600' : 'text-red-600 font-bold'}>
              {preview.errors.length === 0 ? '✓ Valid' : `${preview.errors.length} error(s)`}
            </span>
          </div>
          {preview.errors.length > 0 && (
            <div className="p-4">
              {preview.errors.map((e, i) => (
                <div key={i} className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-2">{e}</div>
              ))}
            </div>
          )}
          {preview.rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead className="bg-slate-100">
                  <tr>
                    {preview.headers.slice(0, 8).map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-slate-600">{h}</th>
                    ))}
                    {preview.headers.length > 8 && <th className="px-3 py-2 text-left">...</th>}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      {row.slice(0, 8).map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-slate-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.errors.length === 0 && (
            <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Ready to ingest using <strong>{uploadMode === 'replace' ? 'Replace All (Overwrite)' : 'Append & Merge'}</strong> mode.
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={importedCount !== null}
                className={`flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm shadow-sm transition-colors ${
                  importedCount !== null
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                {importedCount !== null ? (
                  <>
                    <Check className="w-4 h-4" /> Successfully Ingested ({importedCount} Records)
                  </>
                ) : (
                  `Ingest & Score (${uploadMode === 'replace' ? 'Replace All' : 'Append'})`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {importedCount !== null && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-bold text-sm">Data Ingestion Complete!</div>
              <div className="text-xs text-emerald-700">
                {importedCount} habitations have been scored and mapped across GIS Risk Map, Dashboard, Relocation, and Carrying Capacity in{' '}
                <strong>{uploadMode === 'replace' ? 'Replace All' : 'Append & Merge'}</strong> mode.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset & Template Downloads */}
      <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Datasets & Template Downloads</h3>
            <p className="text-xs text-slate-500">Get the full active 50 habitations dataset or a blank template.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadCurrentDataset}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Download Current 50 Habitations (CSV)
            </button>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" /> Download CSV Template
            </button>
          </div>
        </div>

        <h4 className="font-semibold text-xs text-slate-600 mb-2">Required CSV Schema Columns ({REQUIRED_COLS.length}):</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {REQUIRED_COLS.map(col => (
            <div key={col} className="bg-slate-50 px-2 py-1 rounded text-[11px] font-mono text-slate-600 border border-slate-100">{col}</div>
          ))}
        </div>
      </div>


      <Disclaimer />
    </div>
  );
}