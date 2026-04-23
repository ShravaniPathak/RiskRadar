import { useState, useMemo } from 'react';
import { api } from './utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Terminal, Zap, Loader2, ChevronRight, BarChart3, Activity } from 'lucide-react';

/** * CUSTOM UI COMPONENT: TechInput
 **/
const TechInput = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col space-y-2 w-full">
    <label className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold ml-1">
      {label}
    </label>
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

function App() {
  const [ticker, setTicker] = useState('');
  const [year, setYear] = useState('2023');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  /**
   * DATA TRANSFORMATION
   * Converts the year-by-year schema into a Topic-centric "Story"
   **/
  const structuredTopics = useMemo(() => {
    if (!result || !result.disappearing?.data?.analysis) return [];

    const topicMap = {};
    const analysisArray = result.disappearing.data.analysis;

    analysisArray.forEach((yearPair) => {
      // Basic check: each entry in 'analysis' should have [YearDataObj, StatsArray]
      if (!Array.isArray(yearPair) || yearPair.length < 2) return;
      
      const yearInfo = yearPair[0]; 
      const topicStats = yearPair[1];

      topicStats.forEach((stat) => {
        if (!topicMap[stat.topic]) {
          topicMap[stat.topic] = {
            id: stat.topic,
            name: stat.name || `Factor ${stat.topic}`,
            history: []
          };
        }

        // Match chunks to topics using index correspondence
        // yearInfo.topics[i] matches yearInfo.chunks[i]
        const relevantChunks = yearInfo.chunks?.filter((_, idx) => yearInfo.topics[idx] === stat.topic) || [];

        topicMap[stat.topic].history.push({
          year: yearInfo.year,
          freq: stat.freq1,
          targetFreq: stat.freq2,
          chunks: relevantChunks
        });
      });
    });

    return Object.values(topicMap);
  }, [result]);

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
      
      {/* BACKGROUND AESTHETICS */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <main className="relative z-10 w-full max-w-7xl px-6 py-12 flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            /* INITIAL INPUT FORM */
            <motion.div
              key="search-form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 100, filter: "blur(10px)", transition: { duration: 0.5 } }}
              className="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl space-y-10"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-inner">
                  <Cpu className="w-8 h-8 text-cyan-400" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tighter text-white">
                  NEURAL<span className="text-cyan-400">SEC</span>
                </h1>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Temporal Risk Analysis</p>
              </div>

              <form onSubmit={startAnalysis} className="space-y-6">
                <TechInput 
                  label="Ticker Symbol"
                  icon={Terminal}
                  placeholder="E.G. NVDA"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                />
                <TechInput 
                  label="Target Comparison Year"
                  icon={Activity}
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-cyan-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-600 animate-[gradient_3s_linear_infinite] bg-[length:200%_100%]" />
                  <div className="relative flex items-center justify-center gap-3 bg-slate-950 px-8 py-5 rounded-[11px] transition-all group-hover:bg-transparent">
                    <span className="text-white font-black uppercase tracking-[0.2em] text-sm">Initialize Deep Scan</span>
                    <ChevronRight size={18} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </form>
            </motion.div>
          ) : loading ? (
            /* LOADING STATE */
            <motion.div
              key="loading-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center space-y-10"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-40 h-40 border-t-2 border-r-2 border-cyan-500 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-b-2 border-l-2 border-indigo-500 rounded-full opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white w-10 h-10" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-cyan-400 font-mono text-sm tracking-[0.5em] animate-pulse">DECRYPTING BERT-TOPIC VECTORS</h3>
                <p className="text-slate-600 text-[10px] uppercase mt-2 tracking-widest italic font-mono">Comparing Year {year} vs Historical Filings</p>
              </div>
            </motion.div>
          ) : (
            /* RESULTS DASHBOARD */
            <motion.div
              key="results-display"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full flex flex-col space-y-8"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-cyan-500">
                    <BarChart3 size={20} />
                    <span className="font-mono text-xs tracking-[0.4em] uppercase">Intelligence Report</span>
                  </div>
                  <h2 className="text-5xl font-black text-white italic tracking-tighter">
                    {ticker} <span className="text-slate-700">/</span> {year}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="self-start md:self-auto px-6 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-[10px] text-slate-400 hover:text-white hover:border-cyan-500 transition-all uppercase tracking-widest"
                >
                  Restart Terminal
                </button>
              </div>

              {/* Topic Navigation */}
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                {structuredTopics.map((topic, idx) => (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopicIndex(idx)}
                    className={`flex flex-col items-start gap-1 px-6 py-4 rounded-2xl border transition-all min-w-[200px] text-left ${
                      activeTopicIndex === idx 
                      ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_25px_rgba(34,211,238,0.15)]" 
                      : "bg-slate-900/30 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span className={`text-[9px] font-mono uppercase tracking-widest ${activeTopicIndex === idx ? 'text-cyan-400' : 'text-slate-600'}`}>
                      Topic Cluster {topic.id}
                    </span>
                    <span className={`text-sm font-bold truncate w-full ${activeTopicIndex === idx ? 'text-white' : 'text-slate-400'}`}>
                      {topic.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Story Timeline */}
              {structuredTopics[activeTopicIndex] && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                  {structuredTopics[activeTopicIndex].history.map((snapshot, sIdx) => (
                    <motion.div
                      key={snapshot.year}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sIdx * 0.1 }}
                      className="group bg-slate-900/20 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden flex flex-col h-[550px] hover:border-cyan-500/30 transition-colors shadow-2xl"
                    >
                      {/* Year Indicator Header */}
                      <div className="p-6 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-3xl font-black text-white">{snapshot.year}</span>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Archived Filing</p>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg text-right">
                          <span className="block text-[8px] text-rose-400 font-bold uppercase mb-1">Impact Drop</span>
                          <span className="text-rose-500 font-mono text-sm font-bold">
                            {snapshot.freq} <span className="text-slate-700 mx-1">→</span> {snapshot.targetFreq}
                          </span>
                        </div>
                      </div>

                      {/* Content Area - Semantic Chunks */}
                      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
                        {snapshot.chunks.length > 0 ? snapshot.chunks.map((chunk, cIdx) => (
                          <div key={cIdx} className="relative pl-6">
                            <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-indigo-500/20 group-hover:bg-cyan-500 transition-colors" />
                            <p className="text-sm text-slate-400 leading-relaxed font-light group-hover:text-slate-200 transition-colors italic">
                              "{chunk}"
                            </p>
                          </div>
                        )) : (
                          <div className="h-full flex items-center justify-center text-slate-700 font-mono text-xs uppercase tracking-widest">
                            No matching chunks found
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-black/20 border-t border-slate-800/50 flex justify-between items-center px-6">
                        <span className="text-[10px] text-slate-600 font-mono italic">Item 1A // Risk Disclosure</span>
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_cyan]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
