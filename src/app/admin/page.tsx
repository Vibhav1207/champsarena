"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Submission {
  id: string;
  name: string;
  creator: string;
  format: string;
  formatColor: string;
  date: string;
  imgUrl: string;
  imgAlt: string;
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      id: "indigo-plateau-qualifiers",
      name: "Indigo Plateau Qualifiers",
      creator: "Trainer Red",
      format: "VGC 2024",
      formatColor: "bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/20",
      date: "Nov 12, 2024",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6NKArthUhQC6jWRVR_QXTxrm3dmf7GO3n4bJmnRsByAdSn0z66YtLNxUfKeEJnu-YZtfLzhnqDYnkUOZxM3VdM66D5t3QJpw7Pc8DQA7QMTE2Qjw_CX70EOxWbUYMJCen89WDtJp4F-iL_MHoVZFMTL-1Hl_EVG1vZDJViTFJ_U82gwUXxuhDXJS8dUWxmM97TpicknR4AIDjLS2P6kmhTBVElJ0KFhVelAoBC2uQJ1Wsa9AlUyjFvH6KTa_UpIZTCmRlJq64b4c",
      imgAlt: "Water-type emblem regional banner",
    },
    {
      id: "cinnabar-open-masters",
      name: "Cinnabar Open Masters",
      creator: "Blaine's Gym",
      format: "TCG Standard",
      formatColor: "bg-secondary-container text-on-secondary-container border border-outline-variant",
      date: "Dec 01, 2024",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1jKsTyf3nz85fuE8CRRFUr2LvN9UJHZYxWRMZxJcONo7y24a4KleqYhhgCWGmtTUJc0JkrgQbWUv3ml3sNhne313FynlSX6tRpIZlaETC_24XwrrVrGKFVBID6JLG20P0kJ_VNXUmsHfWxiEo-PyIpo0KIAVZlqZo082mh-urVdpCwBGnW60I6aUo_CEXubACkcxQGmhbdXFwzcXVjBkUFyH5LnkVhkV1F1hcLUjiPXSFDlrb57muBv6zlJqWaeIcF-_AlQSJPoY",
      imgAlt: "Fire-type emblem masters banner",
    },
    {
      id: "viridian-forest-blitz",
      name: "Viridian Forest Blitz",
      creator: "League Scouts",
      format: "Pokémon GO",
      formatColor: "bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/20",
      date: "Dec 05, 2024",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDU3YTsIoL-9zFuHghkVhQYRZEjKsF7R3JW9EIveQzuAs6BworivM4U6T0gUwOyv4eI9lnz491jf0UMagWv7qVgjxJjrUqvzCcULGdHvPRfy3xvJsZfBBvRKwqkL9yc6cEPgLpJ_NxEI-RgNe6TsaDEtjUt8SiMqymIvWUH2oXID_ZuYVwTkYVRkJoTskd72L6TzI98WUlTZQbFT5LNrLs6B7ZZp9eOiCD9OrKkc1ACqQxWC2T0fuD9VJ6ic4Q9OjS7lVfX21nEbRk",
      imgAlt: "Grass-type emblem blitz banner",
    },
  ]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");

  const handleApprove = (id: string, name: string) => {
    alert(`Approved tournament: ${name}`);
    setSubmissions(submissions.filter((sub) => sub.id !== id));
  };

  const handleReject = (id: string, name: string) => {
    const reason = prompt(`Enter rejection reason for "${name}":`, "Formatting requirements not met.");
    if (reason !== null) {
      alert(`Rejected tournament: ${name}. Reason: ${reason}`);
      setSubmissions(submissions.filter((sub) => sub.id !== id));
    }
  };

  const handleCreateNew = () => {
    const name = prompt("Enter new tournament name:");
    if (name) {
      alert(`Initialized creation wizard for: ${name}`);
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-outline-variant fixed h-full z-50 select-none">
        <div className="p-md">
          <Link href="/" className="font-display-lg text-display-lg text-tertiary tracking-tight text-[28px] leading-tight font-bold hover:opacity-90 transition-opacity">
            Pokémon Champions
          </Link>
          <p className="text-[10px] font-label-lg text-outline mt-xs tracking-wider font-bold">
            ADMINISTRATION CONSOLE
          </p>
        </div>

        <nav className="flex-1 mt-md px-sm space-y-xs font-semibold">
          {/* Dashboard Tab (Active) */}
          <Link href="/admin" className="flex items-center gap-sm px-md py-sm rounded-lg active-nav-bg text-tertiary font-bold transition-all group">
            <span className="material-symbols-outlined material-symbols-fill">dashboard</span>
            <span className="font-body-md text-body-md">Dashboard</span>
          </Link>
          {/* Tournaments */}
          <Link href="/tournaments" className="flex items-center gap-sm px-md py-sm rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-low hover:text-tertiary transition-all group">
            <span className="material-symbols-outlined">emoji_events</span>
            <span className="font-body-md text-body-md">Tournaments</span>
          </Link>
          {/* Users */}
          <Link href="#" className="flex items-center gap-sm px-md py-sm rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-low hover:text-tertiary transition-all group">
            <span className="material-symbols-outlined">group</span>
            <span className="font-body-md text-body-md">Users</span>
          </Link>
          {/* News */}
          <Link href="#" className="flex items-center gap-sm px-md py-sm rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-low hover:text-tertiary transition-all group">
            <span className="material-symbols-outlined">newspaper</span>
            <span className="font-body-md text-body-md">News</span>
          </Link>
          {/* Payments */}
          <Link href="#" className="flex items-center gap-sm px-md py-sm rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-low hover:text-tertiary transition-all group">
            <span className="material-symbols-outlined">payments</span>
            <span className="font-body-md text-body-md">Payments</span>
          </Link>
        </nav>

        {/* User profile section */}
        <div className="p-md border-t border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary shadow-sm">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
              <p className="font-body-md text-body-md font-bold text-on-surface leading-tight">Chief Arbiter</p>
              <p className="text-[10px] font-label-lg text-outline uppercase tracking-wider font-semibold">Master Class</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-64 bg-surface border-r border-outline-variant z-50 flex flex-col justify-between"
            >
              <div>
                <div className="p-md flex justify-between items-center border-b border-outline-variant/30">
                  <span className="font-display-lg text-display-lg text-tertiary tracking-tight text-[24px] font-bold">
                    Pokémon Champions
                  </span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-tertiary"
                  >
                    close
                  </button>
                </div>
                <nav className="mt-md px-sm space-y-xs font-semibold">
                  <Link href="/admin" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-sm px-md py-sm rounded-lg active-nav-bg text-tertiary font-bold transition-all">
                    <span className="material-symbols-outlined material-symbols-fill">dashboard</span>
                    <span className="font-body-md text-body-md">Dashboard</span>
                  </Link>
                  <Link href="/tournaments" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-sm px-md py-sm rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-low transition-all">
                    <span className="material-symbols-outlined">emoji_events</span>
                    <span className="font-body-md text-body-md">Tournaments</span>
                  </Link>
                  <Link href="#" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-sm px-md py-sm rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-low transition-all">
                    <span className="material-symbols-outlined">group</span>
                    <span className="font-body-md text-body-md">Users</span>
                  </Link>
                </nav>
              </div>
              <div className="p-md border-t border-outline-variant bg-surface-container-lowest">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary shadow-sm">
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md font-bold text-on-surface leading-tight">Chief Arbiter</p>
                    <p className="text-[10px] font-label-lg text-outline uppercase tracking-wider font-semibold">Master Class</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Scroll wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-md sticky top-0 z-40 select-none">
          <div className="flex items-center gap-md">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-xs rounded-full hover:bg-surface-container active:scale-90 transition-transform flex items-center justify-center border border-outline-variant/30"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-title-lg text-title-lg text-on-surface font-bold leading-tight">
              System Overview
            </h1>
          </div>

          <div className="flex items-center gap-sm">
            {/* Search */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
                placeholder="Search trainers, IDs..."
                className="pl-10 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-full text-body-md font-body-md focus:ring-2 focus:ring-tertiary focus:border-transparent outline-none w-64"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
            </div>

            <button className="p-xs rounded-full hover:bg-surface-container relative active:scale-95 transition-transform">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
            </button>
            <button className="p-xs rounded-full hover:bg-surface-container active:scale-95 transition-transform">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        {/* Dashboard Canvas Content */}
        <main className="p-md lg:p-lg max-w-container-max w-full mx-auto space-y-lg flex-grow">
          {/* Quick Stats cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md select-none">
            {[
              {
                title: "Registered Trainers",
                val: "12,482",
                trend: "+14% vs last month",
                icon: "trending_up",
                trendColor: "text-tertiary",
              },
              {
                title: "Active Matches",
                val: "156",
                trend: "Streaming live now",
                icon: "stadium",
                trendColor: "text-tertiary",
              },
              {
                title: "Tournament Submissions",
                val: "24",
                trend: "8 urgent reviews",
                icon: "assignment_late",
                trendColor: "text-error font-bold",
              },
              {
                title: "Prize Pool Managed",
                val: "$45.2k",
                trend: "Q3 Tournament series",
                icon: "currency_exchange",
                trendColor: "text-tertiary",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant trainer-card-shadow flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <div>
                  <span className="text-[11px] font-label-lg text-outline uppercase tracking-wider font-bold">
                    {stat.title}
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mt-xs font-bold leading-none">
                    {stat.val}
                  </h2>
                </div>
                <div className={`flex items-center gap-xs mt-sm ${stat.trendColor}`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {stat.icon}
                  </span>
                  <span className="text-body-md font-medium text-[13px]">{stat.trend}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Action Callout bar */}
          <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md bg-surface-container-lowest p-md rounded-xl border-l-4 border-l-tertiary trainer-card-shadow select-none">
            <div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-semibold leading-tight">
                Tournament Operations
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant font-medium mt-0.5">
                Manage ongoing series or launch a new competitive season.
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-tertiary text-on-tertiary px-lg py-sm rounded-lg font-title-lg flex items-center gap-sm active:scale-95 transition-transform shadow-md font-bold text-center"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Create New Tournament
            </button>
          </section>

          {/* Submissions & Details split bento */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            {/* Submissions list */}
            <div className="lg:col-span-2 space-y-md">
              <div className="flex items-center justify-between select-none">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Recent Submissions
                </h3>
                <button className="text-tertiary font-bold text-body-md hover:underline active:scale-95 transition-all">
                  View all submissions
                </button>
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden trainer-card-shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-surface-container-low border-b border-outline-variant font-bold select-none text-[11px] uppercase tracking-wider text-outline">
                      <tr>
                        <th className="px-md py-sm">Tournament Name</th>
                        <th className="px-md py-sm">Format</th>
                        <th className="px-md py-sm">Date</th>
                        <th className="px-md py-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      <AnimatePresence>
                        {submissions.length > 0 ? (
                          submissions.map((sub) => (
                            <motion.tr
                              key={sub.id}
                              initial={{ opacity: 1 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="hover:bg-background transition-colors"
                            >
                              <td className="px-md py-sm">
                                <div className="flex items-center gap-sm">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-variant relative shadow-sm shrink-0 select-none">
                                    <Image
                                      src={sub.imgUrl}
                                      alt={sub.imgAlt}
                                      fill
                                      className="object-cover"
                                      sizes="40px"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-body-md text-body-md font-bold text-on-surface leading-tight">
                                      {sub.name}
                                    </p>
                                    <p className="text-xs text-outline font-semibold select-none">
                                      By {sub.creator}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-md py-sm select-none">
                                <span className={`px-xs py-[2px] text-[10px] font-bold rounded uppercase shadow-sm ${sub.formatColor}`}>
                                  {sub.format}
                                </span>
                              </td>
                              <td className="px-md py-sm font-body-md text-body-md text-on-surface-variant font-medium select-none">
                                {sub.date}
                              </td>
                              <td className="px-md py-sm select-none">
                                <div className="flex gap-xs">
                                  <button
                                    onClick={() => handleApprove(sub.id, sub.name)}
                                    className="p-xs text-tertiary hover:bg-tertiary-fixed rounded-full transition-colors active:scale-90 flex items-center justify-center"
                                    title="Approve"
                                  >
                                    <span className="material-symbols-outlined text-[22px] material-symbols-fill">
                                      check_circle
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => handleReject(sub.id, sub.name)}
                                    className="p-xs text-error hover:bg-error-container rounded-full transition-colors active:scale-90 flex items-center justify-center"
                                    title="Reject"
                                  >
                                    <span className="material-symbols-outlined text-[22px]">
                                      cancel
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-lg font-body-md text-on-surface-variant select-none">
                              No pending tournament submissions.
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Health and Announcements */}
            <div className="space-y-lg">
              {/* System Health */}
              <div className="select-none">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-md">
                  System Health
                </h3>
                <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant space-y-md trainer-card-shadow">
                  <div className="space-y-xs">
                    <div className="flex justify-between text-body-md font-body-md">
                      <span className="text-on-surface-variant font-medium">Server Load</span>
                      <span className="text-tertiary font-bold">24%</span>
                    </div>
                    <div className="h-2 bg-surface-container w-full rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tertiary rounded-full transition-all duration-500"
                        style={{ width: "24%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <div className="flex justify-between text-body-md font-body-md">
                      <span className="text-on-surface-variant font-medium">Matchmaking Queue</span>
                      <span className="text-on-surface font-bold text-green-600">Nominal</span>
                    </div>
                    <div className="h-2 bg-surface-container w-full rounded-full overflow-hidden flex gap-[2px]">
                      <div className="h-full bg-tertiary w-1/4"></div>
                      <div className="h-full bg-tertiary w-1/4"></div>
                      <div className="h-full bg-tertiary w-1/4 opacity-35"></div>
                      <div className="h-full bg-tertiary w-1/4 opacity-35"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcements */}
              <div className="select-none">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-md">
                  Announcements
                </h3>
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant trainer-card-shadow overflow-hidden">
                  <div className="p-md border-b border-outline-variant/30 bg-surface-container-low/50">
                    <p className="font-body-md text-body-md font-bold text-on-surface leading-tight">
                      Winter Series Rules Update
                    </p>
                    <p className="text-xs text-outline mt-xs font-semibold">
                      2 hours ago • Draft
                    </p>
                  </div>
                  <div className="p-md">
                    <button className="w-full py-sm bg-surface-container-low text-tertiary font-body-md rounded-lg border border-outline-variant hover:bg-surface-container transition-colors font-bold shadow-sm active:scale-95 transition-transform">
                      New System Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-lowest border-t border-outline-variant px-lg py-md flex flex-col md:flex-row justify-between items-center gap-md select-none mt-auto">
          <p className="font-body-md text-body-md text-on-surface-variant font-semibold">
            © 2024 Pokémon Champions. Official Tournament Series Admin.
          </p>
          <div className="flex gap-md text-on-surface-variant font-body-md text-body-md font-semibold">
            <a href="#" className="hover:text-tertiary transition-colors">
              Internal Wiki
            </a>
            <a href="#" className="hover:text-tertiary transition-colors">
              System Support
            </a>
            <a href="#" className="hover:text-tertiary transition-colors">
              Log Files
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
