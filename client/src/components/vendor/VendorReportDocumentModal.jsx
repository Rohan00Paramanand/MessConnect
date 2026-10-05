import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  Award,
  CheckCircle,
  Clock,
  ThumbsUp,
  Star,
  ShieldCheck,
  Building,
  FileText
} from 'lucide-react';

const CATEGORY_LABELS = {
  food: 'Food Quality & Portions',
  cleanliness: 'Hygiene & Cleanliness',
  timeliness: 'Meal Service Timeliness',
  taste: 'Taste & Preparation',
  'staff behaviour': 'Staff Behavior & Courteousness',
  other: 'Other Facility Issues'
};

export default function VendorReportDocumentModal({ isOpen, onClose, data }) {
  const documentRef = useRef(null);

  if (!isOpen || !data) return null;

  const {
    period,
    mess,
    vendor,
    summary,
    comparison,
    complaintsByCategory = {},
    turnaroundSpeed = {},
    resolutionFeedback = {},
    feedbackDetails = {},
    inspections = []
  } = data;

  const auditRefCode = `PCET-MC-${period.year}-${String(period.month).padStart(2, '0')}-${(mess?.name || 'FACILITY').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`;

  const handlePrintDocument = () => {
    if (!documentRef.current) return;

    const contentHtml = documentRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=1000');

    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to export PDF/Print.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Vendor_Monthly_Audit_Report_${period.monthName}_${period.year}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.45;
            }
            .document-sheet {
              width: 100%;
              max-width: 100%;
              background: #ffffff;
              padding: 0;
            }
            h1, h2, h3, h4, p {
              margin-top: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 700;
              color: #334155;
            }
            .header-banner {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 12px;
              margin-bottom: 14px;
            }
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            .kpi-box {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px;
              text-align: center;
              background-color: #ffffff;
            }
            .kpi-value {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
              margin: 2px 0;
            }
            .kpi-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
            }
            .section-title {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 4px;
              margin-top: 14px;
              margin-bottom: 8px;
            }
            .two-col-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .sign-row {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-top: 28px;
              padding-top: 12px;
              page-break-inside: avoid;
            }
            .sign-box {
              border-top: 1px solid #64748b;
              padding-top: 6px;
              text-align: center;
              font-size: 10px;
            }
            .badge-pill {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
            }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-amber { background: #fef3c7; color: #92400e; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="document-sheet">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[96vh] sm:max-h-[94vh] flex flex-col bg-gray-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 bg-gray-900 text-white flex items-center justify-between gap-2.5 flex-shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white flex-shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-black tracking-tight leading-none text-white truncate">
                Official Document Preview
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                Audit Report • {period.monthName} {period.year} • {mess.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handlePrintDocument}
              className="px-2.5 sm:px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Download official PDF or Print"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download PDF / Print</span>
              <span className="inline sm:hidden">PDF / Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-2.5 sm:p-8 flex justify-center bg-gray-200/80">
          
          {/* Printable A4 Document Sheet */}
          <div
            ref={documentRef}
            className="w-full max-w-[800px] min-w-[340px] sm:min-w-[620px] bg-white text-gray-900 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-10 border border-gray-300 font-sans text-xs leading-relaxed space-y-4"
            style={{ minHeight: '1050px' }}
          >
            {/* Institution Header */}
            <div className="header-banner border-b-2 border-gray-900 pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-0.5">
                  Pimpri Chinchwad Education Trust (PCET)
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-gray-950 uppercase tracking-tight leading-tight">
                  MessConnect Dining Audit Report
                </h1>
                <p className="text-[11px] font-bold text-gray-600">
                  Monthly Vendor Service Quality, Turnaround Compliance & Student Feedback Evaluation
                </p>
              </div>
              <div className="sm:text-right text-left text-[10px] text-gray-600 space-y-0.5 flex-shrink-0 bg-gray-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-none border-gray-200">
                <p className="font-mono font-bold text-gray-900">{auditRefCode}</p>
                <p>Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-emerald-700 font-bold">STATUS: OFFICIAL VERIFIED</p>
              </div>
            </div>

            {/* Meta Facility & Vendor Grid */}
            <div className="meta-grid grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Mess Facility</span>
                <strong className="text-sm font-black text-gray-900 block">{mess.name}</strong>
                <span className="text-[11px] text-gray-600">Location: {mess.location || 'Campus Dining Block'}</span>
                {mess.capacity && <span className="text-[11px] text-gray-500 block">Capacity: {mess.capacity} students</span>}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Appointed Vendor Enterprise</span>
                <strong className="text-sm font-black text-gray-900 block">{vendor.name}</strong>
                <span className="text-[11px] text-gray-700 font-medium block">{vendor.companyName || 'Campus Catering Services'}</span>
                <span className="text-[10px] text-gray-500">Contact: {vendor.email} {vendor.phoneNumber ? `• ${vendor.phoneNumber}` : ''}</span>
              </div>
            </div>

            {/* Audit Window Sub-bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs font-bold">
              <span>Audit Assessment Period: <strong>{period.monthName} {period.year}</strong></span>
              <span>Total Operating Days: <strong>{new Date(period.year, period.month, 0).getDate()} Days</strong></span>
            </div>

            {/* Executive KPI Scorecard */}
            <div>
              <h2 className="section-title text-xs font-black uppercase text-gray-900 border-b pb-1 mb-2.5">
                1. Executive Quality & SLA Scorecard
              </h2>
              <div className="kpi-row grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                
                <div className="kpi-box border border-gray-200 rounded-xl p-2.5 bg-gray-50/50">
                  <span className="kpi-label text-[9px] font-bold uppercase text-gray-500 block">Complaints</span>
                  <p className="kpi-value text-lg font-black text-gray-900 my-0.5">{summary.totalComplaints}</p>
                  <span className="text-[9px] text-gray-500 font-medium">Logged in period</span>
                </div>

                <div className="kpi-box border border-gray-200 rounded-xl p-2.5 bg-gray-50/50">
                  <span className="kpi-label text-[9px] font-bold uppercase text-gray-500 block">Resolution Rate</span>
                  <p className="kpi-value text-lg font-black text-emerald-600 my-0.5">{summary.resolutionRate}%</p>
                  <span className="text-[9px] text-emerald-700 font-medium">{summary.resolvedCount} completed</span>
                </div>

                <div className="kpi-box border border-gray-200 rounded-xl p-2.5 bg-gray-50/50">
                  <span className="kpi-label text-[9px] font-bold uppercase text-gray-500 block">Avg Resolution Speed</span>
                  <p className="kpi-value text-lg font-black text-blue-600 my-0.5">
                    {summary.avgResolutionHours !== null ? `${summary.avgResolutionHours} hrs` : '–'}
                  </p>
                  <span className="text-[9px] text-blue-700 font-medium">Turnaround time</span>
                </div>

                <div className="kpi-box border border-gray-200 rounded-xl p-2.5 bg-gray-50/50">
                  <span className="kpi-label text-[9px] font-bold uppercase text-gray-500 block">Satisfaction</span>
                  <p className="kpi-value text-lg font-black text-emerald-600 my-0.5">
                    {summary.satisfactionRate !== null ? `${summary.satisfactionRate}%` : '–'}
                  </p>
                  <span className="text-[9px] text-gray-500 font-medium">{resolutionFeedback.satisfied || 0} satisfied</span>
                </div>

                <div className="kpi-box border border-gray-200 rounded-xl p-2.5 bg-gray-50/50 col-span-2 sm:col-span-1">
                  <span className="kpi-label text-[9px] font-bold uppercase text-gray-500 block">Meal Rating</span>
                  <p className="kpi-value text-lg font-black text-amber-600 my-0.5">
                    {summary.overallAvgRating !== null ? `${summary.overallAvgRating} ★` : '–'}
                  </p>
                  <span className="text-[9px] text-gray-500 font-medium">{summary.totalFeedbacks} student reviews</span>
                </div>

              </div>
            </div>

            {/* Section 2: Complaints & SLA Breakdown */}
            <div className="two-col-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Complaints Table */}
              <div>
                <h3 className="section-title text-xs font-black uppercase text-gray-900 border-b pb-1 mb-2">
                  2. Complaints by Category
                </h3>
                <table className="w-full border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-1.5 font-bold border">Category</th>
                      <th className="p-1.5 font-bold border text-center">Incidents</th>
                      <th className="p-1.5 font-bold border text-center">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(complaintsByCategory).map(([cat, count]) => {
                      const share = summary.totalComplaints > 0 ? Math.round((count / summary.totalComplaints) * 100) : 0;
                      return (
                        <tr key={cat} className="border-b">
                          <td className="p-1.5 border font-medium text-gray-800 capitalize">
                            {CATEGORY_LABELS[cat] || cat}
                          </td>
                          <td className="p-1.5 border text-center font-bold text-gray-900">{count}</td>
                          <td className="p-1.5 border text-center text-gray-500">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resolution SLA Speed Table */}
              <div>
                <h3 className="section-title text-xs font-black uppercase text-gray-900 border-b pb-1 mb-2">
                  3. Turnaround Compliance (SLA)
                </h3>
                <table className="w-full border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-1.5 font-bold border">Response Bracket</th>
                      <th className="p-1.5 font-bold border text-center">Count</th>
                      <th className="p-1.5 font-bold border text-center">Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-1.5 border font-medium text-emerald-800">Under 2 Hours (Immediate)</td>
                      <td className="p-1.5 border text-center font-bold">{turnaroundSpeed.under2Hours || 0}</td>
                      <td className="p-1.5 border text-center text-emerald-700 font-bold">Excellent</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-1.5 border font-medium text-blue-800">2 to 12 Hours (Same Day)</td>
                      <td className="p-1.5 border text-center font-bold">{turnaroundSpeed.under12Hours || 0}</td>
                      <td className="p-1.5 border text-center text-blue-700 font-bold">Compliant</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-1.5 border font-medium text-amber-800">12 to 24 Hours</td>
                      <td className="p-1.5 border text-center font-bold">{turnaroundSpeed.under24Hours || 0}</td>
                      <td className="p-1.5 border text-center text-amber-700 font-bold">Standard</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-1.5 border font-medium text-rose-800">Over 24 Hours</td>
                      <td className="p-1.5 border text-center font-bold">{turnaroundSpeed.over24Hours || 0}</td>
                      <td className="p-1.5 border text-center text-rose-700 font-bold">Delayed</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Section 4: Dining Quality & Student Feedback Scorecard */}
            <div>
              <h2 className="section-title text-xs font-black uppercase text-gray-900 border-b pb-1 mb-2">
                4. Student Daily Dining Feedback Scorecard (Out of 5.0 ★)
              </h2>
              <table className="w-full border border-gray-200 text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-1.5 font-bold border">Evaluation Parameter</th>
                    <th className="p-1.5 font-bold border text-center">Score</th>
                    <th className="p-1.5 font-bold border text-center">Benchmark Grade</th>
                    <th className="p-1.5 font-bold border">Audit Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(feedbackDetails.categoryAverages || {}).map(([cat, score]) => {
                    const num = score || 0;
                    const grade = num >= 4.0 ? 'Grade A (Satisfactory)' : num >= 3.0 ? 'Grade B (Acceptable)' : 'Grade C (Needs Improvement)';
                    const gradeClass = num >= 4.0 ? 'text-emerald-700 font-bold' : num >= 3.0 ? 'text-amber-700 font-bold' : 'text-rose-700 font-bold';
                    return (
                      <tr key={cat} className="border-b">
                        <td className="p-1.5 border font-medium capitalize">{cat}</td>
                        <td className="p-1.5 border text-center font-black text-gray-900">{score ? `${score} ★` : '–'}</td>
                        <td className={`p-1.5 border text-center ${gradeClass}`}>{grade}</td>
                        <td className="p-1.5 border text-gray-600">
                          {num >= 4.0 ? 'Meets or exceeds trust quality standards.' : num >= 3.0 ? 'Requires attention to consistency.' : 'Action plan required for remediation.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section 5: Inspections Log */}
            <div>
              <h2 className="section-title text-xs font-black uppercase text-gray-900 border-b pb-1 mb-2">
                5. Mess Committee Inspection Visits Log
              </h2>
              {inspections.length > 0 ? (
                <table className="w-full border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-1.5 font-bold border">Visit Date</th>
                      <th className="p-1.5 font-bold border">Inspection Purpose</th>
                      <th className="p-1.5 font-bold border text-center">Status</th>
                      <th className="p-1.5 font-bold border">Observations & Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map((insp) => (
                      <tr key={insp.id} className="border-b">
                        <td className="p-1.5 border whitespace-nowrap font-medium">
                          {new Date(insp.visitDate).toLocaleDateString()}
                        </td>
                        <td className="p-1.5 border font-bold text-gray-900">{insp.purpose}</td>
                        <td className="p-1.5 border text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            insp.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {insp.status}
                          </span>
                        </td>
                        <td className="p-1.5 border text-gray-700">{insp.remarks || 'Standard audit completed with satisfactory notes.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 italic py-1">No formal committee inspection visits recorded during this period.</p>
              )}
            </div>

            {/* Official Authentication & Signatures Block */}
            <div className="sign-row pt-6 border-t border-gray-400 mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="sign-box pt-4 border-t border-gray-400">
                <p className="font-bold text-gray-900">{vendor.name}</p>
                <p className="text-[10px] text-gray-500">Authorized Vendor Representative</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Signature & Mess Seal</p>
              </div>

              <div className="sign-box pt-4 border-t border-gray-400">
                <p className="font-bold text-gray-900">Student Mess Committee</p>
                <p className="text-[10px] text-gray-500">Inspection & Audit Convenor</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Verified & Countersigned</p>
              </div>

              <div className="sign-box pt-4 border-t border-gray-400">
                <p className="font-bold text-gray-900">Campus Administration</p>
                <p className="text-[10px] text-gray-500">Food Safety & Quality In-charge</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Approved for Record</p>
              </div>
            </div>

            {/* Document Watermark Footer */}
            <div className="text-center pt-3 text-[9px] text-gray-400 border-t border-gray-100">
              This document is an authentic monthly operational evaluation produced by PCET MessConnect. Ref: {auditRefCode}
            </div>

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
