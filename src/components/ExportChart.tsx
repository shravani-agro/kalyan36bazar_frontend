import React from "react";
import { Market, ResultRecord } from "@/lib/mockApi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import { Download } from "lucide-react";

const getChartDateRange = (baseDateStr: string) => {
  const baseDate = new Date(baseDateStr);
  const day = baseDate.getDay();
  // 0 = Sunday, 1 = Monday, etc.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const currentWeekMonday = new Date(baseDate);
  currentWeekMonday.setDate(baseDate.getDate() + diffToMonday);

  const lastWeekMonday = new Date(currentWeekMonday);
  lastWeekMonday.setDate(currentWeekMonday.getDate() - 7);

  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(lastWeekMonday);
    d.setDate(lastWeekMonday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const generateTimeColumns = () => {
  const cols = [];
  let h = 11;
  let m = 0;
  for (let i = 0; i < 36; i++) {
    const hh12 = h > 12 ? h - 12 : h;
    const mmStr = m === 0 ? "00" : m;
    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    const displayTop = `${hh12}:${mmStr}`;
    const displayBottom = ampm;

    // Open time format in market is typically HH:mm in 24-hour
    const h24Str = String(h).padStart(2, "0");
    const timeStr = `${h24Str}:${mmStr}`;

    cols.push({ timeStr, displayTop, displayBottom });

    m += 15;
    if (m === 60) {
      m = 0;
      h++;
    }
  }
  return cols;
};

const formatDateLocal = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (d: Date) => {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}`;
};

function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const t = String(timeStr).trim().toLowerCase();

  const match = t.match(/(\d+):(\d+)/);
  if (!match) return -1;

  let h = parseInt(match[1]);
  const m = parseInt(match[2]);

  if (t.includes("pm") && h < 12) h += 12;
  if (t.includes("am") && h === 12) h = 0;

  return h * 60 + m;
}

function ChartExportTemplate({
  baseDateStr,
  markets,
  results,
}: {
  baseDateStr: string;
  markets: Market[];
  results: ResultRecord[];
}) {
  const dates = getChartDateRange(baseDateStr);
  const timeCols = generateTimeColumns();

  // Create a fast lookup map for results
  // Key: `${dateStr}_${minutesSinceMidnight}`
  const resultMap = new Map<string, ResultRecord>();

  // Map market id to its time in minutes
  const marketTimeMap = new Map<string, number>();
  for (const m of markets) {
    marketTimeMap.set(String(m.id), timeStringToMinutes(m.open_time));
  }

  for (const r of results) {
    const minutes = marketTimeMap.get(String(r.market_id));
    if (minutes !== undefined && minutes !== -1) {
      resultMap.set(`${r.result_date}_${minutes}`, r);
    }
  }

  const today = new Date();
  const currentExportDateDisplay = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  return (
    <div
      id="chart-export-container"
      style={{
        width: "1414px",
        height: "1000px",
        padding: "20px",
        boxSizing: "border-box",
        backgroundColor: "white",
        color: "black",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ border: "2px solid #000", padding: "4px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", borderBottom: "2px solid #000", height: "90px", flexShrink: 0 }}>
          <div style={{ width: "35%", borderRight: "2px solid #000", padding: "0 12px", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box" }}>
            <h1 style={{ fontSize: "36px", fontWeight: "900", margin: "0", lineHeight: "1", textAlign: "center" }}>कल्याण ३६ बाज़ार</h1>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "8px 0 0 0", textAlign: "left" }}>दिनांक : {currentExportDateDisplay}</h2>
          </div>
          <div style={{ width: "65%", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
            <h1 style={{ fontSize: "48px", fontWeight: "900", margin: "0", letterSpacing: "2px", lineHeight: "1", paddingBottom: "10px" }}>KALYAN 36 BAZAR</h1>
          </div>
        </div>

        {/* Table */}
        <div style={{ height: "calc(100% - 90px)", width: "100%", overflow: "hidden" }}>
          <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #888", width: "50px", padding: "8px 0", fontSize: "12px", color: "red", backgroundColor: "#f9f9f9", verticalAlign: "middle" }}>date</th>
                {timeCols.map((tc, idx) => (
                  <th key={idx} style={{ border: "1px solid #888", padding: "8px 0", fontSize: "10px", textAlign: "center", color: "red", backgroundColor: "#f9f9f9", lineHeight: "1.2", verticalAlign: "middle" }}>
                    <div style={{ paddingBottom: "3px" }}>{tc.displayTop}</div>
                    <div style={{ paddingBottom: "2px" }}>{tc.displayBottom}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((d, rowIdx) => {
                const dateStr = formatDateLocal(d);
                const isSunday = d.getDay() === 0;
                const displayColor = isSunday ? "red" : "black";

                return (
                  <tr key={rowIdx}>
                    <td style={{ border: "1px solid #888", textAlign: "center", verticalAlign: "middle", padding: "2px 0", color: displayColor, lineHeight: "1.2", fontSize: "12px", fontWeight: "bold" }}>
                      <div>{formatDisplayDate(d)}</div>
                      <div>{d.getFullYear()}</div>
                    </td>
                    {timeCols.map((tc, colIdx) => {
                      const colMinutes = timeStringToMinutes(tc.timeStr);
                      const result = resultMap.get(`${dateStr}_${colMinutes}`);

                      const cellTime = new Date(d);
                      cellTime.setHours(0, 0, 0, 0); // Ensure midnight
                      cellTime.setHours(Math.floor(colMinutes / 60), colMinutes % 60, 0, 0);

                      const isPast = cellTime <= today;

                      let openPana = "";
                      let openDigit = "";

                      if (result) {
                        openPana = result.open_pana || "***";
                        openDigit = result.open_digit !== undefined && result.open_digit !== null ? String(result.open_digit) : "*";
                      } else {
                        if (isPast) {
                          openPana = "***";
                          openDigit = "*";
                        }
                      }

                      return (
                        <td key={colIdx} style={{ border: "1px solid #888", textAlign: "center", verticalAlign: "middle", padding: "6px 0", lineHeight: "1.1" }}>
                          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black", letterSpacing: "1px" }}>{openPana}</div>
                          <div style={{ fontSize: "17px", fontWeight: "bold", color: "black", marginTop: "2px" }}>{openDigit}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const downloadChartPDF = async (
  baseDateStr: string,
  markets: Market[],
  results: ResultRecord[],
  onComplete?: () => void
) => {
  // Create a hidden container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  const root = createRoot(container);

  root.render(<ChartExportTemplate baseDateStr={baseDateStr} markets={markets} results={results} />);

  // Give React time to render
  setTimeout(async () => {
    try {
      const element = document.getElementById("chart-export-container");
      if (!element) throw new Error("Chart container not found");

      const canvas = await html2canvas(element, {
        scale: 2, // higher resolution
        useCORS: true,
        width: 1414,
        height: 1000,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // A4 landscape is 297 x 210 mm
      pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
      pdf.save("kalyan36-panel-chart.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      root.unmount();
      document.body.removeChild(container);
      if (onComplete) onComplete();
    }
  }, 500);
};

export function ExportChartButton({
  date,
  markets,
  results,
}: {
  date: string;
  markets: Market[];
  results: ResultRecord[];
}) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    let finalMarkets = markets;
    let finalResults = results;

    // Fetch perfectly fresh data from the dedicated FastAPI endpoint before creating PDF
    try {
      const res = await fetch("http://localhost:8000/api/get_pdf_results");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.markets && data.results) {
          finalMarkets = data.markets;
          finalResults = data.results;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch from FastAPI endpoint, falling back to React state", err);
    }

    downloadChartPDF(date, finalMarkets, finalResults, () => {
      setIsExporting(false);
    });
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="btn-primary"
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export Chart PDF"}
    </button>
  );
}
