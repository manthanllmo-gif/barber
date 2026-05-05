import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Pitch = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0f172a] text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-[#0f172a] z-10" />
          {/* Background image placeholder - will be replaced by generated asset path in final tweak or used as CSS background */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        </div>
        
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider uppercase bg-indigo-600 rounded-full"
          >
            The Future of Barbering
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold font-outfit mb-8 leading-tight"
          >
            Stop Paying to <span className="text-indigo-400">Lose</span> Customers.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto font-inter"
          >
            Every "How long is the wait?" kills a barber's focus. Every walk-out is money lost. 
            TrimTime turns chaos into a premium, digital experience.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a href="#problem" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all transform hover:scale-105 inline-block">
              See the Solution
            </a>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-12">
          <motion.div {...fadeInUp} className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black font-outfit mb-8" style={{ color: '#000000' }}>
              The "Invisible" Loss in Your Shop
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-rose-50 rounded-[32px] border-l-8 border-rose-500 shadow-sm">
                  <h4 className="font-black text-black text-lg mb-2" style={{ color: '#000000' }}>01. The Silent Revenue Leak</h4>
                  <p className="text-rose-900 text-sm leading-relaxed">
                    A potential customer peaks through your window. They see 5 people waiting. Without a clear wait time, they assume the worst and walk away. 
                    <strong className="text-black font-black underline decoration-rose-500/30"> You just lost a ₹500 cut without even knowing it.</strong>
                  </p>
                </div>

                <div className="p-6 bg-amber-50 rounded-[32px] border-l-8 border-amber-500 shadow-sm">
                  <h4 className="font-black text-black text-lg mb-2" style={{ color: '#000000' }}>02. Fragmented Focus</h4>
                  <p className="text-amber-900 text-sm leading-relaxed">
                    Every time a barber stops a fade to answer "How much longer?", they lose their flow. This "Focus Tax" adds up to 2 lost service slots per barber, every single day.
                  </p>
                </div>

                <div className="p-6 bg-slate-100 rounded-[32px] border-l-8 border-slate-400 shadow-sm">
                  <h4 className="font-black text-black text-lg mb-2" style={{ color: '#000000' }}>03. Brand Erosion</h4>
                  <p className="text-slate-900 text-sm leading-relaxed">
                    Impatient customers in a cramped waiting room create a stressful vibe. Without digital transparency, you look like a "shop from the past" rather than the elite destination you are.
                  </p>
                </div>

                <div className="p-6 bg-orange-50 rounded-[32px] border-l-8 border-orange-500 shadow-sm">
                  <h4 className="font-black text-black text-lg mb-2" style={{ color: '#000000' }}>04. The No-Show Nightmare</h4>
                  <p className="text-orange-900 text-sm leading-relaxed">
                    Manual lists are useless once a customer walks out for coffee and forgets to return. You're left with an empty chair and a hole in your daily revenue.
                  </p>
                </div>

                <div className="p-6 bg-blue-50 rounded-[32px] border-l-8 border-blue-500 shadow-sm">
                  <h4 className="font-black text-black text-lg mb-2" style={{ color: '#000000' }}>05. Data Blindness</h4>
                  <p className="text-blue-900 text-sm leading-relaxed">
                    You know you're busy, but do you know why? Without digital tracking, you're guessing at your most profitable days and underperforming services.
                  </p>
                </div>

                <div className="p-6 bg-emerald-50 rounded-[32px] border-l-8 border-emerald-500 shadow-sm">
                  <h4 className="font-black text-black text-lg mb-2" style={{ color: '#000000' }}>06. Staff Burnout</h4>
                  <p className="text-emerald-900 text-sm leading-relaxed">
                    Unmanaged crowds and repetitive customer questions create a high-pressure environment that drains your best barbers and increases turnover.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white sticky top-24"
              >
                <img 
                  src="/assets/pitch/chaos.png" 
                  alt="Chaotic Barber Shop" 
                  className="w-full h-auto grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Comparison Section */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <span className="text-indigo-600 uppercase tracking-widest font-black text-sm mb-4 block">The Transformation</span>
            <h2 className="text-4xl md:text-6xl font-black font-outfit mb-6" style={{ color: '#000000' }}>Old Chaos vs. New Clarity</h2>
            <p className="text-xl text-slate-900 font-medium max-w-2xl mx-auto">See exactly how TrimTime redefines every touchpoint of your barber shop operations.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                label: "Queue Entry", 
                old: "Messy clipboards & shouting names.", 
                new: "One-tap digital entry on any device.",
                icon: "📝"
              },
              { 
                label: "Waiting", 
                old: "Customers tethered to shop chairs.", 
                new: "Freedom to roam & track live.",
                icon: "☕"
              },
              { 
                label: "Communication", 
                old: "Manual shouting or phone calls.", 
                new: "Automated real-time notifications.",
                icon: "📱"
              },
              { 
                label: "Wait Times", 
                old: "Vague, stressful guesses.", 
                new: "Live, data-driven countdowns.",
                icon: "⏱️"
              },
              { 
                label: "Grace Period", 
                old: "Lose spot if away for 2 minutes.", 
                new: "30-min window to rejoin.",
                icon: "🔄"
              },
              { 
                label: "Barber Focus", 
                old: "Interrupted by constant questions.", 
                new: "Pure focus on the craft.",
                icon: "✂️"
              },
              { 
                label: "Revenue", 
                old: "Manual tallying in notebooks.", 
                new: "Live financial analytics.",
                icon: "💰"
              },
              { 
                label: "Inventory", 
                old: "Random shelf stock guessing.", 
                new: "Unified digital menu & stock.",
                icon: "📦"
              },
              { 
                label: "Brand Image", 
                old: "Shop from the past.", 
                new: "Elite tech-enabled destination.",
                icon: "⭐"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="text-4xl mb-6 bg-slate-50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h4 className="text-xl font-black mb-6" style={{ color: '#000000' }}>{item.label}</h4>
                
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 rounded-2xl border-l-4 border-rose-500">
                    <span className="text-[10px] font-black uppercase text-rose-600 block mb-1">Old Way</span>
                    <p className="text-rose-900 text-sm italic">"{item.old}"</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border-l-4 border-emerald-500">
                    <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">TrimTime Way</span>
                    <p className="text-emerald-900 text-sm font-bold">{item.new}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 bg-indigo-600 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-4">
            <span className="text-indigo-200 uppercase tracking-widest font-bold text-sm">The Solution</span>
          </motion.div>
          <div className="text-center mb-20">
            <motion.h2 
              {...fadeInUp}
              className="text-4xl md:text-6xl font-bold font-outfit mb-6"
            >
              Simplicity Meets Technology.
            </motion.h2>
            <motion.p 
              {...fadeInUp}
              className="text-xl md:text-2xl text-white max-w-3xl mx-auto"
            >
              TrimTime isn't just software; it's your shop's digital heartbeat. 
              Organized, transparent, and built for barbers.
            </motion.p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { 
                title: "Digital Tokens, Zero Friction", 
                desc: "Replace 'who's next?' chaos with a fair, automated sequence. Customers know their place, and you know your flow.",
                icon: "🎟️",
                impact: "Removes verbal arguments and confusion at the door."
              },
              { 
                title: "Instant Recall, No Distractions", 
                desc: "Notify the next customer with a single tap from your dashboard. Keep your barbers focused on the cut, not the waiting room.",
                icon: "⚡",
                impact: "Increases revenue per chair by reducing idle time between cuts."
              },
              { 
                title: "Live Heartbeat, Total Trust", 
                desc: "Your wait times update automatically across all devices. Total transparency shows customers you value every second of their time.",
                icon: "⏱️",
                impact: "Turns impatient walk-ins into loyal, patient clients."
              },
              { 
                title: "Auto-Wait Estimator", 
                desc: "Smart algorithms learn your shop's pace and provide ultra-accurate wait-time estimates for every token.",
                icon: "🧠",
                impact: "Gives customers the confidence to wait without second-guessing."
              },
              { 
                title: "Secure & Privacy-First", 
                desc: "Elite security standards protect your customer data. No data selling, no tracking—just pure business utility.",
                icon: "🛡️",
                impact: "Builds long-term trust with your high-value clientele."
              },
              { 
                title: "Zero-Hardware Deployment", 
                desc: "Works on any smart TV, tablet, or phone. No expensive proprietary machines to buy—just log in and lead.",
                icon: "📺",
                impact: "Eliminates high upfront costs and complicated installations."
              },
              { 
                title: "Smart Booking Buffer", 
                desc: "Advanced logic that automatically adds buffer time between large services to prevent staff burnout.",
                icon: "⏳",
                impact: "Keeps the shop rhythm smooth even during complex service days."
              },
              { 
                title: "Digital Check-In Kiosk", 
                desc: "Turn any spare tablet into a premium self-service kiosk. Let walk-ins join the queue without talking to anyone.",
                icon: "📟",
                impact: "Reduces front-desk workload and modernizes your entrance."
              },
              { 
                title: "Barber Performance Insights", 
                desc: "Track which barbers are your fastest finishers and who brings in the most repeat regulars.",
                icon: "📊",
                impact: "Enables data-driven bonuses and better staff scheduling."
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="bg-white/10 backdrop-blur-lg p-8 rounded-[40px] border border-white/20 hover:bg-white/20 transition-all cursor-default flex flex-col h-full"
              >
                <div className="text-5xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-black mb-4 font-outfit" style={{ color: '#000000' }}>{item.title}</h3>
                <p className="text-white leading-relaxed font-inter mb-6 text-sm flex-grow">{item.desc}</p>
                <div className="pt-4 border-t border-white/10 text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  <span className="text-white">IMPACT:</span> {item.impact}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Owner Dashboard Showcase */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="rounded-3xl overflow-hidden shadow-2xl bg-slate-900 p-2"
          >
             <img 
              src="/assets/pitch/dashboard.png" 
              alt="TrimTime Dashboard" 
              className="w-full h-auto rounded-2xl"
            />
          </motion.div>
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-black font-outfit mb-6" style={{ color: '#000000' }}>
              Total Control, <span className="text-indigo-600 underline">Simplified.</span>
            </h2>
            <div className="space-y-6 text-lg text-slate-900 font-inter">
              <p>
                Our dashboard gives you a 30,000-foot view of your business while keeping the day-to-day operations seamless.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {[
                  { title: "Smart Local Discovery", desc: "Your shop becomes visible to thousands of nearby customers searching for their next elite cut." },
                  { title: "Inventory & Service Menu", desc: "Manage your premium products and custom services in one unified, digital storefront." },
                  { title: "Revenue & Performance Tracking", desc: "See your top barbers and track daily earnings automatically—no more manual tallying." },
                  { title: "Customer Loyalty Database", desc: "Build a digital book of your regulars. See their favorite services and visit history instantly." },
                  { title: "Multi-Shop Management", desc: "Scaling? Control multiple locations from one master account with unified revenue reporting." },
                  { title: "Staff Roles & Security", desc: "Set custom access levels for barbers and managers. Keep your business data secure and private." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="bg-indigo-600 p-3 rounded-xl h-fit text-white font-bold">0{i+1}</div>
                    <div>
                      <h4 className="font-black mb-1" style={{ color: '#000000' }}>{item.title}</h4>
                      <p className="text-slate-900 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Public Display System Section */}
      <section className="py-24 px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-black font-outfit mb-6" style={{ color: '#000000' }}>
              The Aesthetic of a Tech-Enabled Shop.
            </h2>
            <p className="text-lg text-slate-900 mb-8 font-inter">
              Show your customers you value their time. Our **Public Display System** turns any smart TV or tablet into a premium live-queue board.
            </p>
            <ul className="space-y-4">
              {[
                "Elevates your shop's interior with a clean, modern tech aesthetic.",
                "Reduces perceived wait time by providing total transparency.",
                "Eliminates the 'When am I next?' questions for good.",
                "Builds trust and shows elite-level care for customer convenience."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-900 font-medium">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-[40px] blur-2xl" />
            <img 
              src="/assets/pitch/dashboard.png" 
              alt="Public Display System" 
              className="relative rounded-[32px] shadow-2xl border-4 border-white"
            />
          </motion.div>
        </div>
      </section>

      {/* App Flow Section */}
      <section className="py-24 px-6 bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-4">
            <span className="text-indigo-300 uppercase tracking-widest font-black text-sm">The Experience</span>
          </motion.div>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-outfit mb-4 text-white">The Frictionless Flow</h2>
            <p className="text-indigo-200 text-lg font-medium">Designed for speed. Built for simplicity.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Customer Flow */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-800/50 p-10 rounded-[40px] border border-slate-700 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">✨</div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20">👤</div>
                <div>
                  <h3 className="text-2xl font-black font-outfit" style={{ color: '#000000' }}>The Customer Journey</h3>
                  <p className="text-indigo-400 text-sm font-medium">Ultimate Convenience</p>
                </div>
              </div>
              <div className="space-y-10">
                {[
                  { step: "01", title: "One-Tap Entry", desc: "No more messy clipboards. Customers join the queue digitally from their own phone in seconds." },
                  { step: "02", title: "Real-Time Transparency", desc: "Instant visibility of their position and a live countdown of the estimated wait time." },
                  { step: "03", title: "The 'Coffee Break' Freedom", desc: "Customers are free to leave and run errands. They aren't tethered to your waiting room." },
                  { step: "04", title: "Graceful Arrival", desc: "Arrive just in time. If you're running late, we give a 30-minute grace period to rejoin the queue without losing your spot." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 relative">
                    {i !== 3 && <div className="absolute left-7 top-14 w-[2px] h-10 bg-slate-700" />}
                    <div className="z-10 w-14 h-14 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center font-bold text-indigo-400 shrink-0">
                      {item.step}
                    </div>
                    <div className="pt-2">
                      <h4 className="font-bold text-white text-lg mb-1">{item.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Owner Flow */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-indigo-600/10 p-10 rounded-[40px] border border-indigo-500/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">🚀</div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-600/20">🏪</div>
                <div>
                  <h3 className="text-2xl font-bold font-outfit">The Owner Experience</h3>
                  <p className="text-indigo-400 text-sm font-medium">Total Operational Control</p>
                </div>
              </div>
              <div className="space-y-10">
                {[
                  { step: "01", title: "Rapid Onboarding", desc: "Launch your digital shop in minutes. Customize your barbers, services, and prices with zero tech-headache." },
                  { step: "02", title: "Centralized Dashboard", desc: "Monitor every chair and customer from one unified screen. See exactly who is next and what they need." },
                  { step: "03", title: "One-Click Serving", desc: "Simply tap 'Now Serving'. The system automatically notifies the customer and updates the public display." },
                  { step: "04", title: "Automated Insights", desc: "No manual math. Get daily reports on revenue, peak hours, and staff performance delivered to your dashboard." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 relative">
                    {i !== 3 && <div className="absolute left-7 top-14 w-[2px] h-10 bg-indigo-500/20" />}
                    <div className="z-10 w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center font-bold text-indigo-400 shrink-0">
                      {item.step}
                    </div>
                    <div className="pt-2">
                      <h4 className="font-bold text-white text-lg mb-1">{item.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing / Membership Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div {...fadeInUp} className="text-center mb-4">
            <span className="text-indigo-700 uppercase tracking-widest font-black text-sm">The Offer</span>
          </motion.div>
          <motion.h2 {...fadeInUp} className="text-4xl md:text-5xl font-black font-outfit mb-6" style={{ color: '#000000' }}>
            Join the Founding Members
          </motion.h2>
          <motion.p {...fadeInUp} className="text-xl text-slate-900 font-medium mb-12">
            We're looking for visionary shop owners to help us define the future of barbering. 
            Enjoy full access for a nominal fee.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-3xl font-bold text-sm tracking-widest uppercase">
              Early Adopter Rate
            </div>
            <h3 className="text-2xl font-black mb-2" style={{ color: '#000000' }}>Pro Membership</h3>
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-slate-500 text-2xl line-through">₹1499</span>
              <span className="text-5xl font-bold text-indigo-600">₹499</span>
              <span className="text-black font-bold">/month</span>
            </div>
            <ul className="text-left space-y-4 mb-10 max-w-sm mx-auto">
              <li className="flex items-center gap-3 text-black font-bold">
                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full text-xs">✓</span>
                <span className="font-bold">Unlimited Digital Tokens</span>
              </li>
              <li className="flex items-center gap-3 text-black font-bold">
                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full text-xs">✓</span>
                <span className="font-bold">Full Product & Service Suite</span>
              </li>
              <li className="flex items-center gap-3 text-black font-bold">
                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full text-xs">✓</span>
                <span className="font-bold">Advanced Analytics & Reports</span>
              </li>
              <li className="flex items-center gap-3 text-black font-bold">
                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full text-xs">✓</span>
                <span className="font-bold">Priority Founder Support</span>
              </li>
            </ul>
            <Link to="/signup" className="block w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-200">
              Claim Your Founders Rate
            </Link>
            <p className="mt-6 text-sm text-slate-900 font-bold">Limited to the first 50 shop owners. Locked-in price for life.</p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <section className="py-24 bg-[#0f172a] text-white text-center px-6">
        <motion.div {...fadeInUp}>
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to Professionalize Your Shop?</h2>
          <p className="text-slate-200 mb-12 text-lg max-w-2xl mx-auto font-medium">
            Take the first step towards a more efficient, profitable, and stress-free business. 
            TrimTime is here to help you grow.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all">
              Get Started Now
            </Link>
            <Link to="/login" className="px-10 py-5 bg-slate-800 text-white border border-slate-700 rounded-2xl font-bold hover:bg-slate-700 transition-all">
              Owner Login
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Pitch;
