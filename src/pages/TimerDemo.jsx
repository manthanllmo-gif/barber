import CountdownTimer from '../components/common/CountdownTimer';
import { Link } from 'react-router-dom';

const TimerDemo = () => {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-8 font-inter">
            <div className="max-w-2xl w-full text-center space-y-12">
                <header>
                    <h1 className="text-5xl font-black tracking-tighter text-white mb-4">
                        Premium Countdown Timer
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Step 1: Implementing high-fidelity real-time feedback for the queue system.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center bg-white/5 p-12 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Small</span>
                        <CountdownTimer initialSeconds={60} size="sm" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Medium (Default)</span>
                        <CountdownTimer initialSeconds={300} size="md" />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Large Display</span>
                        <CountdownTimer initialSeconds={900} size="lg" />
                    </div>
                </div>

                <div className="premium-card p-8 bg-blue-600/5 border-blue-500/20">
                    <h3 className="text-xl font-bold text-white mb-2">Why this matters?</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        In a real-world queue system, static "15 min" text creates anxiety. 
                        A ticking countdown provides immediate psychological relief and professional transparency.
                    </p>
                </div>

                <footer>
                    <Link to="/" className="text-blue-400 hover:text-blue-300 font-bold flex items-center justify-center gap-2 transition-colors">
                        <span>←</span> Back to Dashboard
                    </Link>
                </footer>
            </div>
        </div>
    );
};

export default TimerDemo;
