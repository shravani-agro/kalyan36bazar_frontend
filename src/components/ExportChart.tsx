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
  blankTemplate = false,
}: {
  baseDateStr: string;
  markets: Market[];
  results: ResultRecord[];
  blankTemplate?: boolean;
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
        padding: "24px 28px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          border: "2.5px solid #000000",
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #000000",
            height: "150px",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        >
          {/* Left Header Box (Hindi Title + Date) */}
          <div
            style={{
              width: "47.5%",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Akruti', 'Mangal', sans-serif",
                fontSize: "48px",
                fontWeight: "900",
                color: "#000000",
                lineHeight: "1.1",
                letterSpacing: "0.5px",
              }}
            >
              कल्याण ३६ बाजार
            </div>
            <div
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Akruti', 'Mangal', sans-serif",
                fontSize: "28px",
                fontWeight: "800",
                color: "#000000",
                lineHeight: "1.1",
              }}
            >
              दिनांक : {blankTemplate ? "" : currentExportDateDisplay}
            </div>
          </div>

          {/* Double Vertical Divider with spacing identical to panelchartpdf.pdf */}
          <div
            style={{
              width: "14px",
              borderLeft: "2px solid #000000",
              borderRight: "2px solid #000000",
              backgroundColor: "#ffffff",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          />

          {/* Right Header Box (KALYAN 36 BAZAR + RSBOSS.NET) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              padding: "8px 16px",
            }}
          >
            <div
              style={{
                fontFamily: "'Arial Black', 'Montserrat', Impact, 'Segoe UI Black', sans-serif",
                fontSize: "50px",
                fontWeight: "900",
                color: "#000000",
                letterSpacing: "2px",
                lineHeight: "1.05",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              KALYAN 36 BAZAR
            </div>
            <div
              style={{
                fontFamily: "'Arial Black', 'Montserrat', Impact, 'Segoe UI Black', sans-serif",
                fontSize: "44px",
                fontWeight: "900",
                color: "#000000",
                letterSpacing: "1.5px",
                lineHeight: "1.05",
                marginTop: "10px",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              RSBOSS.NET
            </div>
          </div>
        </div>

        {/* Table Area (36 Time Columns + Date) */}
        <div style={{ flex: 1, width: "100%", overflow: "hidden" }}>
          <table
            style={{
              width: "100%",
              height: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ height: "46px" }}>
                <th
                  style={{
                    border: "1px solid #000000",
                    width: "48px",
                    padding: "3px 0",
                    fontSize: "13px",
                    fontWeight: "bold",
                    fontFamily: "Arial, sans-serif",
                    color: "#000000",
                    backgroundColor: "#ffffff",
                    verticalAlign: "middle",
                    textAlign: "center",
                  }}
                >
                  Date
                </th>
                {timeCols.map((tc, idx) => (
                  <th
                    key={idx}
                    style={{
                      border: "1px solid #000000",
                      padding: "2px 0",
                      fontSize: "10.5px",
                      fontWeight: "bold",
                      fontFamily: "Arial, sans-serif",
                      textAlign: "center",
                      color: "#000000",
                      backgroundColor: "#ffffff",
                      lineHeight: "1.15",
                      verticalAlign: "middle",
                    }}
                  >
                    <div>{tc.displayTop}</div>
                    <div>{tc.displayBottom}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((d, rowIdx) => {
                const dateStr = formatDateLocal(d);
                const isSunday = d.getDay() === 0;

                return (
                  <tr key={rowIdx}>
                    <td
                      style={{
                        border: "1px solid #000000",
                        textAlign: "center",
                        verticalAlign: "middle",
                        padding: "2px 0",
                        color: isSunday ? "#d00000" : "#000000",
                        lineHeight: "1.15",
                        fontSize: "11px",
                        fontWeight: "bold",
                        fontFamily: "Arial, sans-serif",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {!blankTemplate ? (
                        <>
                          <div>{formatDisplayDate(d)}</div>
                          <div>{d.getFullYear()}</div>
                        </>
                      ) : null}
                    </td>
                    {timeCols.map((tc, colIdx) => {
                      const colMinutes = timeStringToMinutes(tc.timeStr);
                      const result = resultMap.get(`${dateStr}_${colMinutes}`);

                      let openPana = "";
                      let openDigit = "";

                      if (!blankTemplate && result) {
                        openPana = result.open_pana || "";
                        openDigit =
                          result.open_digit !== undefined && result.open_digit !== null
                            ? String(result.open_digit)
                            : "";
                      }

                      return (
                        <td
                          key={colIdx}
                          style={{
                            border: "1px solid #000000",
                            textAlign: "center",
                            verticalAlign: "middle",
                            padding: "2px 0",
                            lineHeight: "1.1",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          {openPana ? (
                            <>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  color: "#000000",
                                  letterSpacing: "0.5px",
                                  fontFamily: "Arial, sans-serif",
                                }}
                              >
                                {openPana}
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  color: "#000000",
                                  marginTop: "2px",
                                  fontFamily: "Arial, sans-serif",
                                }}
                              >
                                {openDigit}
                              </div>
                            </>
                          ) : null}
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
  options?: { blankTemplate?: boolean; onComplete?: () => void }
) => {
  // Create a hidden container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  const root = createRoot(container);

  root.render(
    <ChartExportTemplate
      baseDateStr={baseDateStr}
      markets={markets}
      results={results}
      blankTemplate={options?.blankTemplate}
    />
  );

  // Wait for fonts and DOM rendering
  setTimeout(async () => {
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const element = document.getElementById("chart-export-container");
      if (!element) throw new Error("Chart container not found");

      const canvas = await html2canvas(element, {
        scale: 2.5, // High-resolution print quality
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 1414,
        height: 1000,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // A4 landscape is 297 x 210 mm
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      const filename = options?.blankTemplate
        ? "kalyan36-panel-chart-blank.pdf"
        : "kalyan36-panel-chart.pdf";
      pdf.save(filename);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      root.unmount();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      if (options?.onComplete) options.onComplete();
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
  const [isBlankExporting, setIsBlankExporting] = React.useState(false);

  const handleExport = async (blank: boolean = false) => {
    if (blank) {
      setIsBlankExporting(true);
    } else {
      setIsExporting(true);
    }

    let finalMarkets = markets;
    let finalResults = results;

    if (!blank) {
      // Fetch fresh data from backend
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
    }

    downloadChartPDF(date, finalMarkets, finalResults, {
      blankTemplate: blank,
      onComplete: () => {
        setIsExporting(false);
        setIsBlankExporting(false);
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport(false)}
        disabled={isExporting || isBlankExporting}
        className="btn-primary"
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export Chart PDF"}
      </button>
      <button
        onClick={() => handleExport(true)}
        disabled={isExporting || isBlankExporting}
        className="btn-secondary"
        title="Download blank chart template identical to panelchartpdf.pdf"
      >
        <Download className="mr-2 h-4 w-4" />
        {isBlankExporting ? "Exporting..." : "Blank Chart PDF"}
      </button>
    </div>
  );
}
