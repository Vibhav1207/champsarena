import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t-8 border-primary mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-start px-md md:px-lg py-lg md:py-xl max-w-container-max mx-auto gap-lg md:gap-xl">

        {/* Brand Info */}
        <div className="flex flex-col gap-md">
          <Link href="/" className="inline-block hover:opacity-95 transition-all">
            <span className="font-bold text-3xl md:text-4xl uppercase tracking-tighter bg-primary text-white px-4 py-1 select-none">
              ChampsArena
            </span>
          </Link>
          <p className="font-bold text-primary max-w-[320px] uppercase leading-tight">
            The tournament series for elite competitive trainers. Established 2026.
          </p>
          <span className="font-black text-xs uppercase tracking-widest text-primary/50">
            © {new Date().getFullYear()} ChampsArena. ALL RIGHTS RESERVED.
          </span>
          <p className="text-[10px] uppercase font-bold text-primary/40 leading-none">
            This is a community website. Not affiliated with Nintendo, Game Freak, or The Pokémon Company.
          </p>
        </div>

        {/* Links Columns */}
        <div className="grid grid-cols-2 gap-md md:gap-xl">
          <div className="flex flex-col gap-sm">
            <span className="font-black text-xl text-primary uppercase mb-xs border-b-4 border-accent-red pb-1 select-none">
              Community
            </span>
            <a href="#" className="text-primary font-bold hover:text-accent-blue uppercase text-sm">
              Discord
            </a>
            <a href="/contact" className="text-primary font-bold hover:text-accent-blue uppercase text-sm">
              Support Hub
            </a>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-black text-xl text-primary uppercase mb-xs border-b-4 border-accent-yellow pb-1 select-none">
              Legal
            </span>
            <a href="/rules" className="text-primary font-bold hover:text-accent-blue uppercase text-sm">
              Regulations
            </a>
            <a href="/privacy" className="text-primary font-bold hover:text-accent-blue uppercase text-sm">
              Privacy
            </a>
          </div>
        </div>

        {/* Social Share / Connect Buttons */}
        <div className="flex gap-md">
          <a
            href="#"
            title="Share"
            className="w-16 h-16 border-4 border-primary flex items-center justify-center text-primary hover:bg-accent-red hover:text-white transition-all neo-brutalist-shadow-sm hover:translate-y-[-2px]"
          >
            <span className="material-symbols-outlined text-3xl font-bold">share</span>
          </a>
          <a
            href="#"
            title="Email"
            className="w-16 h-16 border-4 border-primary flex items-center justify-center text-primary hover:bg-accent-blue hover:text-white transition-all neo-brutalist-shadow-sm hover:translate-y-[-2px]"
          >
            <span className="material-symbols-outlined text-3xl font-bold">mail</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
