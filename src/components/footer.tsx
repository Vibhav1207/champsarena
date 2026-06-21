import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest dark:bg-surface-dim border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-lg py-xl max-w-container-max mx-auto gap-lg">
        {/* Branding Info */}
        <div className="flex flex-col gap-sm">
          <Link href="/" className="font-title-lg text-title-lg text-on-surface hover:text-tertiary transition-colors">
            Pokémon Champions
          </Link>
          <p className="text-body-md text-on-surface-variant max-w-xs">
            The official tournament series for elite competitive trainers across all Pokémon formats. Not affiliated with Nintendo or The Pokémon Company.
          </p>
          <span className="font-body-md text-body-md text-tertiary dark:text-tertiary-fixed">
            © 2024 Pokémon Champions. Official Tournament Series.
          </span>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-xl">
          <div className="flex flex-col gap-xs">
            <span className="font-label-lg text-on-surface uppercase mb-xs tracking-wider">
              Community
            </span>
            <a
              href="#"
              className="text-on-surface-variant hover:underline text-tertiary font-body-md hover:text-tertiary transition-colors"
            >
              Discord Community
            </a>
            <a
              href="#"
              className="text-on-surface-variant hover:underline text-tertiary font-body-md hover:text-tertiary transition-colors"
            >
              Support
            </a>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="font-label-lg text-on-surface uppercase mb-xs tracking-wider">
              Legal
            </span>
            <a
              href="#"
              className="text-on-surface-variant hover:underline text-tertiary font-body-md hover:text-tertiary transition-colors"
            >
              Rules & Regulations
            </a>
            <a
              href="#"
              className="text-on-surface-variant hover:underline text-tertiary font-body-md hover:text-tertiary transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Social Actions */}
        <div className="flex gap-md">
          <a
            href="#"
            className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">share</span>
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">mail</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
