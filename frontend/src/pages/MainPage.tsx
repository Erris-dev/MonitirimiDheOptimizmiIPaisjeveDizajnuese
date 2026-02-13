import React, { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { io } from "socket.io-client";
import api from "../lib/axios";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

/* ======================================================
    ✨ TYPEWRITER COMPONENT
   ====================================================== */
const Typewriter = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    setDisplayedText(""); 
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  return (
    <div 
      ref={scrollRef}
      className="max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200"
    >
      <div className="text-sm text-blue-900 italic leading-relaxed prose prose-blue prose-sm max-w-none">
        <ReactMarkdown>{displayedText}</ReactMarkdown>
      </div>
    </div>
  );
};

/* ======================================================
    1️⃣ VALIDATION SCHEMA
   ====================================================== */
const healthSchema = z.object({
  gender: z.enum(["Male", "Female", "Other"]),
  age: z.coerce.number().min(10).max(100),
  occupation: z.enum(["Software Engineer", "Student", "Doctor", "Teacher", "Entrepreneur", "Other"]),
  sleep_duration: z.coerce.number().min(0).max(24),
  quality_of_sleep: z.coerce.number().min(1).max(10),
  physical_activity_level: z.coerce.number().min(0).max(100),
  stress_level: z.coerce.number().min(1).max(10),
  bmi_category: z.enum(["Underweight", "Normal", "Overweight", "Obese"]),
  blood_pressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format: 120/80"),
  heart_rate: z.coerce.number().min(40).max(200),
  daily_steps: z.coerce.number().min(0),
  sleep_disorder: z.enum(["None", "Insomnia", "Apnea", "Narcolepsy"])
});

type HealthFormData = z.infer<typeof healthSchema>;

const Dashboard: React.FC = () => {
  // --- STATE ---
  const [formData, setFormData] = useState<HealthFormData>({
    gender: "Male", age: 28, occupation: "Software Engineer", sleep_duration: 7,
    quality_of_sleep: 7, physical_activity_level: 50, stress_level: 5,
    bmi_category: "Normal", blood_pressure: "120/80", heart_rate: 70,
    daily_steps: 5000, sleep_disorder: "None"
  });

  const [userProfile, setUserProfile] = useState<any>(null); // Added for widget
  const [errors, setErrors] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false); 
  const [insightData, setInsightData] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 2️⃣ WEBSOCKET LOGIC ---
  useEffect(() => {
    const newSocket = io("http://localhost", {
      withCredentials: true ,
      transports: ["websocket", "polling"]
    });

    newSocket.on("NEW_HEALTH_INSIGHT", (data) => {
      setInsightData(data);
      setIsProcessing(false); 
    });

    return () => { newSocket.close(); };
  }, []);

  // --- 3️⃣ AUTH & PROFILE SYNC ---
  useEffect(() => {
    const syncAuthState = async () => {
      try {
        // This call will include cookies automatically because of withCredentials: true
        const res = await api.get('/auth/me'); 
        console.log(res)
        
        if (res.data.user) {
          setUserProfile(res.data);
        }
        setLoading(false);
      } catch (err) {
        console.log("Session invalid or expired", err);
        localStorage.clear();
        navigate('/login');
      }
    };
    syncAuthState();
  }, [navigate]);

  // --- 4️⃣ HANDLERS ---
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleChange = (key: keyof HealthFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const startAnalysis = async () => {
    const validation = healthSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setIsModalOpen(true);
    setIsProcessing(true);
    setInsightData(null);
    setAiAnalysis(null);

    try {
      await api.post("/ingest/metrics/ingest", validation.data);
    } catch (err) {
      console.error("Ingest failed", err);
      setIsProcessing(false);
    }
  };

  const getAIAdvice = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.get("/analytics/ai/ask");
      setAiAnalysis(res.data.answer);
    } catch (err) {
      console.error("AI Analysis failed", err);
      setAiAnalysis("The AI is currently unavailable. Please try again later.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-emerald-600 text-white p-4 shadow-lg flex justify-between items-center px-6">
        <h1 className="text-xl font-bold tracking-tight">SerenePulse</h1>
        
        {/* --- USER PROFILE WIDGET --- */}
        {userProfile && (
          <div className="flex items-center gap-4 bg-emerald-700/50 p-2 px-4 rounded-xl border border-emerald-500/30">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold opacity-100">{userProfile.user?.email}</p>
              <p className="text-[9px] opacity-80 uppercase tracking-tighter">
                {userProfile.device?.name} • {userProfile.device?.type}
              </p>
              <p className="text-[9px] text-emerald-200 italic">
                Last seen: {userProfile.device?.last_seen ? new Date(userProfile.device.last_seen).toLocaleTimeString() : 'Just now'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white/10 hover:bg-red-500/80 p-2 rounded-lg transition-all active:scale-95"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </header>

      <main className="container mx-auto p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-grow bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Health Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
              <select className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)}>
                <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Age</label>
              <input type="number" className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500" 
                value={formData.age} onChange={(e) => handleChange("age", e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Occupation</label>
              <select className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                value={formData.occupation} onChange={(e) => handleChange("occupation", e.target.value)}>
                {["Software Engineer", "Student", "Doctor", "Teacher", "Entrepreneur", "Other"].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sleep Duration (Hrs)</label>
              <input type="number" step="0.1" className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500" 
                value={formData.sleep_duration} onChange={(e) => handleChange("sleep_duration", e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Quality of Sleep (1-10)</label>
              <input type="number" className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500" 
                value={formData.quality_of_sleep} onChange={(e) => handleChange("quality_of_sleep", e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Activity Level (Min/Day)</label>
              <input type="number" className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500" 
                value={formData.physical_activity_level} onChange={(e) => handleChange("physical_activity_level", e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stress Level (1-10)</label>
              <input type="number" className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500" 
                value={formData.stress_level} onChange={(e) => handleChange("stress_level", e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">BMI Category</label>
              <select className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                value={formData.bmi_category} onChange={(e) => handleChange("bmi_category", e.target.value)}>
                {["Underweight", "Normal", "Overweight", "Obese"].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Blood Pressure (Sys/Dia)</label>
              <input className={`p-2 border rounded-lg outline-none ${errors.blood_pressure ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                placeholder="120/80" value={formData.blood_pressure} onChange={(e) => handleChange("blood_pressure", e.target.value)} />
              {errors.blood_pressure && <span className="text-red-500 text-[10px]">{errors.blood_pressure}</span>}
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Heart Rate (BPM)</label>
              <input type="number" className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500" 
                value={formData.heart_rate} onChange={(e) => handleChange("heart_rate", e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Steps</label>
              <input type="number" className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500" 
                value={formData.daily_steps} onChange={(e) => handleChange("daily_steps", e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sleep Disorder</label>
              <select className="p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                value={formData.sleep_disorder} onChange={(e) => handleChange("sleep_disorder", e.target.value)}>
                {["None", "Insomnia", "Apnea", "Narcolepsy"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={startAnalysis}
            className="w-full mt-10 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95">
            Analyze Health Metrics →
          </button>
        </div>
      </main>

      {/* --- 4️⃣ REAL-TIME POP-OUT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>

            {isProcessing ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="relative h-20 w-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Processing via Kafka...</h3>
                <p className="text-gray-500 text-sm mt-2">Connecting to Analytical Service via WebSockets</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900">Analysis Results</h3>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase animate-pulse">Live</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-5 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Stress Prediction</p>
                    <p className="text-2xl font-black text-emerald-900 capitalize">{insightData?.predictions?.stress || 'Processing...'}</p>
                  </div>
                  <div className="bg-blue-50 p-5 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Health Risk</p>
                    <p className="text-2xl font-black text-blue-900 capitalize">{insightData?.predictions?.health || 'Processing...'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Key Actions</h4>
                  <ul className="space-y-2">
                    {insightData?.recommendations?.stress?.recommendations?.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-gray-600 leading-relaxed flex gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  {!aiAnalysis ? (
                    <button 
                      onClick={getAIAdvice}
                      disabled={isAiLoading}
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:bg-emerald-400"
                    >
                      {isAiLoading ? "Consulting Groq AI..." : "✨ Get AI Insight"}
                    </button>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500 animate-in fade-in duration-500">
                      <p className="text-xs font-bold text-blue-800 uppercase mb-1">AI Recommendation:</p>
                      <Typewriter text={aiAnalysis} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;