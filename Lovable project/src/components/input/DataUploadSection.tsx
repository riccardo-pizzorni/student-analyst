
import React, { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X, Info } from "lucide-react";

export default function DataUploadSection() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string, name: string, size: string, status: 'uploading' | 'success' | 'error'}>>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file, index) => {
      const newFile = {
        id: Date.now() + index + '',
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        status: 'uploading' as const
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      // Simulate upload process
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id ? {...f, status: 'success'} : f
        ));
      }, 2000);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-blue-300 flex items-center gap-3 mb-2">
            <Upload size={28} className="text-blue-400" />
            Caricamento Dati Portfolio
          </h3>
          <p className="text-slate-400">Carica i tuoi dati storici per iniziare l'analisi</p>
        </div>
        <button className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-500/10 text-blue-300 rounded-xl hover:bg-blue-500/20 transition-all duration-200 border border-blue-500/30">
          <Info size={16} />
          Guida Formati
        </button>
      </div>

      {/* Main Upload Area */}
      <div 
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group
          ${dragActive 
            ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' 
            : 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-slate-800/20 hover:border-blue-400/50 hover:bg-blue-500/8'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            dragActive ? 'bg-blue-500/20 scale-110' : 'bg-blue-500/10 group-hover:bg-blue-500/15'
          }`}>
            <Upload size={32} className={`transition-all duration-300 ${
              dragActive ? 'text-blue-300 scale-110' : 'text-blue-400'
            }`} />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xl font-semibold text-slate-200">
              {dragActive ? 'Rilascia i file qui' : 'Trascina i file o clicca per selezionare'}
            </h4>
            <p className="text-slate-400">
              Supportati: CSV, XLSX, XLS • Max 50MB per file
            </p>
          </div>
          
          <div className="flex justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25">
              Seleziona File
            </button>
          </div>
        </div>
        
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500/5 rounded-2xl flex items-center justify-center">
            <div className="text-blue-300 text-xl font-medium animate-pulse">
              Rilascia per caricare
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h4 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <FileText size={18} />
            File Caricati ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    file.status === 'uploading' ? 'bg-blue-500/20' :
                    file.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {file.status === 'uploading' && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                    {file.status === 'success' && <CheckCircle size={16} className="text-green-400" />}
                    {file.status === 'error' && <AlertCircle size={16} className="text-red-400" />}
                  </div>
                  
                  <div>
                    <p className="font-medium text-slate-200">{file.name}</p>
                    <p className="text-sm text-slate-400">{file.size}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Examples */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/20 rounded-xl p-6 border border-slate-700/50">
          <h4 className="font-semibold text-blue-300 mb-3">Formato CSV Esempio</h4>
          <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
            <div className="text-slate-300">Date,AAPL,MSFT,GOOGL</div>
            <div className="text-slate-400">2024-01-01,150.25,380.50,2800.75</div>
            <div className="text-slate-400">2024-01-02,151.30,382.10,2805.20</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/50 to-green-900/20 rounded-xl p-6 border border-slate-700/50">
          <h4 className="font-semibold text-green-300 mb-3">Requisiti Dati</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              Colonna Date (formato YYYY-MM-DD)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              Prezzi di chiusura per asset
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              Minimo 252 osservazioni
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
