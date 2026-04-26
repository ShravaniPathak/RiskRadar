import { useState, useMemo, useCallback } from 'react';
import { api } from './utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Terminal, Loader2, ChevronRight, Activity, TrendingUp, Ghost, Sparkles, ArrowRight, BarChart3, Info, ArrowUpDown } from 'lucide-react';

const TechInput = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col space-y-2 w-full">
    <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
      </div>
      <input
        {...props}
        className="w-full bg-slate-900/40 border border-slate-800/60 text-white pl-12 pr-4 py-4 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/30 transition-all font-mono placeholder:text-slate-700"
      />
      <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
    </div>
  </div>
);

const THEME_MAP = {
  rose: {
    borderHover: "hover:border-rose-500/20",
    borderActive: "border-rose-500/40",
    barBase: "bg-rose-500/20",
    barHover: "group-hover/item:bg-rose-500 group-hover/item:shadow-[0_0_8px_rgba(244,63,94,0.4)]",
    accent: "text-rose-500",
    bg: "bg-rose-500/10"
  },
  amber: {
    borderHover: "hover:border-amber-500/20",
    borderActive: "border-amber-500/40",
    barBase: "bg-amber-500/20",
    barHover: "group-hover/item:bg-amber-500 group-hover/item:shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    accent: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  violet: {
    borderHover: "hover:border-violet-500/20",
    borderActive: "border-violet-500/40",
    barBase: "bg-violet-500/20",
    barHover: "group-hover/item:bg-violet-500 group-hover/item:shadow-[0_0_8px_rgba(139,92,246,0.4)]",
    accent: "text-violet-500",
    bg: "bg-violet-500/10"
  },
  cyan: {
    borderHover: "hover:border-cyan-500/20",
    borderActive: "border-cyan-500/40",
    barBase: "bg-cyan-500/20",
    barHover: "group-hover/item:bg-cyan-500 group-hover/item:shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    accent: "text-cyan-500",
    bg: "bg-cyan-500/10"
  }
};

const SnapshotCard = ({ snapshot, delay, theme = 'rose' }) => {
  const styles = THEME_MAP[theme] || THEME_MAP.rose;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ delay: delay * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      layout
      className={`bg-slate-900/20 border border-slate-800/40 rounded-3xl overflow-hidden flex flex-col h-[550px] transition-colors duration-300 ${styles.borderHover}`}
    >
      <div className="p-6 bg-slate-950/40 border-b border-slate-800/50 flex justify-between items-center">
        <div>
          <span className="text-3xl font-black text-white">{snapshot.year}</span>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Archive Record</p>
        </div>
        <div className={`${styles.bg} border border-white/5 px-3 py-1 rounded-lg text-right`}>
          <span className={`block text-[8px] ${styles.accent} font-bold uppercase mb-1 font-mono`}>Impact Drop</span>
          <span className={`${styles.accent} font-mono text-sm font-bold`}>
            {snapshot.freq} <span className="text-slate-700 mx-1">→</span> {snapshot.targetFreq}
          </span>
        </div>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
        {snapshot.chunks.map((chunk, cIdx) => (
          <div key={cIdx} className="relative pl-6 py-1 group/item">
            <div className={`absolute left-0 top-0 bottom-0 w-[1px] transition-all duration-300 ${styles.barBase} ${styles.barHover}`} />
            <p className="text-sm text-slate-400 leading-relaxed font-light italic group-hover/item:text-slate-200 transition-colors">"{chunk}"</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

function App() {
  const [ticker, setTicker] = useState('');
  const [year, setYear] = useState('2025');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [viewMode, setViewMode] = useState('disappearing');
  const [sortOrder, setSortOrder] = useState('desc');

  // Helper to fetch the correct name from the results[0] mapping
  const getTopicName = useCallback((id) => {
    const nameMap = result?.disappearing?.data?.topic_id_to_name || {};
    return nameMap[id] || `Vector ${id}`;
  }, [result]);

  // Processes disappearing topics and uses the name mapping
  const disappearingTopics = useMemo(() => {
    if (!result?.disappearing?.data?.analysis) return [];
    const topicMap = {};
    const nameMap = result.disappearing.data.topic_id_to_name || {};

    result.disappearing.data.analysis.forEach((yearPair) => {
      if (!Array.isArray(yearPair) || yearPair.length < 2) return;
      const [yearInfo, topicStats] = yearPair;
      topicStats.forEach((stat) => {
        if (!topicMap[stat.topic]) {
          topicMap[stat.topic] = { 
            id: stat.topic, 
            name: nameMap[stat.topic] || stat.name || `Factor ${stat.topic}`, 
            history: [],
            delta: Math.abs(stat.freq2 - stat.freq1) 
          };
        }
        const chunks = yearInfo.chunks?.filter((_, idx) => yearInfo.topics[idx] === stat.topic) || [];
        topicMap[stat.topic].history.push({ year: yearInfo.year, freq: stat.freq1, targetFreq: stat.freq2, chunks });
      });
    });
    return Object.values(topicMap);
  }, [result]);

  const emergingTopics = useMemo(() => {
    if (!result?.emerging?.data || !result?.disappearing?.data?.target_year) return [];
    const targetData = result.disappearing.data.target_year;
    return result.emerging.data.map(([topicId, fPrev, fCurr, type]) => {
      const relevantChunks = targetData.chunks?.filter((_, idx) => targetData.topics[idx] === topicId) || [];
      return { 
        id: topicId, type, freq1: fPrev, freq2: fCurr, 
        name: getTopicName(topicId), 
        chunks: relevantChunks, 
        year1: parseInt(year) - 1, year2: parseInt(year),
        delta: Math.abs(fCurr - fPrev)
      };
    });
  }, [result, year, getTopicName]);

  const missingTopics = useMemo(() => {
    if (!result?.missing?.data || !result?.disappearing?.data?.target_year) return [];
    const targetData = result.disappearing.data.target_year;
    const rawData = Array.isArray(result.missing.data) ? result.missing.data : [];
    return rawData.filter(item => Array.isArray(item)).map(([topicId, fMarket, fCompany]) => {
      const relevantChunks = targetData.chunks?.filter((_, idx) => targetData.topics[idx] === topicId) || [];
      return { 
        id: topicId, freq1: fMarket, freq2: fCompany, 
        name: getTopicName(topicId), 
        chunks: relevantChunks, 
        year1: "Market", year2: ticker,
        delta: Math.abs(fCompany - fMarket)
      };
    });
  }, [result, ticker, getTopicName]);

  const growthTopics = useMemo(() => {
    if (!result?.growth?.data || !result?.disappearing?.data?.target_year) return [];
    const targetData = result.disappearing.data.target_year;
    return result.growth.data.map(([topicId, fMarket, fCompany]) => {
      const relevantChunks = targetData.chunks?.filter((_, idx) => targetData.topics[idx] === topicId) || [];
      return { 
        id: topicId, freq1: fMarket, freq2: fCompany, 
        name: getTopicName(topicId), 
        chunks: relevantChunks, 
        year1: "Market", year2: ticker,
        delta: Math.abs(fCompany - fMarket)
      };
    });
  }, [result, ticker, getTopicName]);

  const sortedDataSet = useMemo(() => {
    let baseData = [];
    if (viewMode === 'disappearing') baseData = [...disappearingTopics];
    if (viewMode === 'emerging') baseData = [...emergingTopics];
    if (viewMode === 'missing') baseData = [...missingTopics];
    if (viewMode === 'growth') baseData = [...growthTopics];

    return baseData.sort((a, b) => {
      return sortOrder === 'asc' ? a.delta - b.delta : b.delta - a.delta;
    });
  }, [viewMode, sortOrder, disappearingTopics, emergingTopics, missingTopics, growthTopics]);

  const viewMetadata = {
    disappearing: { label: "Historical Fade", desc: "Risk factors present in previous years that have diminished in the current filing.", icon: Ghost, theme: "rose" },
    emerging: { label: "New Momentum", desc: "Risk factors that have significantly increased in frequency compared to the previous fiscal year.", icon: Sparkles, theme: "amber" },
    growth: { label: "Peer Variance", desc: "Company mentions of specific topics versus industry median frequency.", icon: TrendingUp, theme: "cyan" },
    missing: { label: "Industry Gaps", desc: "Standard risks within the peer group notably absent in this filing.", icon: BarChart3, theme: "violet" }
  };

  const startAnalysis = async (e) => {
    e.preventDefault();
    if (!ticker) return;
    setIsSubmitted(true);
    setLoading(true);
    try {
      const data = await api.runAll(ticker, parseInt(year));
      setResult(data);
    } catch (err) {
      alert(err.message);
      setIsSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setActiveTopicIndex(0); 
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${viewMode === 'disappearing' ? 'bg-rose-600/10' : viewMode === 'missing' ? 'bg-violet-600/10' : viewMode === 'growth' ? 'bg-cyan-600/10' : 'bg-amber-600/10'}`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <main className="relative z-10 w-full max-w-7xl px-6 py-12 flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div 
              key="form" 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 1.05, y: -20, filter: "blur(12px)" }} 
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl border border-slate-800/60 p-10 rounded-[2.5rem] shadow-2xl space-y-10"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-inner"><Cpu className="w-8 h-8 text-cyan-400" /></div>
                <h1 className="text-4xl font-black italic tracking-tighter text-white">NEURAL<span className="text-cyan-400">SEC</span></h1>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Temporal Risk Analysis</p>
              </div>
              <form onSubmit={startAnalysis} className="space-y-6">
                <TechInput label="Ticker Symbol" icon={Terminal} placeholder="E.G. NVDA" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
                <TechInput label="Target Year" icon={Activity} type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                <button type="submit" className="group relative w-full overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-600 animate-[gradient_3s_linear_infinite] bg-[length:200%_100%]" />
                  <div className="relative flex items-center justify-center gap-3 bg-slate-950 px-8 py-5 rounded-[11px] group-hover:bg-transparent transition-all">
                    <span className="text-white font-black uppercase tracking-[0.2em] text-sm">Initialize Deep Scan</span>
                    <ChevronRight size={18} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </form>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col items-center space-y-12">
              <div className="relative w-48 h-48">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-t-2 border-r-2 border-cyan-500/40 rounded-full" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute inset-6 border-b-2 border-l-2 border-indigo-500/60 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-white w-8 h-8 opacity-20" /></div>
              </div>
              <div className="text-center">
                <h3 className="text-cyan-400 font-mono text-xs tracking-[0.6em] animate-pulse uppercase">Correlating Risk Tensors</h3>
                <p className="text-slate-600 text-[9px] mt-4 font-mono uppercase tracking-widest">Compiling Delta Analysis for {ticker}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }} className="w-full flex flex-col space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/50 pb-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    {Object.entries(viewMetadata).map(([key, meta]) => {
                      const Icon = meta.icon;
                      const theme = THEME_MAP[meta.theme];
                      return (
                        <button 
                          key={key}
                          onClick={() => {setViewMode(key); setActiveTopicIndex(0)}} 
                          className={`px-5 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${viewMode === key ? `${theme.bg} ${theme.accent} border ${theme.borderActive}` : 'bg-slate-900/50 text-slate-600 border border-slate-800/50'}`}
                        >
                          <Icon size={12}/> {meta.label}
                        </button>
                      );
                    })}
                    <div className="w-[1px] h-4 bg-slate-800/50 mx-2" />
                    <button 
                      onClick={toggleSort}
                      className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-cyan-500/30 transition-all active:scale-95"
                    >
                      <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'text-cyan-400' : 'text-slate-500'} />
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate-400 group-hover:text-cyan-400">
                        Sort: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      </span>
                    </button>
                  </div>
                  <h2 className="text-5xl font-black text-white italic tracking-tighter">
                    {ticker} <span className={THEME_MAP[viewMetadata[viewMode].theme].accent}>//</span> {year}
                  </h2>
                  <div className="flex items-center gap-2 ml-1">
                    <span className="shrink-0"><Info size={13} className={THEME_MAP[viewMetadata[viewMode].theme].accent} /></span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                      {viewMetadata[viewMode].desc}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsSubmitted(false)} className="px-6 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-[10px] text-slate-400 hover:text-white uppercase tracking-widest transition-all">Reset Terminal</button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {sortedDataSet.map((topic, idx) => {
                  const theme = THEME_MAP[viewMetadata[viewMode].theme];
                  return (
                    <button key={topic.id} onClick={() => setActiveTopicIndex(idx)} className={`flex flex-col items-start gap-1 px-6 py-4 rounded-2xl border transition-all min-w-[220px] text-left ${activeTopicIndex === idx ? `${theme.bg} ${theme.borderActive} ${theme.accent} shadow-[0_0_15px_rgba(0,0,0,0.1)]` : 'bg-slate-900/20 border-slate-800/40 text-slate-500 hover:border-slate-700'}`}>
                      <div className="flex justify-between w-full items-center">
                        <span className="text-[9px] font-mono uppercase tracking-widest opacity-60">VECTOR {topic.id}</span>
                        <span className="text-[8px] font-mono opacity-40">Δ {topic.delta.toFixed(2)}</span>
                      </div>
                      <span className="text-sm font-bold truncate w-full">{topic.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="min-h-[600px] relative">
                <AnimatePresence mode="wait">
                  {viewMode === 'disappearing' ? (
                    <motion.div 
                      key={`disappearing-${activeTopicIndex}-${sortOrder}`}
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      {sortedDataSet[activeTopicIndex]?.history.map((snapshot, sIdx) => (
                        <SnapshotCard key={`${snapshot.year}-${sIdx}`} snapshot={snapshot} delay={sIdx} theme="rose" />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key={`detail-${viewMode}-${activeTopicIndex}-${sortOrder}`}
                      initial={{ opacity: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.4 }}
                      className="w-full"
                    >
                      {sortedDataSet[activeTopicIndex] ? (
                        <div className="bg-slate-900/30 border border-slate-800/40 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-12 backdrop-blur-xl">
                          <div className="md:w-1/3 space-y-8">
                             <div className="px-2">
                               <h3 className={`text-2xl font-black mb-1 leading-tight ${THEME_MAP[viewMetadata[viewMode].theme].accent}`}>
                                 {sortedDataSet[activeTopicIndex].name}
                               </h3>
                               <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Primary Factor Mapping</p>
                             </div>

                             <div className={`p-8 rounded-3xl border ${THEME_MAP[viewMetadata[viewMode].theme].bg} border-white/5`}>
                               <div className={`flex items-center gap-3 mb-8 ${THEME_MAP[viewMetadata[viewMode].theme].accent}`}>
                                 <TrendingUp size={18}/>
                                 <span className="font-mono text-[10px] uppercase font-black tracking-widest">Logic Delta</span>
                               </div>
                               <div className="flex items-center justify-between gap-x-2 bg-black/20 p-6 rounded-2xl border border-slate-800/40">
                                 <div className="text-center">
                                   <span className="block text-[10px] text-slate-500 font-mono mb-1 leading-none">{sortedDataSet[activeTopicIndex].year1}</span>
                                   <span className="text-2xl font-mono text-slate-500">{sortedDataSet[activeTopicIndex].freq1}</span>
                                 </div>
                                 <div className="flex flex-col items-center gap-1">
                                   <ArrowRight className={THEME_MAP[viewMetadata[viewMode].theme].accent} size={16} />
                                   <span className={`text-[8px] font-bold uppercase opacity-50`}>Rel</span>
                                 </div>
                                 <div className="text-center">
                                   <span className={`block text-[10px] font-mono mb-1 leading-none ${THEME_MAP[viewMetadata[viewMode].theme].accent}`}>{sortedDataSet[activeTopicIndex].year2}</span>
                                   <span className={`text-2xl font-mono font-bold ${THEME_MAP[viewMetadata[viewMode].theme].accent}`}>{sortedDataSet[activeTopicIndex].freq2}</span>
                                 </div>
                               </div>
                               <p className="text-slate-400 text-[11px] mt-8 leading-relaxed italic opacity-80 font-mono uppercase tracking-tight">
                                 {viewMode === 'missing' || viewMode === 'growth'
                                   ? `Industrial benchmarking reveals a modal frequency of ${sortedDataSet[activeTopicIndex].freq1} Mentions versus ${ticker}'s ${sortedDataSet[activeTopicIndex].freq2} observed instances.`
                                   : `Temporal analysis indicates a shift from ${sortedDataSet[activeTopicIndex].freq1} mentions in ${sortedDataSet[activeTopicIndex].year1} to ${sortedDataSet[activeTopicIndex].freq2} in ${sortedDataSet[activeTopicIndex].year2}.`}
                               </p>
                             </div>
                          </div>
                          <div className="flex-grow flex flex-col max-h-[500px]">
                             <div className="overflow-y-auto pr-6 custom-scrollbar flex-grow">
                               <div className="space-y-4 pb-8">
                                {sortedDataSet[activeTopicIndex].chunks.length > 0 ? sortedDataSet[activeTopicIndex].chunks.map((chunk, cIdx) => (
                                  <motion.div 
                                    initial={{ opacity: 0, x: 10 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    transition={{ delay: cIdx * 0.05 }}
                                    key={cIdx} 
                                    className="relative pl-8 py-3 group/item"
                                  >
                                    <div className={`absolute left-0 top-0 bottom-0 w-[1px] transition-all duration-300 ${THEME_MAP[viewMetadata[viewMode].theme].barBase} ${THEME_MAP[viewMetadata[viewMode].theme].barHover}`} />
                                    <p className="text-slate-300 text-sm leading-relaxed font-light group-hover/item:text-white transition-colors">"{chunk}"</p>
                                  </motion.div>
                                )) : (
                                  <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-800/40 rounded-3xl text-slate-700 font-mono text-[10px] uppercase tracking-widest gap-4">
                                    <Activity className="opacity-20" size={24} /> Semantic context absent in target filing
                                  </div>
                                )}
                               </div>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 text-slate-700 font-mono text-[10px] uppercase tracking-[0.4em] italic">No Vector Selected</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
