import { useState } from "react";

const NAV_LINKS = ["Home", "Tools", "Health", "Diet", "Progress", "Blogs", "Appointments", "Plans", "Careers"];

const JOBS = [
  {
    id: 1,
    badge: "🌿 Now Open",
    title: "Nutritionist & Dietitian Internship",
    subtitle: "TrackIntake · Remote · Full-Time Internship",
    pills: ["📍 Remote", "⏳ 3 Months", "💼 Full-Time", "🌿 Nutrition & Dietetics"],
    responsibilities: [
      "Assist in nutrition assessments and client counseling sessions",
      "Develop and implement personalized meal plans",
      "Conduct research and gather data for nutrition projects",
      "Support senior dietitians in workshops, seminars & events",
      "Maintain accurate client records and reports",
      "Collaborate with healthcare professionals for client care",
      "Participate in team meetings and program development",
    ],
    learning: [
      "Hands-on experience in clinical/community nutrition",
      "Nutrition assessment and counseling skills",
      "Work with diverse client populations & health conditions",
      "Practical knowledge of diet planning & nutrition",
    ],
    requirements: [
      { icon: "🎓", label: "Nutrition / Dietetics Degree" },
      { icon: "✅", label: "IDA Registration (Preferred)" },
      { icon: "🗣️", label: "Strong Communication" },
      { icon: "❤️", label: "Passion for Wellness" },
    ],
    future: "Performance-based stipend extension · Assistant Nutritionist role opportunity",
    details: [
      { label: "Position", value: "Intern Dietitian", orange: false },
      { label: "Location", value: "Remote", orange: false },
      { label: "Duration", value: "3 Months", orange: false },
      { label: "Type", value: "Full-Time", orange: false },
      { label: "Stipend", value: "Performance-Based", orange: true },
      { label: "Contact", value: "7898622813", orange: false },
    ],
    applyLink: "https://lnkd.in/ddaiNqdh",
    tag: "Internship",
    dept: "Nutrition",
  },
  {
    id: 2,
    badge: "💻 Now Open",
    title: "Full Stack Developer",
    subtitle: "TrackIntake · Remote · Full-Time",
    pills: ["📍 Remote", "💼 Full-Time", "💻 Engineering", "⚡ React & Node"],
    responsibilities: [
      "Build and maintain scalable web applications using React and Node.js",
      "Design and implement RESTful APIs and database schemas",
      "Collaborate with designers to translate UI/UX wireframes into code",
      "Write clean, well-tested, and documented code",
      "Optimize application performance and ensure responsiveness",
      "Participate in code reviews and contribute to technical decisions",
      "Work closely with the product team to ship features on time",
    ],
    learning: [
      "Work on a real-world health-tech product used by thousands",
      "Gain experience with modern full-stack architecture",
      "Exposure to AI/ML integration in nutrition apps",
      "Mentorship from experienced engineers",
    ],
    requirements: [
      { icon: "⚛️", label: "React / Next.js" },
      { icon: "🟢", label: "Node.js / Express" },
      { icon: "🗄️", label: "SQL / NoSQL DBs" },
      { icon: "🔗", label: "REST API Design" },
      { icon: "🧪", label: "Testing (Jest/Vitest)" },
      { icon: "🐙", label: "Git & Version Control" },
    ],
    future: "Senior Developer role · Equity options · Lead Engineering team opportunity",
    details: [
      { label: "Position", value: "Full Stack Dev", orange: false },
      { label: "Location", value: "Remote", orange: false },
      { label: "Experience", value: "1–3 Years", orange: false },
      { label: "Type", value: "Full-Time", orange: false },
      { label: "Salary", value: "Competitive", orange: true },
      { label: "Contact", value: "7898622813", orange: false },
    ],
    applyLink: "https://lnkd.in/ddaiNqdh",
    tag: "Full-Time",
    dept: "Engineering",
  },
  {
  id: 3,
  badge: "🎨 Now Open",
  title: "UI/UX Designer",
  subtitle: "TrackIntake · Remote · Full-Time",
  pills: ["📍 Remote", "💼 Full-Time", "🎨 Design", "⚡ Figma & Framer"],
  responsibilities: [
    "Design intuitive and beautiful user interfaces for web and mobile",
    "Create wireframes, prototypes and high-fidelity mockups in Figma",
    "Conduct user research and usability testing sessions",
    "Collaborate with developers to ensure pixel-perfect implementation",
    "Maintain and evolve the TrackIntake design system",
    "Define user flows, information architecture and interaction patterns",
    "Present design decisions to stakeholders with clear rationale",
  ],
  learning: [
    "Work on a real health-tech product with millions of data points",
    "Learn to design for complex data-heavy dashboards",
    "Exposure to AI-powered UX patterns and personalization",
    "Mentorship from senior designers and product managers",
  ],
  requirements: [
    { icon: "🎨", label: "Figma / Framer" },
    { icon: "📐", label: "UI/UX Principles" },
    { icon: "🧠", label: "Design Thinking" },
    { icon: "💬", label: "Strong Communication" },
    { icon: "📱", label: "Mobile First Design" },
    { icon: "🔍", label: "User Research Skills" },
  ],
  future: "Senior Designer role · Lead Design System ownership · Product Design Manager path",
  details: [
    { label: "Position", value: "UI/UX Designer", orange: false },
    { label: "Location", value: "Remote", orange: false },
    { label: "Experience", value: "1–2 Years", orange: false },
    { label: "Type", value: "Full-Time", orange: false },
    { label: "Salary", value: "Competitive", orange: true },
    { label: "Contact", value: "7898622813", orange: false },
  ],
  applyLink: "https://lnkd.in/ddaiNqdh",
  tag: "Full-Time",
  dept: "Design",
},
{
  id: 4,
  badge: "💻 Now Open",
  title: "Frontend Developer Intern",
  subtitle: "TrackIntake · Remote · 3-Month Internship",
  pills: ["📍 Remote", "⏳ 3 Months", "💼 Internship", "⚛️ React & Tailwind"],
  responsibilities: [
    "Build responsive UI components using React and Tailwind CSS",
    "Convert Figma designs into clean, functional code",
    "Fix bugs and improve existing frontend codebase",
    "Collaborate with the design and backend team daily",
    "Write readable and well-structured code",
    "Participate in sprint planning and daily standups",
    "Test UI across browsers and devices for consistency",
  ],
  learning: [
    "Real-world React project experience on a live product",
    "Code review culture and best practices",
    "Agile workflow and team collaboration skills",
    "Modern frontend tooling — Vite, ESLint, Git",
  ],
  requirements: [
    { icon: "⚛️", label: "React Basics" },
    { icon: "🎨", label: "Tailwind CSS" },
    { icon: "🐙", label: "Git & GitHub" },
    { icon: "🧩", label: "HTML & CSS" },
    { icon: "📱", label: "Responsive Design" },
    { icon: "❤️", label: "Passion to Learn" },
  ],
  future: "Full-time Frontend Developer offer · Stipend extension based on performance",
  details: [
    { label: "Position", value: "Frontend Intern", orange: false },
    { label: "Location", value: "Remote", orange: false },
    { label: "Duration", value: "3 Months", orange: false },
    { label: "Type", value: "Internship", orange: false },
    { label: "Stipend", value: "Performance-Based", orange: true },
    { label: "Contact", value: "7898622813", orange: false },
  ],
  applyLink: "https://lnkd.in/ddaiNqdh",
  tag: "Internship",
  dept: "Engineering",
},

{
  id: 5,
  badge: "📊 Now Open",
  title: "Data Analyst Intern",
  subtitle: "TrackIntake · Remote · 3-Month Internship",
  pills: ["📍 Remote", "⏳ 3 Months", "💼 Internship", "📊 Python & SQL"],
  responsibilities: [
    "Analyze user nutrition and health data to find meaningful patterns",
    "Build dashboards and reports using Python or Excel",
    "Write SQL queries to extract and transform data from databases",
    "Support the product team with A/B test analysis",
    "Document findings and present insights to the team",
    "Clean and preprocess raw datasets for analysis",
    "Assist in building data pipelines and automation scripts",
  ],
  learning: [
    "Hands-on experience with real health and nutrition datasets",
    "SQL, Python (pandas, matplotlib) in a production environment",
    "Data storytelling and dashboard design skills",
    "Exposure to product analytics and growth metrics",
  ],
  requirements: [
    { icon: "🐍", label: "Python / Pandas" },
    { icon: "🗄️", label: "SQL Basics" },
    { icon: "📊", label: "Excel / Sheets" },
    { icon: "📉", label: "Data Visualization" },
    { icon: "🧠", label: "Analytical Thinking" },
    { icon: "🎓", label: "Stats / Math Background" },
  ],
  future: "Full-time Data Analyst role · Machine Learning exposure · Stipend extension",
  details: [
    { label: "Position", value: "Data Analyst Intern", orange: false },
    { label: "Location", value: "Remote", orange: false },
    { label: "Duration", value: "3 Months", orange: false },
    { label: "Type", value: "Internship", orange: false },
    { label: "Stipend", value: "Performance-Based", orange: true },
    { label: "Contact", value: "7898622813", orange: false },
  ],
  applyLink: "https://lnkd.in/ddaiNqdh",
  tag: "Internship",
  dept: "Data",
},

{
  id: 6,
  badge: "📣 Now Open",
  title: "Digital Marketing Intern",
  subtitle: "TrackIntake · Remote · 3-Month Internship",
  pills: ["📍 Remote", "⏳ 3 Months", "💼 Internship", "📣 Social & SEO"],
  responsibilities: [
    "Create and schedule content for Instagram, LinkedIn and Twitter",
    "Write SEO-optimized blogs and articles on health & nutrition",
    "Run and monitor paid ad campaigns on Meta and Google",
    "Track campaign performance using Google Analytics",
    "Collaborate with designers for creatives and banners",
    "Engage with the community and respond to DMs and comments",
    "Research competitors and trending health topics",
  ],
  learning: [
    "End-to-end digital marketing on a growing health-tech brand",
    "SEO, content strategy and social media growth tactics",
    "Paid ads — Meta Ads Manager and Google Ads hands-on",
    "Analytics and data-driven decision making",
  ],
  requirements: [
    { icon: "📣", label: "Social Media Skills" },
    { icon: "✍️", label: "Content Writing" },
    { icon: "🔍", label: "SEO Basics" },
    { icon: "📈", label: "Google Analytics" },
    { icon: "🎨", label: "Canva / Design Tools" },
    { icon: "❤️", label: "Passion for Health" },
  ],
  future: "Full-time Marketing role · Growth Manager path · Stipend extension",
  details: [
    { label: "Position", value: "Marketing Intern", orange: false },
    { label: "Location", value: "Remote", orange: false },
    { label: "Duration", value: "3 Months", orange: false },
    { label: "Type", value: "Internship", orange: false },
    { label: "Stipend", value: "Performance-Based", orange: true },
    { label: "Contact", value: "7898622813", orange: false },
  ],
  applyLink: "https://lnkd.in/ddaiNqdh",
  tag: "Internship",
  dept: "Marketing",
},
];

const Dot = () => (
  <span className="mt-[5px] shrink-0 w-[5px] h-[5px] rounded-full bg-[#ff7043] block" />
);

function JobCard({ job }) {
  return (
    <div className="bg-white  rounded-2xl flex flex-col overflow-hidden border border-[#e8e0d6]">

      {/* Top */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-[#e8e0d6]">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-[#fff3ee] text-[#ff7043] rounded-full px-3 py-0.5 mb-2">
          {job.badge}
        </span>
        <h2 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight">{job.title}</h2>
        <p className="text-xs text-[#546e7a] mt-1">{job.subtitle}</p>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 border-b border-[#e8e0d6]">
        {job.pills.map((p) => (
          <span key={p} className="text-xs font-medium px-3 py-1 rounded-full bg-[#faf3eb] text-gray-600 border border-[#e8e0d6]">
            {p}
          </span>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-6 py-4">

        {/* Responsibilities */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Key Responsibilities</p>
          <ul className="flex flex-col gap-1.5">
            {job.responsibilities.map((r) => (
              <li key={r} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                <Dot />{r}
              </li>
            ))}
          </ul>
        </div>

        {/* Learning + Requirements */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Learning Opportunities</p>
            <ul className="flex flex-col gap-1.5">
              {job.learning.map((l) => (
                <li key={l} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                  <Dot />{l}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Requirements</p>
            <div className="grid grid-cols-2 gap-2">
              {job.requirements.map((r) => (
                <div key={r.label} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-800 bg-[#faf3eb] border border-[#e8e0d6] flex-wrap">
                  <span >{r.icon}</span><span className="wrap-break-word whitespace-normal" >{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Future Banner */}
        <div className="col-span-1 md:col-span-2 flex items-center gap-3 rounded-xl px-4 py-3 bg-gradient-to-r from-[#ff7043] to-[#f08040]">
          <span className="text-2xl shrink-0">🌱</span>
          <div>
            <p className="text-sm font-bold text-white">Future Opportunities</p>
            <p className="text-xs text-white/90">{job.future}</p>
          </div>
        </div>
      </div>

      {/* Apply Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3 bg-[#faf3eb] border-t border-[#e8e0d6]">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#546e7a]">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" stroke="#ff7043" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.59 6.59l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            <a href="tel:7898622813" className="text-[#ff7043] font-semibold no-underline">7898622813</a>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" stroke="#ff7043" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
            </svg>
            <a href="http://www.trackintake.co.in" target="_blank" rel="noreferrer" className="text-[#ff7043] font-semibold no-underline">trackintake.co.in</a>
          </span>
        </div>
        <a href={job.applyLink} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 bg-[#ff7043] hover:bg-[#c94420] text-white text-sm font-bold rounded-lg px-5 py-2 no-underline transition-colors">
          Apply Now
          <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function Career() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(1);

  const selectedJob = JOBS.find((j) => j.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf3eb] font-sans">

      {/* NAV */}
      <nav className="h-14 flex items-center justify-between px-4 md:px-8 bg-white border-b border-[#e8e0d6] shrink-0 sticky top-0 z-50">
        <div className="text-lg font-extrabold text-gray-900">
          <span className="text-[#ff7043]">Track</span>Intake
        </div>
        <div className="hidden lg:flex items-center gap-5">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#"
              className={`text-xs font-semibold no-underline transition-colors ${link === "Careers" ? "text-[#ff7043]" : "text-gray-500 hover:text-[#ff7043]"}`}>
              {link}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-full border border-[#e8e0d6] bg-white">
            <svg width="14" height="14" fill="none" stroke="#4a4a4a" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ff7043] text-white text-xs font-bold">S</div>
          <span className="hidden sm:block text-xs font-semibold text-gray-900">Siyaa ▾</span>
          <button className="lg:hidden flex flex-col gap-1 p-1" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="w-5 h-0.5 bg-gray-600 block" />
            <span className="w-5 h-0.5 bg-gray-600 block" />
            <span className="w-5 h-0.5 bg-gray-600 block" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-b border-[#e8e0d6] px-4 py-3 flex flex-col gap-3 z-40">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#"
              className={`text-sm font-semibold no-underline ${link === "Careers" ? "text-[#ff7043]" : "text-gray-500"}`}>
              {link}
            </a>
          ))}
        </div>
      )}

      {/* PAGE HEADER */}
   

      {/* MAIN — 3 col on desktop: job list | job detail | sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[220px_1fr_252px] gap-4 p-4 md:p-5 max-w-[1300px] mx-auto w-full">

        {/* JOB LIST */}
        <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {JOBS.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelectedId(job.id)}
              className={`shrink-0 lg:shrink text-left rounded-xl border p-3 transition-all cursor-pointer w-48 lg:w-full ${
                selectedId === job.id
                  ? "border-[#ff7043] bg-white shadow-sm"
                  : "border-[#e8e0d6] bg-white/60 hover:bg-white hover:border-[#ff7043]/40"
              }`}
            >
              <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${selectedId === job.id ? "text-[#ff7043]" : "text-[#546e7a]"}`}>
                {job.dept}
              </div>
              <div className="text-xs font-bold text-gray-900 leading-snug">{job.title}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  job.tag === "Internship" ? "bg-[#fff3ee] text-[#ff7043]" : "text-[#ff7043]"
                }`}>
                  {job.tag}
                </span>
                <span className="text-[10px] text-[#546e7a]">Remote</span>
              </div>
            </button>
          ))}
        </div>

        {/* JOB DETAIL */}
        <div>
          <JobCard job={selectedJob} />
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl p-4 border border-[#e8e0d6]">
            <h3 className="text-xs font-bold text-gray-900 pb-2 mb-2 border-b border-[#e8e0d6]">Job Details</h3>
            {selectedJob.details.map((d, i) => (
              <div key={d.label}
                className={`flex justify-between items-center py-1.5 text-xs ${i < selectedJob.details.length - 1 ? "border-b border-dashed border-[#e8e0d6]" : ""}`}>
                <span className="text-gray-600 font-medium">{d.label}</span>
                <span className={`font-bold ${d.orange ? "text-[#ff7043]" : "text-gray-900"}`}>{d.value}</span>
              </div>
            ))}
          </div>

          {/* All openings count */}
          <div className="bg-white rounded-2xl p-4 border border-[#e8e0d6]">
            <h3 className="text-xs font-bold text-gray-900 pb-2 mb-2 border-b border-[#e8e0d6]">All Openings</h3>
            {JOBS.map((job) => (
              <button key={job.id} onClick={() => setSelectedId(job.id)}
                className={`w-full text-left flex items-center justify-between py-1.5 text-xs cursor-pointer border-b border-dashed border-[#e8e0d6] last:border-0 bg-transparent ${selectedId === job.id ? "text-[#ff7043] font-bold" : "text-gray-600 font-medium"}`}>
                <span>{job.title.length > 22 ? job.title.slice(0, 22) + "…" : job.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${job.tag === "Internship" ? "bg-[#fff3ee] text-[#ff7043]" : "bg-[#fff3ee] text-[#ff7043]"}`}>
                  {job.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
