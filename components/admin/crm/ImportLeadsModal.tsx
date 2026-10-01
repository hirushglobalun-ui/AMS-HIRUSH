import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { LeadStatus, ClientType, LeadCategory, Lead } from '../../../types';
import toast from 'react-hot-toast';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  bulkAddLeads: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'slNo'>[]) => Promise<void>;
  defaultCategory?: LeadCategory;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ isOpen, onClose, onImportComplete, bulkAddLeads, defaultCategory = LeadCategory.COMPANY }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LeadCategory>(defaultCategory);
  const [parsedLeads, setParsedLeads] = useState<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'slNo'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedCategory(defaultCategory);
      setFile(null);
      setParsedLeads([]);
      setErrors([]);
    }
  }, [isOpen, defaultCategory]);

  if (!isOpen) return null;

  const handleCategorySelect = (newCat: LeadCategory) => {
    setSelectedCategory(newCat);
    if (parsedLeads.length > 0) {
      setParsedLeads(prev => prev.map(lead => ({
        ...lead,
        category: newCat
      })));
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Project Name',
      'Category',
      'First Start Date',
      'Work Commencement Date',
      'Status',
      'POC Name',
      'POC Email',
      'POC Phone',
      'Client Name',
      'Client Phone',
      'Client Email',
      'Client Type',
      'Client Detail / Reference',
      'Domain Detail',
      'Expiry Date',
      'Remark'
    ];

    // Create an example row
    const exampleRow = [
      'Example Website Redesign',
      selectedCategory,
      '2026-06-01',
      '',
      'Pending',
      'Jane Doe',
      'jane@example.com',
      '+1234567890',
      'Acme Corporation',
      '+1987654321',
      'client@company.com',
      'B2B',
      'Acme Technologies Inc.',
      'www.example.com',
      '2027-06-01',
      'Interested in SEO too'
    ];

    const csvContent = [headers.join(','), exampleRow.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leads_import_template.csv';
    link.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isCSV = selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv');
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

      if (!isCSV && !isExcel) {
        toast.error('Please upload a valid CSV or Excel file.');
        return;
      }
      setFile(selectedFile);

      if (isCSV) {
        parseCSV(selectedFile);
      } else if (isExcel) {
        parseExcel(selectedFile);
      }
    }
  };

  const parseExcel = async (fileToParse: File) => {
    try {
      const data = await fileToParse.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
      validateAndSetLeads(jsonData);
    } catch (error: any) {
      toast.error(`Error parsing Excel: ${error.message}`);
    }
  };

  const parseCSV = (fileToParse: File) => {
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateAndSetLeads(results.data);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const validateAndSetLeads = (data: any[]) => {
    const validationErrors: string[] = [];
    const leadsToImport: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'slNo'>[] = [];

    data.forEach((rawRow, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header

      // Clean row keys (trim whitespace from headers)
      const row: any = {};
      for (const key in rawRow) {
        row[key.trim()] = rawRow[key];
      }

      // Extract and stringify values safely
      const rawProjectName = row['Project Name'];
      const rawFirstStartDate = row['First Start Date'];
      const rawPocName = row['POC Name'];
      const rawClientType = row['Client Type'];
      const rawStatus = row['Status'];
      const rawCategory = row['Category'];

      // Skip completely empty rows
      if (!rawProjectName && !rawFirstStartDate && !rawPocName && !rawClientType && !rawStatus) {
        return;
      }

      const projectName = String(rawProjectName || '').trim();
      const firstStartDate = String(rawFirstStartDate || '').trim();
      const pocName = String(rawPocName || '').trim();
      const clientTypeRaw = String(rawClientType || 'B2B').trim();
      const statusRaw = String(rawStatus || 'Pending').trim();
      const categoryRaw = String(rawCategory || '').trim();

      // Use selectedCategory chosen in the modal dropdown for all imported leads
      const category = selectedCategory;

      // Validate Client Type (Case insensitive)
      let clientType = ClientType.B2B;
      const matchedClientType = Object.values(ClientType).find(c => c.toLowerCase() === clientTypeRaw.toLowerCase());
      if (matchedClientType) {
        clientType = matchedClientType as ClientType;
      } else if (clientTypeRaw) {
        validationErrors.push(`Row ${rowNum}: Invalid Client Type '${clientTypeRaw}'. Must be one of: ${Object.values(ClientType).join(', ')}.`);
      }

      // Validate Status (Case insensitive)
      let status = LeadStatus.PENDING;
      const matchedStatus = Object.values(LeadStatus).find(s => s.toLowerCase() === statusRaw.toLowerCase());
      if (matchedStatus) {
        status = matchedStatus as LeadStatus;
      } else if (statusRaw) {
        validationErrors.push(`Row ${rowNum}: Invalid Status '${statusRaw}'.`);
      }

      leadsToImport.push({
        projectName,
        category,
        firstStartDate,
        workCommencementDate: String(row['Work Commencement Date'] || row['Commencement Date'] || '').trim(),
        status,
        pocName,
        pocEmail: String(row['POC Email'] || '').trim(),
        pocPhone: String(row['POC Phone'] || '').trim(),
        clientName: String(row['Client Name'] || '').trim(),
        clientPhone: String(row['Client Phone'] || '').trim(),
        clientEmail: String(row['Client Email'] || '').trim(),
        clientType,
        clientTypeDetail: String(
          row['Client Detail / Reference'] ||
          row['Client Type Detail'] ||
          row['Company Name'] ||
          row['Friend Name'] ||
          row['Referrer Name'] ||
          row['Sales Person'] ||
          ''
        ).trim(),
        domainDetail: String(row['Domain Detail'] || '').trim(),
        expiryDate: String(row['Expiry Date'] || '').trim(),
        remark: String(row['Remark'] || '').trim(),
        department: [], // Default empty, can be edited later
        assignedTo: '' // Default unassigned
      });
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors.slice(0, 5)); // Show max 5 errors
      if (validationErrors.length > 5) {
        setErrors(prev => [...prev, `...and ${validationErrors.length - 5} more errors.`]);
      }
      setParsedLeads([]);
    } else {
      setErrors([]);
      setParsedLeads(leadsToImport);
    }
  };

  const handleImport = async () => {
    if (parsedLeads.length === 0) return;

    setIsUploading(true);
    try {
      await bulkAddLeads(parsedLeads);
      toast.success(`Successfully imported ${parsedLeads.length} leads!`);
      onImportComplete();
      onClose();
    } catch (error) {
      toast.error('Failed to import leads');
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-transparent flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Import Leads</h3>
              <p className="text-xs text-slate-500">Upload bulk leads via CSV or Excel (.xlsx)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">

          {/* Step 1: Download Template */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-indigo-900">1. Get the Template</h4>
              <p className="text-xs text-indigo-700/70 mt-1">Download our CSV format to ensure correct columns.</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <Download size={16} /> Template
            </button>
          </div>

          {/* Import Category Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Lead Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value as LeadCategory)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium transition-all outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/15 shadow-sm"
            >
              {Object.values(LeadCategory).map((cat) => (
                <option key={cat} value={cat}>Import as {cat} Leads</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Unspecified rows in CSV will be saved under this category.</p>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">2. Upload Filled File</h4>
            <label className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${file ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100'}`}>
              <FileSpreadsheet size={32} className={file ? 'text-indigo-600' : 'text-slate-400'} />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">{file ? file.name : 'Click to select CSV or Excel file'}</p>
                {!file && <p className="text-xs text-slate-500 mt-1">or drag and drop here</p>}
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Errors Preview */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle size={16} />
                <h4 className="text-sm font-bold">Validation Errors Found</h4>
              </div>
              <ul className="text-xs text-red-600 space-y-1 list-disc pl-5">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* Success Preview */}
          {parsedLeads.length > 0 && errors.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Ready to Import</h4>
                <p className="text-xs text-emerald-700 mt-0.5">{parsedLeads.length} leads successfully validated.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedLeads.length === 0 || isUploading}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
          >
            {isUploading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
            ) : (
              <><UploadCloud size={18} /> Confirm Import</>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ImportLeadsModal;
