import { forwardRef } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

const TrainerCard = forwardRef(({ profile, hideDownload }, ref) => {
  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `MLBB-ID-${profile.ign || 'card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const initials = (profile.ign || '??').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4">
      {!hideDownload && (
        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-md bg-tavern-accent hover:bg-red-700 text-white text-sm font-bold transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download ID Card
        </button>
      )}

      <div 
        ref={ref}
        className="w-[400px] h-[550px] rounded-xl overflow-hidden shadow-2xl relative"
        style={{ 
          fontFamily: "'Open Sans', sans-serif",
          background: 'linear-gradient(135deg, #0f0c29, #1a1a2e 40%, #24243e)',
          border: '2px solid rgba(255, 36, 0, 0.3)',
          boxShadow: '0 0 20px rgba(255, 36, 0, 0.1), inset 0 0 20px rgba(0,0,0,0.5)'
        }}
      >
        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

        {/* Top Bar */}
        <div className="relative z-10 px-6 pt-5 pb-3 flex justify-between items-center border-b border-white/10">
          <div className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">MLBB Identification Card</div>
          <div className="text-xs font-bold text-tavern-accent">ML TAVERN</div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-6 flex h-[calc(100%-50px-70px)] gap-6">
          
          {/* Left Col: Avatar & Core Info */}
          <div className="flex flex-col items-center w-[120px]">
            <div className="w-24 h-24 rounded-full border-4 border-tavern-accent flex items-center justify-center mb-4 bg-black/40 shadow-lg" style={{boxShadow: '0 0 15px rgba(255, 36, 0, 0.4)'}}>
              <span className="text-3xl font-extrabold text-white" style={{textShadow: '0 0 10px rgba(255,255,255,0.5)'}}>{initials}</span>
            </div>
            
            <h2 className="text-xl font-extrabold text-white text-center leading-tight mb-4">{profile.ign || 'UNKNOWN'}</h2>
            
            <div className="w-full space-y-3">
              <StatBar label="CLASS" value={profile.main_role || '---'} color="#FF2400" />
              <StatBar label="SPECIAL" value={profile.second_role || '---'} color="#4facfe" />
              <StatBar label="TEAM" value={profile.favorite_esports_team || '---'} color="#43e97b" />
            </div>
          </div>

          {/* Right Col: Data Logs */}
          <div className="flex-1 border-l border-white/10 pl-6 flex flex-col justify-between">
            <div className="space-y-4">
              <DataBlock title="MAIN ARSENAL" items={[profile.main_hero_1, profile.main_hero_2, profile.main_hero_3]} />
              <DataBlock title="NEMESIS" items={[profile.hate_hero]} isNegative />
              <DataBlock title="SYNERGY" items={[profile.love_hero]} isPositive />
            </div>
            
            <div className="mt-4 pt-4 border-t border-dashed border-white/10">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span className="font-bold">ACTIVE SINCE</span>
                <span>{profile.started_playing_month || '??'} {profile.started_playing_day || '??'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with QR Code */}
        <div className="absolute bottom-0 left-0 right-0 h-[70px] bg-black/40 border-t border-white/10 px-6 flex items-center justify-between z-10 backdrop-blur-sm">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Verified Player Profile</p>
            <p className="text-sm font-bold text-white/60">ml-tavern.vercel.app</p>
          </div>
          <div className="bg-white p-1.5 rounded-sm">
            <QRCodeSVG value="https://ml-tavern.vercel.app" size={40} bgColor="#ffffff" fgColor="#000000" level="L" />
          </div>
        </div>
      </div>
    </div>
  );
});

// Sub-components for the Sci-Fi look
function StatBar({ label, value, color }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-white/40 font-bold">{label}</span>
      </div>
      <div className="w-full h-6 bg-black/40 border border-white/10 rounded-sm flex items-center px-2 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundColor: color, width: '100%'}}></div>
        <span className="text-xs font-bold text-white relative z-10 truncate">{value}</span>
      </div>
    </div>
  );
}

function DataBlock({ title, items, isNegative, isPositive }) {
  const color = isNegative ? 'text-red-400 border-red-500/30' : isPositive ? 'text-green-400 border-green-500/30' : 'text-white border-white/10';
  const validItems = items.filter(i => i);
  
  return (
    <div>
      <p className="text-[10px] text-white/40 font-bold tracking-wider mb-1">{title}</p>
      <div className={`border rounded-sm p-2 bg-black/20 ${color}`}>
        {validItems.length > 0 ? validItems.map((item, i) => (
          <p key={i} className="text-sm font-bold">• {item}</p>
        )) : (
          <p className="text-sm font-bold opacity-50">EMPTY</p>
        )}
      </div>
    </div>
  );
}

export default TrainerCard;