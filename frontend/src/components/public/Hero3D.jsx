import { SplineScene } from "../ui/splite";
import { Spotlight } from "../ui/spotlight";
import { TypingEffect } from "../ui/typing-effect";

export function Hero3D() {
  return (
    <div className="w-full min-h-[700px] bg-transparent relative overflow-hidden flex flex-col items-center justify-center py-20 px-6">
      {/* Spotlight removed to check source of blue glow */}


      <div className="container mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12">
        {/* Left column: Text content */}
        <div className="w-full lg:w-1/2 text-left space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-black leading-tight" style={{ color: 'black' }}>
            <TypingEffect 
              text="Intelligent Care" 
              speed={70} 
              className="block"
            />
          </h1>
          <p className="text-xl md:text-2xl text-black font-medium leading-relaxed max-w-xl" style={{ color: 'black' }}>
            <TypingEffect 
              text="Revolutionizing hospital resource management with real-time tracking and predictive AI." 
              speed={30} 
              delay={1500}
              className="inline-block"
            />
          </p>
          
          <div className="pt-4 opacity-0 animate-fade-in fill-mode-forwards" style={{ animationDelay: '3.5s', animationDuration: '1s' }}>
             <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-emerald-500/20">
                Explore Technology
             </button>
          </div>
        </div>

        {/* Right column: 3D Robot Container */}
        <div className="w-full lg:w-1/2 h-[500px] md:h-[600px] relative cursor-crosshair">
          <div className="relative z-10 w-full h-full">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
