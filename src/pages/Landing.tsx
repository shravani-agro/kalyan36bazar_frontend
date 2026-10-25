import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Smartphone,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowRight,
  HelpCircle,
  Plus,
  Minus,
  Trophy,
  Play,
  CheckCircle,
  MessageCircle,
  User,
  Lock,
  RefreshCw,
  Search,
  Award,
  ChevronRight,
  Star,
  Zap,
  PhoneCall,
  Menu,
  X
} from "lucide-react";
import { realApi } from "../lib/api";

export default function Landing() {
  const [loading, setLoading] = useState(true);
  const [dbMarkets, setDbMarkets] = useState<any[]>([]);
  const [dbResults, setDbResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic SEO Metadata Injection & JSON-LD Structured Data Schema
  useEffect(() => {
    // 1. Dynamic Title Tag
    document.title = "Kalyan 36 Bazar | Fast Live Satta Matka Results, Kalyan Matka App";

    // 2. Dynamic Meta Description Tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      "Get the fastest live Satta Matka results for Kalyan Matka, Kalyan Day, Rajdhani Night, and Main Bazar. Download the official Kalyan 36 Bazar Android app today for secure Matka gaming and instant withdrawals."
    );

    // 3. Dynamic Meta Keywords Tag
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute(
      'content',
      "kalyan 35 bazar, kalyan 36 bazar, satta matka, kalyan matka, kalyan 36 bazar, satta matka results, kalyan day results, rajdhani night results, kalyan open close, download kalyan matka apk"
    );

    // 4. Dynamic Canonical Link Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin);

    // 5. Software Application JSON-LD Schema (Google Rich Results snippet optimization)
    const schemaId = "kalyan36-ld-json";
    let schemaScript = document.getElementById(schemaId);
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', schemaId);
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Kalyan 36 Bazar App",
      "operatingSystem": "Android",
      "applicationCategory": "GameApplication",
      "downloadUrl": "https://github.com/shravani-agro/kalyan36bazar_frontend/releases/latest/download/kalyan36bazar.apk",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "INR"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "14285"
      },
      "description": "Securely bid and check lightning-fast Satta Matka results for Kalyan Matka, Kalyan Day, and Main Bazar directly on your Android device.",
      "author": {
        "@type": "Organization",
        "name": "Kalyan 36 Bazar"
      }
    };
    schemaScript.innerHTML = JSON.stringify(schemaData);

    return () => {
      // Cleanup schema markup when component unmounts
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real-time market results from the server
  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await realApi.db.getAll();
        if (!error && data) {
          if (data.markets && data.markets.length > 0) {
            setDbMarkets(data.markets);
          }
          if (data.results && data.results.length > 0) {
            setDbResults(data.results);
          }
        }
      } catch (e) {
        console.error("Failed to load real-time market data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Process and merge database markets
  const processedMarkets = useMemo(() => {
    return dbMarkets.map((m) => {
      // Get today's date in IST (YYYY-MM-DD)
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      // Find results for this market from the DB results for TODAY
      const marketResults = dbResults.filter((r) => String(r.market_id) === String(m.id) && r.result_date === todayStr);
      const latestResult = marketResults[marketResults.length - 1];

      let displayResult = "***-**";
      if (latestResult) {
        let timePassed = true;
        if (m.open_time) {
          const timeStr = String(m.open_time).trim().toUpperCase();
          let openHour = 0;
          let openMin = 0;

          const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/);
          if (match) {
            openHour = parseInt(match[1], 10);
            openMin = parseInt(match[2], 10);
            if (match[3] === 'PM' && openHour < 12) openHour += 12;
            if (match[3] === 'AM' && openHour === 12) openHour = 0;

            // Use the precisely ticking currentTime
            const istTimeStr = currentTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour12: false, hour: '2-digit', minute: '2-digit' });
            const currentHourParts = istTimeStr.split(':');
            const currentHour = parseInt(currentHourParts[0], 10) % 24;
            const currentMinute = parseInt(currentHourParts[1], 10);

            if (currentHour < openHour) {
              timePassed = false;
            } else if (currentHour === openHour && currentMinute < openMin) {
              timePassed = false;
            }
          }
        }

        if (timePassed) {
          const openPana = latestResult.open_pana ? String(latestResult.open_pana).trim() : "";
          const openDigit = latestResult.open_digit !== undefined && latestResult.open_digit !== null ? String(latestResult.open_digit).trim() : "";
          const closeDigit = latestResult.close_digit !== undefined && latestResult.close_digit !== null ? String(latestResult.close_digit).trim() : "";
          const closePana = latestResult.close_pana ? String(latestResult.close_pana).trim() : "";

          const hasOpen = openPana && openDigit && openPana !== "???" && openDigit !== "?";
          const hasClose = closeDigit && closePana && closeDigit !== "?" && closePana !== "???";

          if (hasOpen && hasClose) {
            displayResult = `${openPana}-${openDigit}${closeDigit}-${closePana}`;
          } else if (hasOpen) {
            // If only open is declared, show strictly in XXX-X format (e.g., 346-3)
            displayResult = `${openPana}-${openDigit}`;
          }
        }
      }

      // Guess close time or use default
      let closeTime = m.close_time || "Pending";
      if (!m.close_time && m.open_time) {
        // Formulate a beautiful close time based on standard schedules if not explicitly specified
        closeTime = m.open_time.replace("PM", "PM Close").replace("AM", "AM Close");
      }

      // Guess time zone details or standard labels
      let type = m.type || "Special";
      if (!m.type && m.open_time) {
        let hour = parseInt(m.open_time.split(":")[0]) || 12;
        const isPM = m.open_time.toUpperCase().includes("PM");
        const isAM = m.open_time.toUpperCase().includes("AM");

        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;

        if (hour >= 18 || (hour >= 0 && hour < 6)) type = "Night";
        else if (hour >= 12 && hour < 18) type = "Day";
        else type = "Morning";
      }

      // Check current day and time in IST
      const istDate = new Date(currentTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const isSunday = istDate.getDay() === 0;
      const currentHour = istDate.getHours();
      const currentMinute = istDate.getMinutes();
      const currentMinutes = currentHour * 60 + currentMinute;

      // Extract market's open time in minutes
      let openHour = 0;
      let openMin = 0;
      if (m.open_time) {
        const timeStr = String(m.open_time).trim().toUpperCase();
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/);
        if (match) {
          openHour = parseInt(match[1], 10);
          openMin = parseInt(match[2], 10);
          if (match[3] === 'PM' && openHour < 12) openHour += 12;
          if (match[3] === 'AM' && openHour === 12) openHour = 0;
        }
      }
      const marketMinutes = openHour * 60 + openMin;

      // Sunday restriction: Market runs up to 4:00 PM (16:00 = 960 mins) only, after that it will close
      let isLive = false;
      let isSundayClosed = false;

      if (isSunday) {
        if (marketMinutes > 16 * 60 || currentMinutes >= 16 * 60) {
          isSundayClosed = true;
          isLive = false;
        } else if (currentMinutes < marketMinutes) {
          isLive = true;
        }
      } else {
        // Mon-Sat: active if current time is before the market round time and within operating hours
        if (currentMinutes >= 11 * 60 && currentMinutes < marketMinutes && currentMinutes <= 20 * 60) {
          isLive = true;
        }
      }

      return {
        ...m,
        close_time: isSundayClosed && marketMinutes > 16 * 60 ? "Sunday Closed (Runs Upto 4 PM)" : closeTime,
        result: displayResult,
        type,
        isLive,
        isSundayClosed
      };
    });
  }, [dbMarkets, dbResults, currentTime]);

  // Filter markets based on user search query
  const filteredMarkets = useMemo(() => {
    return processedMarkets.filter((m) =>
      m.market_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [processedMarkets, searchQuery]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen relative bg-[#070A13] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-900 overflow-x-hidden w-full">

      {/* Background Gradients & Glow Effects - clipped to absolute boundary to prevent scroll leakage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[600px] bg-gradient-to-b from-indigo-900/10 via-amber-500/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[800px] -left-[200px] w-[500px] h-[500px] bg-blue-900/10 blur-3xl rounded-full" />
        <div className="absolute top-[1800px] -right-[200px] w-[500px] h-[500px] bg-amber-500/5 blur-3xl rounded-full" />
      </div>

      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#070A13]/80 border-b border-slate-900/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
                K
              </div>
              <div className="min-w-0">
                <span className="block text-sm xs:text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-white bg-clip-text text-transparent truncate">
                  KALYAN 36 BAZAR
                </span>
                <span className="hidden xs:block text-[9px] font-bold tracking-widest text-amber-500/80 uppercase">
                  Trusted Results & Gaming
                </span>
              </div>
            </div>

            {/* Nav links - Desktop */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#live-results" className="hover:text-amber-400 transition-colors">Live Markets</a>
              <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How It Works</a>
              <a href="#faqs" className="hover:text-amber-400 transition-colors">FAQs</a>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="https://github.com/shravani-agro/kalyan36bazar_frontend/releases/latest/download/kalyan36bazar.apk"
                download
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition-all duration-300 text-xs sm:text-sm active:scale-95"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Download App</span>
                <span className="sm:hidden">App</span>
              </a>

              {/* Mobile Burger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-slate-900 bg-[#070A13] space-y-2 animate-fade-in">
            <a
              href="#live-results"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 rounded-lg transition-colors"
            >
              Live Markets
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 rounded-lg transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 rounded-lg transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 rounded-lg transition-colors"
            >
              FAQs
            </a>
          </div>
        )}
      </nav>

      {/* Main Semantic Landmarks */}
      <main id="main-content">
        {/* Hero Section */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Block - Sales Copy & Call to Action */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Live Matka Results & Secure Bidding Platform
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                India's Most Trusted{" "}
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  Matka Gaming
                </span>{" "}
                Platform
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0">
                Get ultra-fast declared results, high win multipliers up to 900x, and secure digital transaction infrastructure directly on your Android phone. Play Kalyan, Kalyan, Main Bazar, and more securely!
              </p>

              {/* Badges Row - Optimized for small device responsiveness */}
              <div className="grid grid-cols-3 gap-1.5 xs:gap-3 max-w-md mx-auto lg:mx-0 text-left pt-2">
                <div className="border border-slate-900 bg-slate-950/40 p-2 sm:p-3 rounded-lg sm:rounded-xl flex flex-col gap-0.5 sm:gap-1">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fastest Pay</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-0.5 sm:gap-1">
                    <Zap className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-amber-500 shrink-0" /> 2 Min
                  </span>
                </div>
                <div className="border border-slate-900 bg-slate-950/40 p-2 sm:p-3 rounded-lg sm:rounded-xl flex flex-col gap-0.5 sm:gap-1">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Payout Ratio</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-0.5 sm:gap-1">
                    <Trophy className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-amber-500 shrink-0" /> 900x
                  </span>
                </div>
                <div className="border border-slate-900 bg-slate-950/40 p-2 sm:p-3 rounded-lg sm:rounded-xl flex flex-col gap-0.5 sm:gap-1">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Security</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-0.5 sm:gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-emerald-500 shrink-0" /> Safe
                  </span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="https://github.com/shravani-agro/kalyan36bazar_frontend/releases/latest/download/kalyan36bazar.apk"
                  download
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/10 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  <Download className="h-5 w-5" />
                  Download Android APK
                </a>
                <a
                  href="#live-results"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-base font-semibold"
                >
                  Explore Live Markets
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {/* Extra trust elements - optimized to wrap cleanly on mobile screens */}
              <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5 px-4 sm:px-0">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Latest Version: <b>v2.8.4</b></span>
                </div>
                <span className="hidden xs:inline text-slate-700">•</span>
                <span>Supported: <b>Android 5.0+</b></span>
                <span className="hidden xs:inline text-slate-700">•</span>
                <span className="text-amber-500 font-semibold">Free Direct Download</span>
              </div>
            </div>

            {/* Right Block - CSS Interactive Phone Mockup */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              {/* Glowing ring behind phone */}
              <div className="absolute -inset-4 rounded-[48px] bg-gradient-to-tr from-amber-500 to-indigo-600 opacity-20 blur-3xl animate-pulse"></div>

              {/* Phone Bezel */}
              <div className="relative mx-auto max-w-[290px] sm:max-w-[325px] border-4 border-slate-800 bg-slate-950 rounded-[42px] p-2.5 shadow-2xl shadow-slate-950/80 ring-1 ring-slate-700/50 hover:scale-[1.01] transition-transform duration-500">

                {/* Top Notch Camera & Speaker */}
                <div className="absolute top-4 left-1/2 z-20 h-4 w-32 -translate-x-1/2 rounded-full bg-slate-850">
                  <div className="absolute left-4 top-1 h-1.5 w-1.5 rounded-full bg-slate-900"></div>
                  <div className="absolute right-4 top-1.5 h-1.5 w-12 rounded-full bg-slate-700/50"></div>
                </div>

                {/* Phone Screen Container */}
                <div className="overflow-hidden rounded-[34px] bg-[#090D17] text-white select-none">

                  {/* Phone Status Bar */}
                  <div className="flex justify-between px-5 pt-4 pb-2 text-[10px] text-slate-400 font-semibold">
                    <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                      <span>5G</span>
                      <div className="h-3 w-5 rounded-sm border border-slate-500 p-0.5"><div className="h-full w-4/5 bg-emerald-500 rounded-2xs"></div></div>
                    </div>
                  </div>

                  {/* Inside App Header */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-amber-400 font-bold text-sm shadow-inner">K</div>
                      <span className="text-xs font-black tracking-wide text-slate-950">KALYAN 36 BAZAR</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-950">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> App Online
                    </div>
                  </div>

                  {/* App Content Area */}
                  <div className="p-3.5 space-y-3.5 h-[360px] overflow-y-auto scrollbar-none">

                    {/* Digital Wallet Card */}
                    <div className="bg-gradient-to-br from-slate-900 via-[#13192B] to-[#0A0D17] border border-slate-800/80 rounded-xl p-3.5 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secure Account</span>
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold">VIP PLAYER</span>
                      </div>
                      <div className="text-xl font-black text-amber-400 tracking-wide">₹84,250.00</div>

                      {/* Tiny Deposit/Withdraw buttons */}
                      <div className="mt-2.5 flex gap-2">
                        <div className="flex-1 bg-emerald-600 text-center py-1.5 rounded-lg text-[9px] font-extrabold shadow shadow-emerald-700/20 transition active:scale-95">Add Points</div>
                        <div className="flex-1 bg-slate-800 text-center py-1.5 rounded-lg text-[9px] font-bold shadow transition active:scale-95">Withdraw</div>
                      </div>
                    </div>

                    {/* Simulated App Market List */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LIVE RESULTS</span>
                        <span className="text-[8px] text-amber-500 animate-pulse font-bold">● AUTO-REFRESHING</span>
                      </div>

                      {processedMarkets.length > 0 ? (
                        processedMarkets.slice(0, 2).map((market) => (
                          <div key={market.id} className="bg-[#121626] border border-slate-800/70 rounded-xl p-3 flex justify-between items-center transition-all duration-300">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-black text-white uppercase truncate pr-2">{market.market_name}</div>
                              <div className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5">Open: {market.open_time}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-extrabold text-amber-400 tracking-wider font-mono">{market.result}</div>
                              {market.isLive ? (
                                <span className="inline-block text-[7px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.2 rounded mt-1 border border-emerald-500/20 uppercase">ACTIVE</span>
                              ) : (
                                <span className="inline-block text-[7px] bg-slate-850 text-slate-500 font-bold px-1.5 py-0.2 rounded mt-1 border border-slate-800 uppercase">CLOSED</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : loading ? (
                        // Loading skeleton inside phone mockup
                        <>
                          <div className="bg-[#121626]/50 border border-slate-800/40 rounded-xl p-3 flex justify-between items-center animate-pulse">
                            <div className="space-y-2">
                              <div className="h-2.5 w-16 bg-slate-800 rounded"></div>
                              <div className="h-2 w-24 bg-slate-850 rounded"></div>
                            </div>
                            <div className="text-right space-y-1.5 flex flex-col items-end">
                              <div className="h-3 w-12 bg-slate-800 rounded"></div>
                              <div className="h-2 w-8 bg-slate-850 rounded"></div>
                            </div>
                          </div>
                          <div className="bg-[#121626]/50 border border-slate-800/40 rounded-xl p-3 flex justify-between items-center animate-pulse">
                            <div className="space-y-2">
                              <div className="h-2.5 w-20 bg-slate-800 rounded"></div>
                              <div className="h-2 w-20 bg-slate-850 rounded"></div>
                            </div>
                            <div className="text-right space-y-1.5 flex flex-col items-end">
                              <div className="h-3 w-10 bg-slate-800 rounded"></div>
                              <div className="h-2 w-8 bg-slate-850 rounded"></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Empty state inside phone mockup
                        <div className="bg-[#121626]/30 border border-slate-800/40 rounded-xl p-4 text-center">
                          <div className="text-[10px] text-slate-500 font-bold">No active markets configured</div>
                        </div>
                      )}
                    </div>

                    {/* Bid types in app */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">POPULAR GAMES</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-center flex flex-col items-center justify-center">
                          <span className="text-base">🔢</span>
                          <span className="text-[8px] font-extrabold mt-1 text-slate-200">Single Digit</span>
                          <span className="text-[7px] text-amber-500 mt-0.5 font-bold">10x Win</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-center flex flex-col items-center justify-center">
                          <span className="text-base">🃏</span>
                          <span className="text-[8px] font-extrabold mt-1 text-slate-200">Single Pana</span>
                          <span className="text-[7px] text-amber-500 mt-0.5 font-bold">150x Win</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-center flex flex-col items-center justify-center">
                          <span className="text-base">👑</span>
                          <span className="text-[8px] font-extrabold mt-1 text-slate-200">Double Pana</span>
                          <span className="text-[7px] text-amber-500 mt-0.5 font-bold">300x Win</span>
                        </div>
                      </div>
                    </div>

                    {/* Realtime Win Notification inside app mockup */}
                    <div className="bg-gradient-to-r from-emerald-950/40 to-[#121626] border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Live Payout Notification</div>
                        <div className="text-[9px] font-extrabold text-emerald-400 truncate">Rakesh M. received ₹75,000 via UPI!</div>
                      </div>
                    </div>

                  </div>

                  {/* Inside App Bottom Bar */}
                  <div className="bg-slate-950 border-t border-slate-900 px-4 py-2.5 flex justify-around text-slate-500 text-[9px] font-bold">
                    <span className="text-amber-500 flex flex-col items-center gap-0.5 cursor-pointer">
                      <span className="text-xs">🏠</span><span>Home</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-white transition-colors">
                      <span className="text-xs">📈</span><span>Rates</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-white transition-colors">
                      <span className="text-xs">📞</span><span>Help</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-white transition-colors">
                      <span className="text-xs">👤</span><span>Profile</span>
                    </span>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </header>

        {/* Live Results Display Section */}
        <section id="live-results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-[#090C17]/40 border-y border-slate-900/60 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.02),transparent_60%)] pointer-events-none" />

          <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Live Market Results Board
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Get 100% accurate, live declared results for all major Satta Matka markets instantly. Check history and trends seamlessly.
            </p>

            {/* Search bar & Live clock panel */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-900 backdrop-blur-md max-w-2xl mx-auto mt-6">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="market-search"
                  type="text"
                  placeholder="Search market name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search Live Satta Matka Markets"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-amber-500 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-400">
                <Clock className="h-4.5 w-4.5 text-amber-500 animate-spin-slow" />
                <span>Current Time:</span>
                <span className="text-amber-400 font-mono tracking-wider">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic / Fallback grid of results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-400">Fetching live results board...</p>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl max-w-xl mx-auto backdrop-blur-md bg-slate-950/20">
              <p className="text-slate-400 font-bold mb-2">
                {searchQuery ? "No matching markets found" : "No live Satta Matka markets are currently active"}
              </p>
              <p className="text-xs text-slate-500">
                {searchQuery ? "Try searching for other keywords." : "Please check back later or refresh the page."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map((market) => (
                <div
                  key={market.id}
                  className="group relative border border-slate-900 bg-slate-950/80 rounded-2xl p-5 shadow-xl hover:border-slate-800 transition-all duration-300 flex flex-col justify-between hover:shadow-slate-950/50"
                >
                  {/* Highlight line on hover */}
                  <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500 transition-all duration-500" />

                  {/* Card Top Details */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors tracking-wide uppercase">
                          {market.market_name}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                          {market.type} Market
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 items-end">
                        {market.isLive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-wide border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] bg-slate-900 text-slate-500 font-bold uppercase tracking-wide border border-slate-800">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Market Timing Information */}
                    <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-900 py-3 mb-5 text-[11px] font-semibold text-slate-400">
                      <div>
                        <span className="block text-[9px] text-slate-600 uppercase font-extrabold tracking-wider">Open Timing</span>
                        <span className="text-slate-300 font-mono">{market.open_time}</span>
                      </div>
                      <div className="border-l border-slate-900 pl-4">
                        <span className="block text-[9px] text-slate-600 uppercase font-extrabold tracking-wider">Close Timing</span>
                        <span className="text-slate-300 font-mono">{market.close_time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Declared Result Board */}
                  <div>
                    <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3.5 text-center shadow-inner group-hover:border-slate-800/80 transition-colors">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Last Declared Result</span>
                      <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-widest font-mono">
                        {market.result}
                      </div>
                    </div>

                    {/* Action inside card */}
                    <a
                      href="https://github.com/shravani-agro/kalyan36bazar_frontend/releases/latest/download/kalyan36bazar.apk"
                      download
                      className="w-full mt-4 py-2 px-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-transparent transition-all duration-300 active:scale-98"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Play this Market Now</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

        {/* Why Choose Us Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/10 bg-amber-500/5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              Premium Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Why Choose Kalyan 36 Bazar App?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              We provide a premium, modern, secure digital platform designed to offer the absolute best gaming experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Card 1 */}
            <div className="border border-slate-900 bg-slate-950/60 rounded-2xl p-6 shadow-xl hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 bg-amber-500/10 rounded-br-2xl flex items-center justify-center border-r border-b border-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Zap className="h-5 w-5 text-amber-500 group-hover:text-slate-950" />
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-lg font-black text-white">Ultra-Fast Payouts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Winnings are credited to your bank account or UPI within 2 minutes of requesting. Safe, automated, and hassle-free deposits and withdrawals.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="border border-slate-900 bg-slate-950/60 rounded-2xl p-6 shadow-xl hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 bg-blue-500/10 rounded-br-2xl flex items-center justify-center border-r border-b border-slate-900 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
                <ShieldCheck className="h-5 w-5 text-blue-400 group-hover:text-slate-950" />
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-lg font-black text-white">100% Secure & Private</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your credentials, gaming history, and payment details are shielded by institutional-grade cybersecurity encryption algorithms.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="border border-slate-900 bg-slate-950/60 rounded-2xl p-6 shadow-xl hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 bg-amber-500/10 rounded-br-2xl flex items-center justify-center border-r border-b border-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Trophy className="h-5 w-5 text-amber-500 group-hover:text-slate-950" />
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-lg font-black text-white">Best Game Multipliers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enjoy the highest profit margin multipliers in Satta Matka. Get up to 900x payout rates on Pana bid choices, maximizing your predictions.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="border border-slate-900 bg-slate-950/60 rounded-2xl p-6 shadow-xl hover:border-slate-800 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 bg-emerald-500/10 rounded-br-2xl flex items-center justify-center border-r border-b border-slate-900 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <PhoneCall className="h-5 w-5 text-emerald-400 group-hover:text-slate-950" />
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-lg font-black text-white">24/7 Hot WhatsApp Help</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our support team is live round-the-clock. Resolve wallet deposits, app questions, and operational requests instantly via chat.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-[#090C17]/40 border-t border-b border-slate-900/60 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.02),transparent_70%)] pointer-events-none" />

          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/10 bg-indigo-500/5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Process Timeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Get Started in 4 Quick Steps
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Download our application, create your safe profile, fund your secure wallet, and you're ready to win!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">

            {/* Step 1 */}
            <div className="relative space-y-4 text-center md:text-left group">
              <div className="mx-auto md:mx-0 w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-amber-400 text-lg group-hover:border-amber-500 transition-colors shadow-lg">
                01
              </div>
              <h3 className="text-lg font-black text-white">Download APK</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click the "Download Android APK" button to save our secure, officially scanned app binary files to your phone.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-4 text-center md:text-left group">
              <div className="mx-auto md:mx-0 w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-amber-400 text-lg group-hover:border-amber-500 transition-colors shadow-lg">
                02
              </div>
              <h3 className="text-lg font-black text-white">Create Account</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open the downloaded APK and register with your mobile phone number. Set a secret security password.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-4 text-center md:text-left group">
              <div className="mx-auto md:mx-0 w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-amber-400 text-lg group-hover:border-amber-500 transition-colors shadow-lg">
                03
              </div>
              <h3 className="text-lg font-black text-white">Deposit Wallet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Top up your credits in seconds using modern UPI channels. Start playing with as low as ₹100 securely.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-4 text-center md:text-left group">
              <div className="mx-auto md:mx-0 w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-amber-400 text-lg group-hover:border-amber-500 transition-colors shadow-lg">
                04
              </div>
              <h3 className="text-lg font-black text-white">Win & Withdraw</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Place bid selections on your preferred markets. Request immediate withdrawal payouts to your bank card/UPI in under 2 minutes.
              </p>
            </div>

          </div>
        </section>

        {/* FAQs Section */}
        <section id="faqs" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/10 bg-amber-500/5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              Common Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Frequently Answered Questions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Everything you need to know about the Kalyan 36 Bazar application, gaming system, and payout security.
            </p>
          </div>

          {/* Custom Interactive Accordion */}
          <div className="space-y-4">
            {[
              {
                q: "How do I download the Kalyan 36 Bazar app?",
                a: "Simply click the 'Download Android APK' button anywhere on our landing page. This will immediately download our official secure app binary package (kalyan36bazar.apk) directly. Ensure your browser is allowed to install applications from 'unknown sources' in your device settings."
              },
              {
                q: "Is playing on Kalyan 36 Bazar safe?",
                a: "Absolutely. Our app integrates robust military-grade data encryption, protecting your profile, transaction logs, and credentials from unauthorized exposure. You have complete control over your private deposits and withdrawal endpoints."
              },
              {
                q: "How fast are withdrawals processed?",
                a: "We offer the fastest automated withdrawals in the industry. Once you place a withdrawal request via UPI, Google Pay, PhonePe, Paytm, or Bank Transfer, the funds are credited directly to your bank in under 2 minutes!"
              },
              {
                q: "What is the minimum deposit and bid limit?",
                a: "To make the application highly inclusive, you can deposit as low as ₹100. Bid choices on open markets can be placed starting at only ₹5, allowing players to play strategically."
              },
              {
                q: "How do I contact customer support if I face an issue?",
                a: "We offer round-the-clock 24/7 dedicated support via hot WhatsApp chat. You can click support actions on our phone app to launch instant conversations, ensuring immediate troubleshooting."
              }
            ].map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border border-slate-900 bg-slate-950/60 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-800"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-white hover:text-amber-400 transition-colors focus:outline-none"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <Minus className="h-5 w-5 text-amber-500 shrink-0 ml-4" />
                    ) : (
                      <Plus className="h-5 w-5 text-slate-500 shrink-0 ml-4" />
                    )}
                  </button>

                  {/* Accordion body */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-60 border-t border-slate-900" : "max-h-0"
                      }`}
                  >
                    <p className="p-5 text-xs sm:text-sm text-slate-400 leading-relaxed bg-[#0b0f19]/30">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Banner Call-To-Action (Footer Banner) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="relative rounded-3xl bg-gradient-to-r from-amber-600 via-yellow-600 to-indigo-950 p-8 sm:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-amber-500/20">
            <div className="absolute inset-0 bg-slate-950/20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Ready to Win? Download the Official App Now!
              </h3>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                Join millions of players on Kalyan 36 Bazar. Get instant results, ultra-fast 2-minute payouts, and 24/7 hot WhatsApp support. Secure your download today!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0 w-full md:w-auto relative z-10">
              <a
                href="https://github.com/shravani-agro/kalyan36bazar_frontend/releases/latest/download/kalyan36bazar.apk"
                download
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-base shadow-xl transition-all duration-300 border border-slate-800 hover:border-amber-500/60 active:scale-95"
              >
                <Download className="h-5 w-5 text-amber-500" />
                Download APK (66 MB)
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="border-t border-slate-900/80 bg-slate-950/80 pt-16 pb-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

            {/* Column 1 - Brand description */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-lg shadow">
                  K
                </div>
                <span className="text-sm font-black tracking-wider text-white">
                  KALYAN 36 BAZAR
                </span>
              </div>
              <p className="leading-relaxed text-slate-400 max-w-sm">
                Kalyan 36 Bazar is India's leading secure digital results dashboard and gaming platform. Built to offer military-grade transactional security and lighting payout speed.
              </p>

              {/* Disclaimer */}
              <div className="p-3 border border-slate-900/60 rounded-xl bg-slate-900/10 text-[10px] leading-relaxed max-w-sm">
                <span className="text-amber-500 font-extrabold block mb-1">🔞 RESPONSIBILITY NOTICE (18+)</span>
                This application represents an entertainment platform. Users must check regional regulations. Bids are subject to risk. Play responsibly.
              </div>
            </div>

            {/* Column 2 - Links */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><a href="#live-results" className="hover:text-amber-400 transition-colors">Live Markets Board</a></li>
                <li><a href="#features" className="hover:text-amber-400 transition-colors">Premium Features</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">Process Guide</a></li>
                <li><a href="#faqs" className="hover:text-amber-400 transition-colors">Help Accordions</a></li>
              </ul>
            </div>

            {/* Column 3 - Administrative */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm">Operator Entry</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/admin" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    <span>Admin Panel Console</span>
                  </Link>
                </li>
                <li>
                  <Link to="/subadmin" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    <span>Sub-Admin Portal</span>
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/shravani-agro/kalyan36bazar_frontend/releases/latest/download/kalyan36bazar.apk" download className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <Download className="h-3 w-3" />
                    <span>Download App APK</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright line - perfectly wrapped and spaced for mobile viewports */}
          <div className="border-t border-slate-900/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-4 text-center sm:text-left">
            <p className="order-2 sm:order-1 text-slate-600">&copy; {new Date().getFullYear()} Kalyan 36 Bazar. All rights reserved. Serviced via Netlify.</p>
            <div className="order-1 sm:order-2 flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2">
              <a href="#" className="hover:text-slate-300">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300">Terms of Play</a>
              <a href="#" className="hover:text-slate-300">Responsible Gaming</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
