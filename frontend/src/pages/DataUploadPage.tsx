import { useState, useRef } from 'react';
import { PageHeader, Disclaimer } from '../components/ui';
import { Upload, FileText, Download, CheckCircle, XCircle } from 'lucide-react';

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
  a.download = 'drips_habitation_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ rows: string[][]; headers: string[]; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
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
        title="Data Upload"
        subtitle="Ingest new geospatial and demographic data to update risk assessments."
      />

      {/* Upload Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-6 ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="font-semibold text-lg text-slate-700 mb-1">
          {file ? file.name : 'Click to upload or drag & drop'}
        </h3>
        <p className="text-slate-400 text-sm">Supports .csv, .json, .geojson — Max 50MB</p>
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
            <div className="p-4 border-t">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium text-sm">
                Import Data (Demo Mode — no actual import)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Required Columns & Template */}
      <div className="bg-white rounded-lg border shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Required CSV Columns ({REQUIRED_COLS.length})</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Download Template
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {REQUIRED_COLS.map(col => (
            <div key={col} className="bg-slate-50 px-2 py-1 rounded text-xs font-mono text-slate-600">{col}</div>
          ))}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}