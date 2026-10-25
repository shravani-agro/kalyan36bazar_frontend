import React from "react";
import { Market, ResultRecord } from "@/lib/mockApi";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import templateImgUrl from "@/assets/panelchartpdf_page1.png";
import rsbossResults from "@/data/rsboss_results.json";

const getChartDateRange = (baseDateStr: string) => {
  const baseDate = new Date(baseDateStr);
  const day = baseDate.getDay();
  // 0 = Sunday, 1 = Monday, etc.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const currentWeekMonday = new Date(baseDate);
  currentWeekMonday.setDate(baseDate.getDate() + diffToMonday);

  // Check if today is Sunday and current time has passed 4:00 PM (16:00 IST)
  // When Sunday 4 PM ends, the current week has finished, so the chart moves
  // upward: Week 1 becomes the week ending on Sunday (e.g. Oct 19 - Oct 25)
  // and Week 2 becomes the upcoming week (e.g. Oct 26 - Nov 01), leaving it blank for next week!
  const now = new Date();
  const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);

  const isCurrentSundayAfter4 =
    nowIST.getDay() === 0 &&
    (nowIST.getHours() > 16 || (nowIST.getHours() === 16 && nowIST.getMinutes() >= 0));

  // Shift if it's currently Sunday after 4 PM and viewing today or the current week
  const isSundayToday =
    day === 0 &&
    (baseDateStr === todayStr || Math.abs(baseDate.getTime() - now.getTime()) < 24 * 3600 * 1000);
  const shouldShiftNextWeek = isCurrentSundayAfter4 && isSundayToday;

  let startMonday = new Date(currentWeekMonday);
  if (shouldShiftNextWeek) {
    // Current week moves upward to top 7 rows (startMonday = current week Monday),
    // and bottom 7 rows become the blank new week!
    startMonday = new Date(currentWeekMonday);
  } else {
    // Standard: last week's Monday to current week's Sunday
    startMonday.setDate(currentWeekMonday.getDate() - 7);
  }

  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(startMonday);
    d.setDate(startMonday.getDate() + i);
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

function buildResultMap(markets: Market[], results: ResultRecord[]): Map<string, ResultRecord> {
  const resultMap = new Map<string, ResultRecord>();

  // 1. First populate with RSBOSS authentic historical results
  if (Array.isArray(rsbossResults)) {
    for (const item of (rsbossResults as any[])) {
      const min = timeStringToMinutes(item.time);
      if (min !== -1) {
        resultMap.set(`${item.result_date}_${min}`, {
          id: `rsboss_${item.result_date}_${min}`,
          result_date: item.result_date,
          market_id: "",
          open_pana: item.open_pana,
          open_digit: item.open_digit,
          created_at: item.result_date,
        });
      }
    }
  }

  // 2. Overlay live results from database (if any)
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

  return resultMap;
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
  const resultMap = buildResultMap(markets, results);

  const mondayDate = dates[0];
  const mondayDateDisplay = mondayDate
    ? `${String(mondayDate.getDate()).padStart(2, "0")}/${String(mondayDate.getMonth() + 1).padStart(2, "0")}/${mondayDate.getFullYear()}`
    : "";

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
                color: "#8B4513",
                lineHeight: "1.1",
              }}
            >
              दिनांक : {blankTemplate ? "" : mondayDateDisplay}
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
                    color: "#8B4513",
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
                      color: "#d00000",
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

                const now = new Date();
                const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
                const isTodayPassed4PM =
                  nowIST.getHours() > 16 || (nowIST.getHours() === 16 && nowIST.getMinutes() >= 0);

                // Sunday after 4 PM cutoff applies ONLY to today (if >= 4 PM) or past Sundays, NEVER in advance for future Sundays
                const isSundayCutoffReached =
                  isSunday && (dateStr < todayStr || (dateStr === todayStr && isTodayPassed4PM));

                return (
                  <tr key={rowIdx}>
                    <td
                      style={{
                        border: "1px solid #000000",
                        textAlign: "center",
                        verticalAlign: "middle",
                        padding: "2px 0",
                        color: isSunday ? "#d00000" : "#8B4513",
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
                      const isSundayAfter4 = isSundayCutoffReached && colMinutes > 16 * 60;
                      const result = isSundayAfter4 ? null : resultMap.get(`${dateStr}_${colMinutes}`);

                      let openPana = "";
                      let openDigit = "";

                      if (isSundayAfter4 && !blankTemplate) {
                        openPana = "***";
                        openDigit = "*";
                      } else if (!blankTemplate && result) {
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


// Coordinates extracted with sub-pixel accuracy from panelchartpdf.pdf (2481 x 1754 image)
const X_CELL_LINES = [
  120.5, 184.7, 248.8, 313.0, 377.2, 441.3, 505.5, 569.6, 633.8, 697.9,
  762.1, 826.2, 890.4, 954.5, 1018.7, 1082.8, 1147.0, 1211.2, 1275.3, 1339.5,
  1403.6, 1467.8, 1531.9, 1596.1, 1660.2, 1724.4, 1788.5, 1852.7, 1916.8, 1981.0,
  2045.2, 2109.3, 2173.5, 2236.7, 2305.2, 2371.1, 2433.0
];

const Y_ROW_LINES = [
  446.4, 535.8, 625.1, 714.5, 803.9, 893.3, 982.7, 1072.0, 1161.4, 1250.8,
  1340.2, 1429.5, 1518.9, 1608.3, 1699.9
];

export const downloadChartPDF = async (
  baseDateStr: string,
  markets: Market[],
  results: ResultRecord[],
  options?: { blankTemplate?: boolean; onComplete?: () => void }
) => {
  try {
    const dates = getChartDateRange(baseDateStr);
    const timeCols = generateTimeColumns();

    const resultMap = buildResultMap(markets, results);

    const mondayDate = dates[0];
    const mondayDateDisplay = mondayDate
      ? `${String(mondayDate.getDate()).padStart(2, "0")}/${String(mondayDate.getMonth() + 1).padStart(2, "0")}/${mondayDate.getFullYear()}`
      : "";

    // Load base template image (the exact panel chart image)
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = templateImgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 2481;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");

    // 1. Draw the pristine template image (guaranteeing exact layout, borders, and fonts as image)
    ctx.drawImage(img, 0, 0, 2481, 1754);

    // Redraw table headers: "Date" in brown, and all 36 Time headers in RED
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 1. "Date" column header (centered at X=81.5)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(44, 359, 75, 85);
    ctx.fillStyle = "#8B4513";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.fillText("Date", 81.5, 401.7);

    // 2. All 36 Time column headers in bold RED
    timeCols.forEach((tc, colIdx) => {
      if (colIdx >= 36) return;
      const colLeft = X_CELL_LINES[colIdx];
      const colRight = X_CELL_LINES[colIdx + 1];
      const colCenterX = (colLeft + colRight) / 2;

      // Clear cell interior while preserving borders
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(colLeft + 1.5, 359, colRight - colLeft - 3, 85);

      // Draw time in bold red
      ctx.fillStyle = "#d00000";
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText(tc.displayTop, colCenterX, 386);
      ctx.fillText(tc.displayBottom, colCenterX, 416);
    });

    // 2. If not a blank template, draw header Monday date next to दिनांक :
    if (!options?.blankTemplate) {
      if (mondayDateDisplay) {
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#8B4513";
        ctx.font = "bold 52px Arial, sans-serif";
        ctx.fillText(mondayDateDisplay, 315, 285);
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const now = new Date();
      const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
      const isTodayPassed4PM =
        nowIST.getHours() > 16 || (nowIST.getHours() === 16 && nowIST.getMinutes() >= 0);

      dates.forEach((d, rowIdx) => {
        if (rowIdx >= 14) return;
        const rowTop = Y_ROW_LINES[rowIdx];
        const rowBottom = Y_ROW_LINES[rowIdx + 1];
        const rowCenterY = (rowTop + rowBottom) / 2;
        const dateStr = formatDateLocal(d);
        const isSunday = d.getDay() === 0;

        // Sunday after 4 PM cutoff applies ONLY to today (if >= 4 PM) or past Sundays, NEVER in advance for future Sundays
        const isSundayCutoffReached =
          isSunday && (dateStr < todayStr || (dateStr === todayStr && isTodayPassed4PM));

        // Draw date in Date column (centered between X=42.4 and X=120.5, center is X=81.5)
        ctx.fillStyle = isSunday ? "#c00000" : "#8B4513";
        ctx.font = "bold 20px Arial, sans-serif";
        ctx.fillText(formatDisplayDate(d), 81.5, rowCenterY - 14);
        ctx.fillText(String(d.getFullYear()), 81.5, rowCenterY + 14);

        // Draw results for each time column
        timeCols.forEach((tc, colIdx) => {
          if (colIdx >= 36) return;
          const colLeft = X_CELL_LINES[colIdx];
          const colRight = X_CELL_LINES[colIdx + 1];
          const colCenterX = (colLeft + colRight) / 2;

          const colMinutes = timeStringToMinutes(tc.timeStr);
          const isSundayAfter4 = isSundayCutoffReached && colMinutes > 16 * 60;
          const result = isSundayAfter4 ? null : resultMap.get(`${dateStr}_${colMinutes}`);

          if (isSundayAfter4 && !options?.blankTemplate) {
            ctx.fillStyle = "#000000";
            // Open Pana (***)
            ctx.font = "bold 24px Arial, sans-serif";
            ctx.fillText("***", colCenterX, rowCenterY - 14);

            // Open Digit (*)
            ctx.font = "bold 28px Arial, sans-serif";
            ctx.fillText("*", colCenterX, rowCenterY + 16);
          } else if (result && result.open_pana) {
            ctx.fillStyle = "#000000";
            // Open Pana (3 digits)
            ctx.font = "bold 24px Arial, sans-serif";
            ctx.fillText(result.open_pana, colCenterX, rowCenterY - 14);

            // Open Digit (1 digit)
            if (result.open_digit !== undefined && result.open_digit !== null) {
              ctx.font = "bold 28px Arial, sans-serif";
              ctx.fillText(String(result.open_digit), colCenterX, rowCenterY + 16);
            }
          }
        });
      });
    }

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
    if (options?.onComplete) options.onComplete();
  }
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

    downloadChartPDF(date, finalMarkets, finalResults, {
      onComplete: () => {
        setIsExporting(false);
      },
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
