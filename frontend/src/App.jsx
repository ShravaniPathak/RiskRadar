import { useState, useMemo } from 'react';
import { api } from './utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Terminal, Loader2, ChevronRight, Activity, TrendingUp, Ghost, Sparkles, ArrowRight } from 'lucide-react';

const TechInput = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col space-y-2 w-full">
    <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
      </div>
      <input
        {...props}
        className="w-full bg-slate-900/40 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono placeholder:text-slate-700"
      />
      <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
    </div>
  </div>
);

// --- THEME MAP: Updated Amber/Orange for Emerging ---
const THEME_MAP = {
  rose: {
    borderHover: "hover:border-rose-500/30",
    barBase: "bg-rose-500/20",
    barHover: "group-hover:bg-rose-500",
  },
  amber: {
    borderHover: "hover:border-amber-500/30",
    barBase: "bg-amber-500/20",
    barHover: "group-hover:bg-amber-500",
  }
};

const SnapshotCard = ({ snapshot, delay, theme = 'rose' }) => {
  const styles = THEME_MAP[theme] || THEME_MAP.rose;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay * 0.08, duration: 0.3 }}
      className={`group bg-slate-900/20 border border-slate-800/50 rounded-3xl overflow-hidden flex flex-col h-[550px] transition-colors duration-300 ${styles.borderHover}`}
      style={{ 
        transform: 'translateZ(0)', 
        backfaceVisibility: 'hidden', 
        willChange: 'opacity, transform' 
      }}
    >
      <div className="p-6 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-3xl font-black text-white">{snapshot.year}</span>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Archive Record</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg text-right">
          <span className="block text-[8px] text-rose-400 font-bold uppercase mb-1">Impact Drop</span>
          <span className="text-rose-500 font-mono text-sm font-bold">
            {snapshot.freq} <span className="text-slate-700 mx-1">→</span> {snapshot.targetFreq}
          </span>
        </div>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
        {snapshot.chunks.map((chunk, cIdx) => (
          <div key={cIdx} className="relative pl-6 py-1">
            <div className={`absolute left-0 top-0 bottom-0 w-[1px] transition-colors duration-300 ${styles.barBase} ${styles.barHover}`} />
            <p className="text-sm text-slate-400 leading-relaxed font-light italic group-hover:text-slate-200 transition-colors">"{chunk}"</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

function App() {
  const [ticker, setTicker] = useState('');
  const [year, setYear] = useState('2023');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [viewMode, setViewMode] = useState('disappearing');

  const disappearingTopics = useMemo(() => {
    if (!result?.disappearing?.data?.analysis) return [];
    const topicMap = {};
    result.disappearing.data.analysis.forEach((yearPair) => {
      if (!Array.isArray(yearPair) || yearPair.length < 2) return;
      const [yearInfo, topicStats] = yearPair;
      topicStats.forEach((stat) => {
        if (!topicMap[stat.topic]) {
          topicMap[stat.topic] = { id: stat.topic, name: stat.name || `Factor ${stat.topic}`, history: [] };
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
        id: topicId,
        type: type,
        freq1: fPrev,
        freq2: fCurr,
        name: `Risk Factor ${topicId}`,
        chunks: relevantChunks,
        year1: parseInt(year) - 1,
        year2: parseInt(year)
      };
    });
  }, [result, year]);

  const activeDataSet = viewMode === 'disappearing' ? disappearingTopics : emergingTopics;

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

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${viewMode === 'disappearing' ? 'bg-indigo-600/10' : 'bg-amber-600/10'}`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <main className="relative z-10 w-full max-w-7xl px-6 py-12 flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {!isSubmitted ? (
            <motion.div 
              key="form" 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl space-y-10"
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
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center space-y-12">
              <div className="relative w-48 h-48">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-t-2 border-r-2 border-cyan-500/40 rounded-full" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute inset-6 border-b-2 border-l-2 border-indigo-500/60 rounded-full" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-12 border-t-2 border-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white w-8 h-8 opacity-20" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-cyan-400 font-mono text-xs tracking-[0.6em] animate-pulse uppercase">Correlating Risk Tensors</h3>
                <p className="text-slate-600 text-[9px] mt-4 font-mono uppercase tracking-widest">Compiling Delta Analysis for {ticker}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="w-full flex flex-col space-y-8"
              style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button onClick={() => {setViewMode('disappearing'); setActiveTopicIndex(0)}} className={`px-5 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${viewMode === 'disappearing' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-slate-900 text-slate-600 border border-slate-800'}`}>
                      <Ghost size={12}/> Disappearing
                    </button>
                    <button onClick={() => {setViewMode('emerging'); setActiveTopicIndex(0)}} className={`px-5 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${viewMode === 'emerging' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-slate-900 text-slate-600 border border-slate-800'}`}>
                      <Sparkles size={12}/> Emerging Risks
                    </button>
                  </div>
                  <h2 className="text-5xl font-black text-white italic tracking-tighter">
                    {ticker} <span className={viewMode === 'disappearing' ? 'text-rose-500' : 'text-amber-500'}>//</span> {year}
                  </h2>
                </div>
                <button onClick={() => setIsSubmitted(false)} className="px-6 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-[10px] text-slate-400 hover:text-white uppercase tracking-widest transition-all">Reset Terminal</button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {activeDataSet.map((topic, idx) => (
                  <button key={topic.id} onClick={() => setActiveTopicIndex(idx)} className={`flex flex-col items-start gap-1 px-6 py-4 rounded-2xl border transition-all min-w-[220px] text-left ${activeTopicIndex === idx ? (viewMode === 'disappearing' ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]') : 'bg-slate-900/30 border-slate-800 text-slate-500'}`}>
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-60">
                      {viewMode === 'emerging' ? (topic.type === 'new' ? 'EMERGING' : 'GROWTH') : `CLUSTER ${topic.id}`}
                    </span>
                    <span className="text-sm font-bold truncate w-full">{topic.name}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-[500px]">
                {viewMode === 'disappearing' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activeDataSet[activeTopicIndex]?.history.map((snapshot, sIdx) => (
                      <SnapshotCard key={`${snapshot.year}-${sIdx}`} snapshot={snapshot} delay={sIdx} theme="rose" />
                    ))}
                  </div>
                ) : (
                  <div className="w-full">
                    {activeDataSet[activeTopicIndex] ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-12 backdrop-blur-xl" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
                        <div className="md:w-1/3 space-y-8">
                           <div className="p-8 bg-amber-500/5 rounded-3xl border border-amber-500/20">
                             <div className="flex items-center gap-3 mb-8 text-amber-400">
                               <TrendingUp size={18}/>
                               <span className="font-mono text-[10px] uppercase font-black tracking-widest">Trend Logic</span>
                             </div>
                             <div className="flex items-center justify-between gap-x-2 bg-black/40 p-6 rounded-2xl border border-slate-800/50">
                               <div className="text-center">
                                 <span className="block text-[10px] text-slate-500 font-mono mb-1">{activeDataSet[activeTopicIndex].year1}</span>
                                 <span className="text-2xl font-mono text-slate-500">{activeDataSet[activeTopicIndex].freq1}</span>
                               </div>
                               <div className="flex flex-col items-center gap-1">
                                 <ArrowRight className="text-amber-500" size={16} />
                                 <span className="text-[8px] font-bold text-amber-500/50 uppercase">Increase</span>
                               </div>
                               <div className="text-center">
                                 <span className="block text-[10px] text-amber-500 font-mono mb-1">{activeDataSet[activeTopicIndex].year2}</span>
                                 <span className="text-2xl font-mono text-amber-400 font-bold">{activeDataSet[activeTopicIndex].freq2}</span>
                               </div>
                             </div>
                             <p className="text-slate-400 text-xs mt-8 leading-relaxed italic opacity-80">
                               This risk vector transitioned from {activeDataSet[activeTopicIndex].freq1} mentions in {activeDataSet[activeTopicIndex].year1} to {activeDataSet[activeTopicIndex].freq2} in {activeDataSet[activeTopicIndex].year2}.
                             </p>
                           </div>
                        </div>

                        <div className="flex-grow space-y-6 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
                           <h3 className="text-amber-400 font-mono text-[10px] tracking-[0.3em] uppercase mb-6 flex items-center gap-2 sticky top-0 bg-transparent backdrop-blur-sm py-2">
                             Semantic Extractions ({activeDataSet[activeTopicIndex].year2})
                           </h3>
                           {activeDataSet[activeTopicIndex].chunks.length > 0 ? activeDataSet[activeTopicIndex].chunks.map((chunk, cIdx) => (
                             <div key={cIdx} className="relative pl-8 py-3 group">
                               <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-500/10 group-hover:bg-amber-500 transition-colors duration-300" />
                               <p className="text-slate-300 text-sm leading-relaxed font-light group-hover:text-white transition-colors duration-300">
                                 "{chunk}"
                               </p>
                             </div>
                           )) : (
                             <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl text-slate-700 font-mono text-[10px] uppercase tracking-widest gap-4">
                               <Activity className="opacity-20" size={24} />
                               Context unavailable for this cluster
                             </div>
                           )}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-20 text-slate-700 font-mono text-[10px] uppercase tracking-[0.4em] italic">No Vector Selected</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
