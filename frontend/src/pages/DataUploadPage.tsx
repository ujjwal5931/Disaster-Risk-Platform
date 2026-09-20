import { useState, useRef } from 'react';
import { PageHeader, Disclaimer } from '../components/ui';
import { Upload, FileText, Download, CheckCircle, XCircle, Check, Database, FileSpreadsheet, Layers, Loader2, Globe } from 'lucide-react';
import { replaceAllHabitations } from '../api/client';
import { refreshHabitations } from '../hooks/useHabitations';

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

/** Parse CSV rows into backend-ready habitation objects */
function parseCSVToHabitations(lines: string[], headers: string[]) {
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',').map(p => p.trim());
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => { row[h] = parts[idx] || ''; });

    const pop = parseInt(row.population) || 1000;
    const hazardSev = parseFloat(row.hazard_severity) || 0.5;
    const waterCap = parseFloat(row.water_capacity_liters_per_day) || pop * 30;
    const shelterCap = parseInt(row.shelter_capacity_persons) || Math.round(pop * 0.15);
    const beds = parseInt(row.healthcare_beds) || Math.max(1, Math.round(pop / 500));

    items.push({
      name: row.name || `Habitation ${i}`,
      latitude: parseFloat(row.latitude) || 20.0,
      longitude: parseFloat(row.longitude) || 78.0,
      population: pop,
      district: row.district || 'Custom District',
      state: row.state || 'Custom State',
      hazard_type: (row.hazard_type || 'flood').toLowerCase(),
      hazard_severity: hazardSev,
      elevation: parseFloat(row.elevation) || 100.0,
      children_count: parseInt(row.children_count) || Math.round(pop * 0.2),
      elderly_count: parseInt(row.elderly_count) || Math.round(pop * 0.1),
      disabled_count: parseInt(row.disabled_count) || Math.round(pop * 0.02),
      pregnant_women_count: parseInt(row.pregnant_women_count) || 0,
      below_poverty_count: parseInt(row.below_poverty_count) || Math.round(pop * 0.35),
      housing_quality: parseInt(row.housing_quality) || 3,
      road_accessibility: parseInt(row.road_accessibility) || 3,
      historical_event_count: parseInt(row.historical_event_count) || 2,
      last_event_year: parseInt(row.last_event_year) || 2023,
      water_capacity_liters_per_day: waterCap,
      shelter_capacity_persons: shelterCap,
      healthcare_beds: beds,
      evacuation_route_quality: parseInt(row.evacuation_route_quality) || 3,
      food_stock_days: parseFloat(row.food_stock_days) || 5.0,
      sanitation_coverage_pct: parseFloat(row.sanitation_coverage_pct) || 60.0,
      safe_land_area_sqkm: parseFloat(row.safe_land_area_sqkm) || 1.0,
      nearby_hospital_count: parseInt(row.nearby_hospital_count) || 1,
      nearby_school_count: parseInt(row.nearby_school_count) || 2,
      nearby_shelter_count: parseInt(row.nearby_shelter_count) || 1,
      rainfall_annual_mm: parseFloat(row.rainfall_annual_mm) || 1000.0,
      slope_degrees: parseFloat(row.slope_degrees) || 2.0,
      soil_type: row.soil_type || 'Alluvial',
      distance_from_hazard_km: parseFloat(row.distance_from_hazard_km) || 2.0,
    });
  }
  return items;
}

export default function DataUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ rows: string[][]; headers: string[]; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ count: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setUploadResult(null);
    setUploadError(null);
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
      setPreview({ headers: [], rows: [], errors: ['Only .csv files are supported.'] });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUploadToDatabase = async () => {
    if (!file || !preview || preview.errors.length > 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = (e.target?.result as string) || '';
          const lines = text.split('\n').filter(Boolean);
          const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
          const habitations = parseCSVToHabitations(lines, headers);

          const result = await replaceAllHabitations(habitations);
          // Invalidate the cache so all pages refetch from backend
          await refreshHabitations();
          setUploadResult({ count: result.inserted });
          setUploading(false);
        } catch (err: any) {
          setUploadError(`Upload failed: ${err.message}`);
          setUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setUploadError(`Failed to read file: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Data Upload & Management"
        subtitle="Upload a CSV of habitations to the shared database. All browsers and devices will instantly see the updated data."
      />

      {/* ── Live Database Info Banner ── */}
      <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
        <Globe className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div>
          <div className="font-semibold text-emerald-900 text-sm">Shared Database Active</div>
          <p className="text-xs text-emerald-700">
            Data is stored in a shared Neon PostgreSQL database.
            When you upload, <strong>every browser</strong> (any device) automatically shows the updated habitations.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">Live</span>
        </div>
      </div>

      {/* ── Upload Zone ── */}
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
        <p className="text-slate-400 text-sm">Supports .csv with required columns — data will replace all current habitations in the shared database</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* ── File Info ── */}
      {file && (
        <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
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

      {/* ── Validation ── */}
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

          {preview.errors.length === 0 && !uploadResult && (
            <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Ready to upload to the <strong>shared database</strong>. This replaces all current habitations for all users.
                </p>
              </div>
              <button
                onClick={handleUploadToDatabase}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm shadow-sm transition-colors bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-60"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading to Database…</>
                ) : (
                  <><Database className="w-4 h-4" /> Upload to Shared Database</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Upload Error ── */}
      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl text-sm">
          ❌ {uploadError}
        </div>
      )}

      {/* ── Success ── */}
      {uploadResult && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl shadow-sm flex items-center gap-4">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> Database Updated Successfully!
            </div>
            <div className="text-xs text-emerald-700 mt-0.5">
              <strong>{uploadResult.count} habitations</strong> saved to the shared Neon database.
              All tabs (Risk Map, Dashboard, Analytics, Relocation, etc.) are now showing the new data.
              Any other browser visiting this platform also sees the updated data automatically.
            </div>
          </div>
        </div>
      )}

      {/* ── Downloads ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Datasets & Template Downloads</h3>
            <p className="text-xs text-slate-500">Get the sample 50 habitations dataset or a blank upload template.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadCurrentDataset}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Download Sample 50 Habitations (CSV)
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

      {/* ── Schema Info ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" /> How Upload Works
        </h3>
        <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
          <li>Download the CSV template or Sample 50 dataset above</li>
          <li>Fill in your habitation data (one row per habitation)</li>
          <li>Upload the file here — data is validated client-side first</li>
          <li>Click <strong>Upload to Shared Database</strong> — all rows are sent to the Neon PostgreSQL database on Render</li>
          <li>Every browser (any device, any login) instantly fetches the new data from the database</li>
          <li>All tabs auto-update: Risk Map, Dashboard, Analytics, Relocation, Hazard Analysis, etc.</li>
        </ol>
      </div>

      <Disclaimer />
    </div>
  );
}