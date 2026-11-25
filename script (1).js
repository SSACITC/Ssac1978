import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, addDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ===== SETTINGS (edit here) =====
const CONFIG = {
  firebase: { apiKey: "AIzaSyDSJnVF78k_2bwO2Q1iN4DxVemG-4EBBVE", authDomain: "ssacitc-1f62f.firebaseapp.com", projectId: "ssacitc-1f62f", storageBucket: "ssacitc-1f62f.firebasestorage.app", messagingSenderId: "730024720349", appId: "1:730024720349:web:551ee0cadb91192c556834" },
  adminEmail: "vlogselectroshial@gmail.com", // whoever logs in with this email (and its password) is the admin
  clubMail: "ssacitc2023@gmail.com",         // member password-reset emails go to this inbox
  facebook: "https://www.facebook.com/ssacitc",
  instagram: "https://www.instagram.com/ssacitc_official/",
  // Default committee. The admin imports this list once, then edits it inside the site.
  panelists: [
    ["Md. Wahid Taosif Ovi","President"],["Fahim Islam","General Secretary"],["Shahriar Rahman","Vice President"],["Maymun Nahar Jeny","Vice President"],["Maliha Sadika Maya","Joint Secretary"],["Fif Fahmidul Islam Fahad","Assistant Joint Secretary"],["Jubair Khan","Membership Secretary"],["Fariha Rahman","Membership Secretary"],["Hasubijjam Olive","Treasurer"],["Srabon","Publication Secretary"],["Md Swoccho Shaik","Public Relation Secretary"],["Riyanur Rahman Riyan","Event Management Secretary"],["Mahim","Sergeant at arms"],["Sinthia Yasmin Seen","Sergeant at arms"],["Mariya","Facilitator"],["Towhid","Facilitator"],["Musfiqur Rahman","Executive"],["Sadikuzzaman Sarib","Executive"],["Ryan Hossain Swoscho","Executive"]
  ].map((p, i) => ({ id: "SSAC-P" + String(i + 1).padStart(2, "0"), name: p[0], post: p[1] })),
  moderator: "Md. Mahfuzur Rahman Utsho",
  learn: ["AI", "Robotics", "Programming", "Cybersecurity", "Web Development", "Creative Design"],
  steps: ["Attend the club orientation", "Join a workshop", "Build a mini project", "Share your work with the club", "Help another member"]
};
// Data lives in Firebase (Authentication + Firestore). Security rules are in firestore.rules.

const RULES = [
  "Only students of Safiuddin Sarker Academy and College (Class 6–12) can apply.",
  "Give true information. Your name, class, roll, ID number, mobile number and email must be correct.",
  "One student, one registration. Use your own ID number. Fake or duplicate requests will be rejected.",
  "Write honestly why you want to join and what you want to learn.",
  "Keep your mobile number active (WhatsApp is best) so the club can reach you.",
  "If your ID number is in the club member list, you can log in right after registering. If it is not, a panelist reviews your request and accepts or rejects it.",
  "After approval, log in with your ID number and password. Keep your password private.",
  "Use technology responsibly: no hacking, cheating, bullying or sharing harmful content. Rule breakers can be removed.",
  "Join sessions when you can, respect panelists and other members, and help others learn.",
  "The panelists may update these rules when needed."
];
const rulesList = () => `<ol class="how">${RULES.map(r => `<li>${r}</li>`).join("")}</ol>`;
const ROLE = {
  "Admin": "You manage the whole site: the committee, the gallery, notices, posts, the member list and requests.",
  "President": "You guide the whole club. Set the direction, support every team and make sure each member gets a fair chance to learn and lead.",
  "General Secretary": "You keep the club running day to day. Coordinate the teams, follow up on plans and turn decisions into action.",
  "Vice President": "You support the President, step in when needed and help the teams stay on track.",
  "Joint Secretary": "You work with the General Secretary on coordination, records and follow-ups.",
  "Assistant Joint Secretary": "You assist the secretaries with records, schedules and daily tasks.",
  "Membership Secretary": "You welcome new students. Review registration requests, check the details and approve the right applicants.",
  "Treasurer": "You look after the club’s funds and keep a clear, honest record of income and spending.",
  "Publication Secretary": "You are the voice of the club. Write and publish the notices and news that members read in the feed.",
  "Public Relation Secretary": "You connect SSACITC with the school and the public, and help the club reach more students.",
  "Event Management Secretary": "You plan workshops, competitions and tech events, from the schedule to the wrap-up.",
  "Sergeant at arms": "You help keep every event orderly, disciplined and safe so everyone can learn comfortably.",
  "Facilitator": "You help members learn. Guide sessions, answer questions and support beginners.",
  "Executive": "You are part of the core team. Help in every activity and take on the tasks the committee gives you."
};
const RES = { "AI": [["Elements of AI (free course)", "https://www.elementsofai.com"]], "Robotics": [["Arduino documentation", "https://docs.arduino.cc"]], "Programming": [["CS50 free course", "https://cs50.harvard.edu/x"], ["Python tutorial", "https://docs.python.org/3/tutorial/"]], "Cybersecurity": [["Stay Safe Online", "https://staysafeonline.org"], ["OWASP Top 10", "https://owasp.org/www-project-top-ten/"]], "Web Development": [["MDN: Learn web development", "https://developer.mozilla.org/en-US/docs/Learn_web_development"], ["freeCodeCamp", "https://www.freecodecamp.org"]], "Creative Design": [["Canva Design School", "https://www.canva.com/designschool/"]] };
const TOPIC = {
  "AI": ["Understand how smart tools learn, and how to use them wisely and honestly.", ["Follow a beginner AI tutorial", "Try a small chatbot or image project", "Learn how to write clear prompts"]],
  "Robotics": ["Learn how sensors, motors and code work together to make machines move.", ["Learn basic circuits and sensors", "Try a simple Arduino project", "Build a small robot with a team"]],
  "Programming": ["Learn to think step by step and turn ideas into working code.", ["Pick a first language (Python or C)", "Solve one small problem every week", "Build a tiny game or tool"]],
  "Cybersecurity": ["Learn how to stay safe online and protect yourself and others.", ["Learn about strong passwords and scams", "Understand how networks work", "Practice safe, ethical security basics"]],
  "Web Development": ["Learn how websites are designed, built and put online.", ["Start with HTML and CSS", "Add life with JavaScript", "Publish your first page"]],
  "Creative Design": ["Learn to shape ideas into clear, beautiful visuals.", ["Learn colour, layout and typography", "Design a poster or logo", "Try UI design or short video editing"]]
};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fbApp = initializeApp(CONFIG.firebase), auth = getAuth(fbApp), fs = getFirestore(fbApp);
const PRIV = ["members", "notices", "formal", "roster", "notifs", "staff"], PUB = ["committee", "gallery"], cache = Object.fromEntries([...PRIV, ...PUB].map(k => [k, []]));
const clone = v => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
const fail = e => { console.error(e); toast(e && e.code === "permission-denied" ? "Not allowed. Please log in again." : "Could not save. Check your internet."); };
// db.get returns a copy of the live data; db.set writes only the items that changed to Firestore.
const db = {
  get(k, d = []) { return k in cache ? clone(cache[k]) : d; },
  set(k, v) {
    const old = cache[k] || [], was = new Map(old.map(x => [x.id, JSON.stringify(x)])), ids = new Set(v.map(x => x.id));
    cache[k] = clone(v);
    v.forEach(x => { if (was.get(x.id) !== JSON.stringify(x)) setDoc(doc(fs, k, String(x.id)), JSON.parse(JSON.stringify(x))).catch(fail); });
    old.forEach(x => { if (!ids.has(x.id)) deleteDoc(doc(fs, k, String(x.id))).catch(fail); });
    return true;
  }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const ago = t => { const m = (Date.now() - t) / 6e4 | 0; return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? (m / 60 | 0) + " h ago" : (m / 1440 | 0) + " d ago"; };
let tt; const toast = m => { const e = $("#toast"); e.textContent = m; e.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("on"), 2600); };
const go = h => { location.hash = h; };
const authState = { ready: false, user: null, role: null, me: null, ref: null, admin: false, pending: null, unmapped: false, settled: false };
let authBusy = false;
const session = () => authState.role ? { role: authState.role, id: authState.user.uid } : null, members = () => db.get("members");
const dg = v => String(v || "").replace(/\D/g, "").slice(-10);
const authEmail = id => { const [u, dom] = CONFIG.clubMail.split("@"); return `${u}+${String(id).trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_")}@${dom}`; };
const waitFor = (fn, ms = 6000) => new Promise(r => { const t0 = Date.now(); (function k() { if (fn() || Date.now() - t0 > ms) r(fn()); else setTimeout(k, 60); })(); });
const curM = () => authState.role === "m" ? members().find(m => m.id === authState.user.uid) || null : null;
const curP = () => authState.role === "p" ? { ...authState.me, id: authState.user.uid } : null;
const msg = (sel, t, c) => { $(sel).innerHTML = `<span class="msg ${c || ""}">${esc(t)}</span>`; };
const notif = (to, type, text) => { const n = db.get("notifs"); n.push({ id: uid(), to, type, text, at: Date.now(), read: false }); db.set("notifs", n); };
const imgPng = (file, max = 480) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => { const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL("image/webp", .85)); }; i.onerror = rej; i.src = r.result; }; r.onerror = rej; r.readAsDataURL(file); });
const img = (file, max = 720) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => { const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .72)); }; i.onerror = rej; i.src = r.result; }; r.onerror = rej; r.readAsDataURL(file); });
const logout = () => { signOut(auth).then(() => { toast("Logged out"); go("home"); }); };

// ---------- icons ----------
const P = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', back: '<path d="m15 18-6-6 6-6"/>',
  brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 8v10M9 12h3M12 15h3"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
  code: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  pen: '<path d="M15.7 21.3a1 1 0 0 1-1.4 0l-1.6-1.6a1 1 0 0 1 0-1.4l5.6-5.6a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4z"/><path d="m18 13-1.4-6.9a1 1 0 0 0-.7-.8L3.2 2a1 1 0 0 0-1.2 1.2l3.3 12.7a1 1 0 0 0 .8.7L13 18"/><path d="m2.3 2.3 7.3 7.3"/><circle cx="11" cy="11" r="2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  img: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  imgp: '<path d="M16 5h6M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/><circle cx="9" cy="9" r="2"/>',
  fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  ig: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z"/><path d="M17.5 6.5h.01"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>', home: '<path d="m3 11 9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  feed: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>', chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  useradd: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  send: '<path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/>', camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
};
P.dots = '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>';
const ic = n => `<svg class="i" viewBox="0 0 24 24">${P[n] || ""}</svg>`;
$$("[data-ic]").forEach(el => el.innerHTML = ic(el.dataset.ic));

// ---------- public page content ----------
const R = {};
const focus = [["brain", "AI", "Explore how intelligent tools work and experiment with thoughtful applications."], ["bot", "Robotics", "Learn about sensors, mechanisms, and the process of bringing ideas to life."], ["code", "Programming", "Practice problem-solving and turn concepts into working code."], ["shield", "Cybersecurity", "Build awareness of digital safety and explore responsible security practices."], ["globe", "Web Development", "Discover the tools and techniques behind useful, accessible websites."], ["pen", "Creative Design", "Shape ideas through visual thinking, digital design, and creative making."]];
$("#tiles").innerHTML = [["about", "Who we are", "What the club stands for."], ["events", "What we do", "Workshops, builds and talks."], ["join", "Join us", "Register and become a member."]].map(t => `<a href="#${t[0]}"><h3>${t[1]}</h3><p>${t[2]}</p>${ic("arrow")}</a>`).join("");
$("#focusList").innerHTML = focus.map(f => `<article><h3><span class="ico">${ic(f[0])}</span>${f[1]}</h3><p>${f[2]}</p></article>`).join("");
const ini = n => n.split(" ").filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const RANK = ["President", "General Secretary", "Vice President", "Joint Secretary", "Assistant Joint Secretary", "Membership Secretary", "Treasurer", "Publication Secretary", "Public Relation Secretary", "Event Management Secretary", "Sergeant at arms", "Facilitator", "Executive", "Moderator"];
const rank = p => { const i = RANK.indexOf(p); return i < 0 ? 50 : i; };
const byRank = (a, b) => rank(a.post) - rank(b.post) || String(a.name).localeCompare(b.name);
const defaults = () => [...CONFIG.panelists.map(p => ({ ...p, pop: true })), { id: "moderator", pid: "MOD", name: CONFIG.moderator, post: "Moderator", pop: true }];
const committeeList = () => { const c = db.get("committee"); return c.length ? c : defaults(); };
// person photo: body inside the circle, head popping out above it (use a photo with a transparent background)
const popPh = (p, s, flat) => `<span class="pop${flat ? " f" : ""}" style="--s:${s}px">${p.photo ? `<img class="${flat || p.pop === false ? "flat" : ""}" src="${esc(p.photo)}" alt="${esc(p.name)}">` : `<b>${esc(ini(p.name))}</b>`}</span>`;
R.committee = () => {
  const all = committeeList().slice().sort(byRank), pres = all.filter(p => p.post === "President"), gs = all.filter(p => p.post === "General Secretary"), rest = all.filter(p => p.post !== "President" && p.post !== "General Secretary");
  const card = z => p => `<div class="mem s${z}">${popPh(p, z)}<h3>${esc(p.name)}</h3><p>${esc(p.post)}</p></div>`;
  $("#comList").innerHTML = `<div class="c1">${pres.map(card(170)).join("")}</div><div class="c2">${gs.map(card(124)).join("")}</div><div class="c3">${rest.map(card(88)).join("")}</div>`;
};
// Events & activities. To use a real photo: upload it to an "images" folder and set photo: "images/yourfile.jpg"
const EVENTS = [
  { kind: "Workshops", icon: "brain", c: ["#1d4e89", "#6b46c1"], title: "Hands-on Tech Workshops", date: "Dates are announced in the notices feed.", photo: "", desc: "Short, practical sessions where members learn a new tool or skill step by step, from building a first web page to understanding how AI tools work. Beginners are always welcome." },
  { kind: "Coding sessions", icon: "code", c: ["#0e6a86", "#2b3f9e"], title: "Coding Sessions", date: "Dates are announced in the notices feed.", photo: "", desc: "Sit together, solve problems and write real code. Start with the basics of Python or C, then move on to small projects with help from the facilitators." },
  { kind: "Robotics builds", icon: "bot", c: ["#1b8fa6", "#4a3aa7"], title: "Robotics & Electronics Builds", date: "Dates are announced in the notices feed.", photo: "", desc: "Wire up sensors, program an Arduino and watch your idea move. Teams build small robots and smart devices together." },
  { kind: "Talks", icon: "comment", c: ["#5b3fb5", "#2a5fa8"], title: "Tech Talks", date: "Dates are announced in the notices feed.", photo: "", desc: "Short talks and discussions on AI, cybersecurity, careers and emerging technology, with plenty of time for your questions." },
  { kind: "Competitions", icon: "shield", c: ["#2a5fa8", "#7a4fc0"], title: "Competitions & Quizzes", date: "Dates are announced in the notices feed.", photo: "", desc: "Coding contests, tech quizzes and friendly challenges that make learning fun and a little bit competitive." },
  { kind: "Showcases", icon: "globe", c: ["#2b6fb5", "#9b7ee0"], title: "Project Showcases", date: "Dates are announced in the notices feed.", photo: "", desc: "Members present what they have made, such as websites, apps, robots and designs, and get friendly feedback from panelists and friends." }
];
const art = e => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${e.c[0]}"/><stop offset="1" stop-color="${e.c[1]}"/></linearGradient></defs><rect width="400" height="225" fill="url(#g)"/><g fill="none" stroke="#ffffff26" stroke-width="2"><circle cx="340" cy="40" r="95"/><circle cx="340" cy="40" r="62"/><path d="M0 178h110l32-32h96"/><path d="M400 190h-90l-26 26"/></g><circle cx="142" cy="146" r="5" fill="#ffffff66"/><circle cx="284" cy="216" r="5" fill="#ffffff66"/><circle cx="200" cy="112" r="64" fill="#ffffff14"/><g transform="translate(149 61) scale(4.25)" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${P[e.icon]}</g></svg>`);
$("#evList").innerHTML = EVENTS.map(e => `<article><span class="chip">${esc(e.kind)}</span><h3>${esc(e.title)}</h3><img class="evimg" loading="lazy" src="${e.photo ? esc(e.photo) : art(e)}" alt="${esc(e.title)}"><p>${esc(e.desc)}</p><p class="d">${esc(e.date)}</p></article>`).join("");
$("#prList").innerHTML = [1, 2].map(() => `<article class="proj"><div class="pic">${ic("imgp")}<span>[Add project image]</span></div><h3>[Project title]</h3><p>[Add project summary]</p><p class="tech">[Add technologies]</p></article>`).join("");
if ($("#rules")) $("#rules").innerHTML = `<h3>Registration rules</h3>${rulesList()}<p class="muted small">By registering you agree to follow these rules.</p>`;
$$("[data-social]").forEach(a => { const u = CONFIG[a.dataset.social]; if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; } });

// ---------- registration / login / reset ----------
const ERR = { "auth/invalid-credential": "Wrong ID/email or password.", "auth/wrong-password": "Wrong ID/email or password.", "auth/user-not-found": "No account found.", "auth/invalid-email": "That email does not look right.", "auth/email-already-in-use": "This ID or email already has an account. Please log in.", "auth/weak-password": "Password must be at least 6 characters.", "auth/too-many-requests": "Too many tries. Please wait a few minutes.", "auth/network-request-failed": "No internet connection.", "auth/popup-closed-by-user": "Google sign-in was closed.", "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase yet." };
const eMsg = e => ERR[e.code] || "Something went wrong: " + (e.code || e.message);
R.register = pg => {
  pg.innerHTML = `<header class="ph"><h2>Registration</h2><p class="lead">Use the ID number of your club form. If it is in the member list you can log in at once. Otherwise a panelist reviews your request.</p></header>
  <details class="rule-box"><summary>Read the registration rules</summary>${rulesList()}</details>
  <form id="regF" class="form"><div class="two"><label>Name<input name="name" required></label><label>Roll<input name="roll" inputmode="numeric" required></label></div>
  <div class="two"><label>Class<select name="cls" required><option value="">Select</option>${[6, 7, 8, 9, 10, 11, 12].map(c => `<option value="${c}">Class ${c}</option>`).join("")}</select></label><label>ID number<input name="sid" required pattern="[A-Za-z0-9_\\-]+" title="Letters, numbers, - and _ only"></label></div>
  <div class="two"><label>Mobile (WhatsApp)<input name="phone" type="tel" required></label><label>Email<input name="email" type="email" required></label></div>
  <label>Why do you want to join?<textarea name="why" rows="4" required placeholder="Write in detail"></textarea></label>
  <label>What do you want to learn?<select name="learn" required><option value="">Select</option>${CONFIG.learn.map(l => `<option>${l}</option>`).join("")}</select></label>
  <div class="two"><label>Password<input name="pw" type="password" minlength="6" required></label><label>Confirm password<input name="pw2" type="password" required></label></div>
  <label class="chk"><input type="checkbox" name="agree" required> I have read the rules and agree to follow them.</label><button class="btn primary">Submit registration</button><p id="regMsg"></p></form>`;
  $("#regF").onsubmit = async e => {
    e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)); d.email = d.email.trim().toLowerCase(); d.sid = d.sid.trim().toLowerCase();
    if (d.pw !== d.pw2) return msg("#regMsg", "Passwords do not match.", "err");
    const btn = $("button.primary", f); btn.disabled = true; msg("#regMsg", "Please wait…"); authBusy = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, authEmail(d.sid), d.pw), id = cred.user.uid;
      const base = { id, sid: d.sid, name: d.name.trim(), roll: d.roll.trim(), cls: d.cls, phone: d.phone.trim(), phone10: dg(d.phone), email: d.email, why: d.why.trim(), learn: d.learn, prog: [], at: Date.now() };
      let match = true;
      try { await setDoc(doc(fs, "members", id), { ...base, status: "approved", mid: d.sid, how: "list", decidedAt: Date.now(), decidedBy: "Member list" }); }
      catch (er) { match = false; await setDoc(doc(fs, "members", id), { ...base, status: "pending" }); }
      await addDoc(collection(fs, "notifs"), { to: "p", type: match ? "joined" : "apply", text: match ? `${base.name} joined. The ID matched the member list.` : `${base.name} (Class ${base.cls}) applied to join.`, at: Date.now(), read: false }).catch(() => {});
      pg.innerHTML = `<div class="panel"><h3>Thank you, ${esc(base.name)}!</h3><p class="muted">${match ? "Your ID matched the club member list, so your account is ready." : "Your ID number is not in the member list yet, so your request went to the panelists. They will accept or reject it. Open this site again later to check."}</p><a class="btn primary" href="#${match ? "m-home" : "home"}">${match ? "Open my account" : "Back to home"}</a></div>`;
    } catch (er) { btn.disabled = false; msg("#regMsg", eMsg(er), "err"); }
    setTimeout(() => { authBusy = false; }, 900);
  };
};
let loginMode = "login";
R.login = pg => {
  loginMode = "login";
  const draw = () => {
    const isL = loginMode === "login";
    pg.innerHTML = `<header class="ph"><h2>${isL ? "Log in" : "Panelist account"}</h2><p class="lead">${isL ? "Members: use your ID number and password. Panelists and admin: use your email." : "First time? Create your password with the email the admin added for you."}</p></header>` + (isL
      ? `<form id="lgF" class="form"><label>ID number or email<input name="key" required autocomplete="username"></label><label>Password<input name="pw" type="password" required autocomplete="current-password"></label><button class="btn primary">Log in</button><a href="#forgot" class="lnk">Forgot password?</a><p id="lgMsg"></p></form>
         <button class="btn ghost" id="gBtn" type="button">Continue with Google (panelists &amp; admin)</button>
         <p class="muted small">New member? <a class="lnk" href="#register">Register</a> · New panelist? <a class="lnk" href="#" id="toNew">Create account</a></p>`
      : `<form id="lgF" class="form"><label>Email<input name="key" type="email" required></label><label>New password (min 6)<input name="pw" type="password" minlength="6" required></label><label>Confirm password<input name="pw2" type="password" required></label><button class="btn primary">Create account</button><p id="lgMsg"></p></form><p class="muted small"><a class="lnk" href="#" id="toLogin">Back to log in</a></p>`);
    const finish = async user => {
      await waitFor(() => authState.settled && authState.user && authState.user.uid === user.uid, 8000);
      if (authState.role) { authBusy = false; return go(authState.role + "-home"); }
      const why = authState.pending === "rejected" ? "Your request was not approved. Please contact a panelist." : authState.pending ? "Your registration is still waiting for approval." : "This email is not added as a panelist yet. Please ask the admin to add it, then log in again.";
      const wait = authState.pending === "pending"; await signOut(auth); msg("#lgMsg", why, wait ? "" : "err"); setTimeout(() => { authBusy = false; }, 900);
    };
    const run = async fn => { authBusy = true; msg("#lgMsg", "Please wait…"); try { await finish((await fn()).user); } catch (er) { authBusy = false; msg("#lgMsg", eMsg(er), "err"); } };
    $("#lgF").onsubmit = e => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), key = d.key.trim().toLowerCase();
      if (!isL) { if (d.pw !== d.pw2) return msg("#lgMsg", "Passwords do not match.", "err"); return run(() => createUserWithEmailAndPassword(auth, key, d.pw)); }
      run(() => signInWithEmailAndPassword(auth, key.includes("@") ? key : authEmail(key), d.pw));
    };
    if ($("#gBtn")) $("#gBtn").onclick = () => run(() => signInWithPopup(auth, new GoogleAuthProvider()));
    if ($("#toNew")) $("#toNew").onclick = e => { e.preventDefault(); loginMode = "new"; draw(); };
    if ($("#toLogin")) $("#toLogin").onclick = e => { e.preventDefault(); loginMode = "login"; draw(); };
  };
  draw();
};
R.forgot = pg => {
  pg.innerHTML = `<header class="ph"><h2>Reset password</h2><p class="lead">Panelists and admin: enter your email, and a reset link is sent to it. Members: enter your ID number. The link goes to the club email inbox and a panelist will forward it to you.</p></header>
  <form id="fF" class="form"><label>ID number or email<input name="key" required></label><button class="btn primary">Send reset link</button><p id="fM"></p></form>
  <div class="panel"><h3>Need help faster?</h3><p class="muted">Contact a panelist. They can forward the link to you.</p><a class="btn ghost sm" href="#contact">Contact</a></div>`;
  $("#fF").onsubmit = async e => {
    e.preventDefault(); const key = new FormData(e.target).get("key").trim().toLowerCase(), isMail = key.includes("@");
    try { await sendPasswordResetEmail(auth, isMail ? key : authEmail(key)); msg("#fM", isMail ? "Done. Check your email for the reset link." : "Done. The link was sent to the club email. Ask a panelist to forward it to you.", "ok"); }
    catch (er) { msg("#fM", eMsg(er), "err"); }
  };
};

R.gallery = () => {
  const L = db.get("gallery").slice().sort((a, b) => b.at - a.at);
  $("#gaList").innerHTML = L.length ? L.map(g => `<figure class="gi" data-src="${g.id}"><img loading="lazy" src="${g.photo}" alt="${esc(g.caption || "SSACITC photo")}">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`).join("") : ["club", "workshop", "project", "event"].map(t => `<div class="pic">${ic("img")}<span>No ${t} photos yet</span></div>`).join("");
  $$(".gi", $("#gallery")).forEach(f => f.onclick = () => { const g = L.find(x => x.id === f.dataset.src); $("#lb").innerHTML = `<img src="${g.photo}" alt=""><p>${esc(g.caption || "")}</p>`; $("#lb").hidden = false; });
};
$("#lb").onclick = () => { $("#lb").hidden = true; };

// ---------- feed (notices) ----------
let openId = null;
const postCard = (n, s) => {
  const k = s.role + s.id, mine = s.role === "p" && n.by === s.id;
  return `<article class="post" data-id="${n.id}">${n.photo ? `<img src="${n.photo}" alt="">` : ""}<div class="pb"><h3>${esc(n.title)}</h3><p>${esc(n.desc)}</p><small class="muted">${esc(n.byName)} · ${ago(n.at)}</small>
  <div class="pa"><button data-a="like" class="${n.likes.includes(k) ? "on" : ""}">${ic("heart")} ${n.likes.length}</button><button data-a="cm">${ic("comment")} ${n.comments.length}</button><button data-a="sh">${ic("share")} ${n.shares || 0}</button>${mine ? `<button data-a="del">${ic("trash")}</button>` : ""}</div>
  <div class="cms" ${n.id === openId ? "" : "hidden"}>${n.comments.map(c => `<p><b>${esc(c.name)}</b> ${esc(c.text)}</p>`).join("")}<form class="cf"><input placeholder="Write a comment" required><button class="btn primary" aria-label="Send">${ic("send")}</button></form></div></div></article>`;
};
const feed = pg => {
  const s = session(), title = pg.id === "notices" ? "Notices" : "Feed";
  if (!s) { pg.innerHTML = `<header class="ph"><h2>Notices</h2><p class="lead">Club notices and posts are for registered members.</p></header><div class="panel"><p class="muted">Please log in to read the latest posts.</p><div class="btns row"><a class="btn primary" href="#login">Log in</a><a class="btn ghost" href="#register">Register</a></div></div>`; return; }
  const L = db.get("notices").slice().reverse();
  pg.innerHTML = `<header class="ph"><h2>${title}</h2><p class="lead">Latest posts from the panelists.</p></header><div class="feed">${L.length ? L.map(n => postCard(n, s)).join("") : '<p class="muted">No posts yet.</p>'}</div>`;
  pg.onclick = e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const art = b.closest(".post"), A = db.get("notices"), n = A.find(x => x.id === art.dataset.id), k = s.role + s.id;
    if (b.dataset.a === "cm") { openId = openId === n.id ? null : n.id; return feed(pg); }
    if (b.dataset.a === "like") n.likes = n.likes.includes(k) ? n.likes.filter(x => x !== k) : [...n.likes, k];
    if (b.dataset.a === "sh") { n.shares = (n.shares || 0) + 1; const t = `${n.title} – SSACITC\n${n.desc}`; navigator.share ? navigator.share({ title: n.title, text: t }).catch(() => {}) : navigator.clipboard && navigator.clipboard.writeText(t).then(() => toast("Copied to share")); }
    if (b.dataset.a === "del") { if (!confirm("Delete this post?")) return; A.splice(A.indexOf(n), 1); }
    db.set("notices", A); feed(pg);
  };
  pg.onsubmit = e => {
    e.preventDefault(); const art = e.target.closest(".post"), A = db.get("notices"), n = A.find(x => x.id === art.dataset.id), txt = $("input", e.target).value.trim(); if (!txt) return;
    const who = s.role === "m" ? curM() : curP(); n.comments.push({ name: who.name, text: txt, at: Date.now() }); openId = n.id; db.set("notices", A);
    notif("p", "comment", `${who.name} commented on “${n.title}”: ${txt.slice(0, 60)}`); feed(pg);
  };
};
R["m-feed"] = R["p-feed"] = feed;

// ---------- member area ----------
R["m-home"] = pg => {
  const m = curM(), n = db.get("notifs").filter(x => x.to === m.id).reverse(), pr = m.prog || [], pct = Math.round(pr.length / CONFIG.steps.length * 100);
  const posts = db.get("notices").slice().reverse().slice(0, 2), t = TOPIC[m.learn] || ["Explore and learn at your own pace.", ["Ask a panelist where to start", "Pick one small project", "Share what you learn"]];
  pg.innerHTML = `<div class="sparks">${Array.from({ length: 10 }, (_, i) => `<i style="left:${i * 10 + 3}%;animation-delay:${i * .45}s"></i>`).join("")}</div>
  <h2 class="wl">${[..."Welcome, " + m.name.split(" ")[0] + "!"].map((c, i) => `<span style="--i:${i}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("")}</h2>
  <p class="muted">You are now an active member of SSACITC. This is your space to learn, follow club news and track your progress.</p>
  <div class="dcard"><img src="logo.jpg" alt=""><div><small>SSACITC · Digital member card</small><h3>${esc(m.name)}</h3><p>ID ${esc(m.mid || m.sid || "—")} · Class ${esc(m.cls)}</p><p>Roll ${esc(m.roll)}</p></div><em>Active member</em></div>
  ${n.length ? `<div class="panel"><h3>Updates</h3>${n.map(x => `<p class="msg">${esc(x.text)}</p>`).join("")}</div>` : ""}
  <div class="panel"><h3>Your learning path: ${esc(m.learn)}</h3><p class="muted">${t[0]}</p><ul class="plain">${t[1].map(x => `<li>${x}</li>`).join("")}</ul><div class="bar"><i style="width:${pct}%"></i></div><p class="muted small">${pct}% of your steps completed</p><div class="btns row"><a class="btn primary sm" href="#m-profile">Update progress</a></div></div>
  <div class="panel"><h3>Free resources to start</h3><p class="muted small">Handpicked places to learn ${esc(m.learn)} on your own.</p>${(RES[m.learn] || []).map(r => `<a class="mp" href="${r[1]}" target="_blank" rel="noopener"><b>${r[0]}</b><small class="muted">${r[1].replace("https://", "")}</small></a>`).join("")}<p class="muted small">Your next step: <b>${esc(CONFIG.steps.find((x, i) => !pr.includes(i)) || "You finished every step. Great work!")}</b></p></div>
  <h3 class="sh">What you can do here</h3>
  <div class="qa"><a href="#m-notices">${ic("file")}<b>Notices</b><small>Official club notices</small></a><a href="#m-feed">${ic("feed")}<b>Club feed</b><small>Notices and news from the panelists</small></a><a href="#m-profile">${ic("user")}<b>My profile</b><small>Photo, progress and badges</small></a><a href="#m-about">${ic("globe")}<b>About SSACITC</b><small>Mission, vision and focus areas</small></a></div>
  <div class="panel"><h3>Latest from the panelists</h3>${posts.length ? posts.map(x => `<a class="mp" href="#m-feed"><b>${esc(x.title)}</b><small class="muted">${esc(x.byName)} · ${ago(x.at)}</small></a>`).join("") : '<p class="muted">No notices yet. When panelists post news, events or tasks, they will show up here and in the feed.</p>'}</div>
  <div class="panel"><h3>About the club</h3><p class="muted">SSACITC is the Information Technology Club of Safiuddin Sarker Academy and College. We learn by doing: workshops, coding sessions, robotics builds, talks and showcases where every member can try, make mistakes and grow. Whether you are a beginner or already building things, there is a place for you here.</p></div>
  <div class="panel"><h3>Member guidelines</h3><ol class="how"><li>Be kind and respectful to everyone.</li><li>Use technology responsibly and honestly.</li><li>Keep your password and ID private.</li><li>Join sessions and ask questions freely.</li><li>Share your work and help other members.</li></ol></div>`;
};
R["m-profile"] = pg => {
  const m = curM(), pr = m.prog || [], pct = Math.round(pr.length / CONFIG.steps.length * 100), save = fn => { const L = members(); fn(L.find(x => x.id === m.id)); db.set("members", L); R["m-profile"](pg); };
  pg.innerHTML = `<header class="ph"><h2>Profile</h2></header><div class="me"><label class="av big">${m.photo ? `<img src="${m.photo}" alt="">` : ic("user")}<input type="file" accept="image/*" hidden id="phIn"><span class="cam">${ic("camera")}</span></label><h3>${esc(m.name)}</h3><p class="muted">ID ${esc(m.mid || "—")} · Class ${esc(m.cls)} · Roll ${esc(m.roll)}</p><p class="muted small">${esc(m.email)} · ${esc(m.phone)}</p>${m.at ? `<p class="muted small">Member since ${new Date(m.at).toLocaleDateString()}</p>` : ""}</div>
  <div class="panel"><h3>My details</h3><dl class="kv"><dt>Name</dt><dd>${esc(m.name)}</dd><dt>ID number</dt><dd>${esc(m.sid)}</dd><dt>Class</dt><dd>${esc(m.cls)}</dd><dt>Roll</dt><dd>${esc(m.roll)}</dd><dt>Mobile</dt><dd>${esc(m.phone)}</dd><dt>Email</dt><dd>${esc(m.email)}</dd><dt>Learning</dt><dd>${esc(m.learn)}</dd></dl><p class="muted small"><b>Why I joined:</b> ${esc(m.why)}</p></div>
  <div class="panel"><h3>Badges</h3><p>${[["Registered", true], ["Photo added", !!m.photo], ["First step done", pr.length >= 1], ["Halfway there", pct >= 50], ["Path complete", pct === 100]].map(b => `<span class="chip ${b[1] ? "" : "off"}">${b[1] ? "✓ " : ""}${b[0]}</span>`).join(" ")}</p></div>
  <div class="panel"><h3>Progress: ${esc(m.learn)}</h3><div class="bar"><i style="width:${pct}%"></i></div><p class="muted small">${pct}% complete</p>${CONFIG.steps.map((s, i) => `<label class="chk"><input type="checkbox" data-i="${i}" ${pr.includes(i) ? "checked" : ""}> ${esc(s)}</label>`).join("")}</div>
  <button class="btn ghost" id="lo">${ic("logout")} Log out</button>`;
  $("#phIn").onchange = async e => { const f = e.target.files[0]; if (f) { const p = await img(f, 300); save(x => x.photo = p); } };
  $$("[data-i]", pg).forEach(c => c.onchange = () => save(x => { const i = +c.dataset.i, a = x.prog || []; x.prog = c.checked ? [...new Set([...a, i])] : a.filter(v => v !== i); }));
  $("#lo").onclick = logout;
};

// ---------- panelist area ----------
R["p-home"] = pg => {
  const p = curP(), N = db.get("notifs").filter(x => x.to === "p").reverse(), un = N.filter(x => !x.read).length, ms = members(), pend = ms.filter(m => m.status === "pending");
  const posts = db.get("notices").slice().reverse(), hr = new Date().getHours(), g = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  pg.innerHTML = `<div class="phead"><div><small class="muted">${g}</small><h2>${esc(p.name)}</h2><span class="chip">${esc(p.post)}</span></div><button class="bell" id="bell" aria-label="Notifications">${ic("bell")}${un ? `<b>${un}</b>` : ""}</button></div>
  <div class="panel" id="nl" hidden><h3>Notifications</h3>${N.length ? N.slice(0, 30).map(x => `<p class="msg ${x.read ? "" : "new"}"><b>${{ apply: "New request", joined: "New member", comment: "New comment" }[x.type] || "Update"}</b><br>${esc(x.text)} <small class="muted">${ago(x.at)}</small></p>`).join("") : '<p class="muted">Nothing yet. New applications and comments will appear here.</p>'}</div>
  <div class="panel accent"><h3>Your role</h3><p>${ROLE[p.post] || "You help lead SSACITC and support its members."}</p></div>
  <div class="stats"><div><b>${pend.length}</b><span>Pending requests</span></div><div><b>${ms.filter(m => m.status === "approved").length}</b><span>Members</span></div><div><b>${posts.length}</b><span>Posts</span></div></div>
  <h3 class="sh">Quick actions</h3>
  <div class="qa"><a href="#p-post">${ic("plus")}<b>Notice &amp; Post</b><small>Publish a notice or a post</small></a><a href="#p-roster">${ic("useradd")}<b>Add members</b><small>${db.get("roster").length} in the member list</small></a><a href="#p-requests">${ic("comment")}<b>Requests</b><small>${pend.length} waiting for review</small></a><a href="#p-feed">${ic("feed")}<b>Feed</b><small>See likes and comments</small></a><a href="#p-me">${ic("user")}<b>My profile</b><small>Photo, bio and password</small></a>${authState.admin ? `<a href="#p-committee">${ic("user")}<b>Committee</b><small>Add, edit or remove panelists</small></a><a href="#p-gallery">${ic("img")}<b>Gallery</b><small>Add or delete photos</small></a>` : ""}</div>
  <div class="panel"><h3>Waiting for review</h3>${pend.length ? pend.slice(0, 3).map(m => `<a class="mp" href="#p-requests"><b>${esc(m.name)}</b><small class="muted">Class ${esc(m.cls)} · wants to learn ${esc(m.learn)} · ${ago(m.at)}</small></a>`).join("") + (pend.length > 3 ? `<small class="muted">+${pend.length - 3} more</small>` : "") : '<p class="muted">No pending requests right now. New registrations will show up here.</p>'}</div>
  <div class="panel"><h3>Latest posts</h3>${posts.slice(0, 2).map(n => `<a class="mp" href="#p-feed"><b>${esc(n.title)}</b><small class="muted">${esc(n.byName)} · ${n.likes.length} likes · ${n.comments.length} comments · ${ago(n.at)}</small></a>`).join("") || '<p class="muted">No posts yet. Publish the first notice to start the club feed.</p>'}</div>
  <div class="panel"><h3>How the panelist panel works</h3><ol class="how"><li><b>Add members.</b> Enter the ID, name, roll, section and mobile of every student who bought the club form. When they register with the same ID, they can log in at once.</li><li><b>Review requests.</b> If an ID is not in the list, the request comes to you. Accept or reject it. Every decision is saved in History.</li><li><b>Publish notices and posts.</b> A notice uses the official club format and can be saved as a PDF. A post goes to the feed, where members can like, comment and share.</li><li><b>Keep the feed alive.</b> Reply to comments and post regularly so members stay interested.</li><li><b>Keep your profile ready.</b> Add a photo and a short bio so members know who you are.</li></ol></div>`;
  $("#bell").onclick = () => { const l = $("#nl"); l.hidden = !l.hidden; if (!l.hidden) { const A = db.get("notifs"); A.forEach(x => { if (x.to === "p") x.read = true; }); db.set("notifs", A); const b = $("#bell b"); if (b) b.remove(); } };
};
// ---------- official notices ----------
const fdate = d => new Date(d).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
let viewId = null, npTab = "notice";
const sheet = n => `<article class="sheet"><div class="sh-head"><img src="logo.jpg" alt=""><h2>Safiuddin Sarker Academy and College Information and Technology Club</h2><p>Tongi, Gazipur</p></div>
  <p class="sh-date">Date: ${fdate(n.date)}</p><h3 class="sh-title">${esc(n.title)}</h3><div class="sh-body">${esc(n.desc).replace(/\n/g, "<br>")}</div>${n.photo ? `<img class="sh-photo" src="${n.photo}" alt="">` : ""}
  <div class="sh-foot"><p>Published by:<br><b>${esc(n.byName)}</b><br><small>${esc(n.post || "")}</small></p><p class="sh-auth">আদেশক্রমে,<br><b>কর্তৃপক্ষ</b></p></div></article>`;
const noticeList = () => { const L = db.get("formal").slice().reverse(); return L.length ? L.map(n => `<button class="nrow" data-n="${n.id}"><span><b>${esc(n.title)}</b><small class="muted">${fdate(n.date)} · ${esc(n.byName)}</small></span>${ic("arrow")}</button>`).join("") : '<p class="muted">No notices yet.</p>'; };
const bindList = (pg, role) => $$("[data-n]", pg).forEach(b => b.onclick = () => { viewId = b.dataset.n; go(role + "-notice"); });
R["m-notices"] = pg => { pg.innerHTML = `<header class="ph"><h2>Notices</h2><p class="lead">Official notices from the club. Tap a title to open it.</p></header><div class="nlist">${noticeList()}</div>`; bindList(pg, "m"); };
R.notices = pg => {
  const s = session();
  if (!s) { pg.innerHTML = `<header class="ph"><h2>Notices</h2><p class="lead">Official club notices are for registered members.</p></header><div class="panel"><p class="muted">Please log in to read the notices.</p><div class="btns row"><a class="btn primary" href="#login">Log in</a><a class="btn ghost" href="#register">Register</a></div></div>`; return; }
  pg.innerHTML = `<header class="ph"><h2>Notices</h2><p class="lead">Official notices from the club. Tap a title to open it.</p></header><div class="nlist">${noticeList()}</div>`; bindList(pg, s.role);
};
R["m-notice"] = R["p-notice"] = pg => {
  const s = session(), n = db.get("formal").find(x => x.id === viewId);
  if (!n) { pg.innerHTML = `<header class="ph"><h2>Notice</h2></header><p class="muted">Choose a notice from the list.</p><a class="btn primary" href="#${s.role === "p" ? "p-post" : "m-notices"}">Open notices</a>`; return; }
  pg.innerHTML = `${sheet(n)}<div class="btns row"><button class="btn primary" id="pdf">Download PDF</button>${s.role === "p" && n.by === s.id ? '<button class="btn ghost" id="ndel">Delete</button>' : ""}</div><p class="muted small">Tap Download PDF, then choose “Save as PDF” in the print window.</p>`;
  $("#pdf").onclick = () => window.print();
  if ($("#ndel")) $("#ndel").onclick = () => { if (!confirm("Delete this notice?")) return; db.set("formal", db.get("formal").filter(x => x.id !== n.id)); viewId = null; toast("Notice deleted"); go("p-post"); };
};
R["p-post"] = pg => {
  let photo = ""; const p = curP(), isN = npTab === "notice", today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  pg.innerHTML = `<header class="ph"><h2>${isN ? "Notice panel" : "New post"}</h2><p class="lead">${isN ? "Write a title and description. It is published in the official club notice format and can be saved as a PDF." : "Share news with members in the feed. They can like, comment and share."}</p></header>
  <div class="tabs"><button class="${isN ? "on" : ""}" data-t="notice">Notice</button><button class="${isN ? "" : "on"}" data-t="post">Post</button></div>
  <form id="pF" class="form"><label>Title<input name="title" required></label>${isN ? `<label>Date<input name="date" type="date" value="${today}" required></label>` : ""}<label>Description<textarea name="desc" rows="${isN ? 6 : 5}" required></textarea></label><label class="file">${ic("camera")} Add photo (optional)<input type="file" accept="image/*" hidden id="pPh"></label><img id="pPv" class="prev" hidden alt=""><button class="btn primary">${isN ? "Publish notice" : "Publish post"}</button></form>` + (isN ? `<h3 class="sh">All notices</h3><div class="nlist">${noticeList()}</div>` : "");
  $$(".tabs button", pg).forEach(b => b.onclick = () => { npTab = b.dataset.t; R["p-post"](pg); });
  $("#pPh").onchange = async e => { const f = e.target.files[0]; if (!f) return; photo = await img(f); const v = $("#pPv"); v.src = photo; v.hidden = false; };
  $("#pF").onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    if (isN) { const L = db.get("formal"), n = { id: uid(), title: d.title.trim(), desc: d.desc.trim(), date: d.date, photo, by: p.id, byName: p.name, post: p.post, at: Date.now() }; L.push(n); if (db.set("formal", L)) { viewId = n.id; toast("Notice published"); go("p-notice"); } }
    else { const L = db.get("notices"); L.push({ id: uid(), title: d.title, desc: d.desc, photo, by: p.id, byName: p.name, at: Date.now(), likes: [], comments: [], shares: 0 }); if (db.set("notices", L)) { toast("Post published"); go("p-feed"); } }
  };
  bindList(pg, "p");
};
let reqTab = "pending", rq = "";
let cEdit = null, cPhoto = null, gPhoto = "";
R["p-committee"] = pg => {
  const C = db.get("committee").sort(byRank), S = db.get("staff"), emailOf = id => (S.find(x => x.cid === id) || {}).email || "";
  const form = p => `<form id="cF" class="panel form"><h3>${p ? "Edit panelist" : "Add panelist"}</h3><label>Name<input name="name" required value="${esc(p && p.name)}"></label><label>Post<input name="post" list="posts" required value="${esc(p && p.post)}"></label><datalist id="posts">${RANK.map(r => `<option value="${r}">`).join("")}</datalist>
    <label>Login email (the panelist logs in with this)<input name="email" type="email" value="${esc(p && emailOf(p.id))}" placeholder="name@gmail.com"></label>
    <label class="file">${ic("camera")} ${p && p.photo ? "Change photo" : "Add photo"}<input type="file" accept="image/*" hidden id="cPh"></label><img id="cPv" class="prev" hidden alt="">
    <label class="chk"><input type="checkbox" name="pop" ${!p || p.pop !== false ? "checked" : ""}> Pop-out style (use a photo with a transparent background, so the head shows outside the circle)</label>
    <div class="btns row"><button class="btn primary">Save</button><button type="button" class="btn ghost" id="cC">Cancel</button></div></form>`;
  pg.innerHTML = `<header class="ph"><h2>Committee</h2><p class="lead">Add, edit or remove panelists, change photos and choose which email belongs to which panelist.</p></header>` +
    (cEdit ? form(cEdit === "new" ? null : C.find(x => x.id === cEdit)) : `<div class="btns row"><button class="btn primary sm" id="cNew">Add panelist</button>${C.length ? "" : '<button class="btn ghost sm" id="cImp">Import default committee</button>'}</div>`) +
    `<div>${C.map(p => `<div class="row2 lrow"><span class="lp">${popPh(p, 52, true)}<span><b>${esc(p.name)}</b><br><small class="muted">${esc(p.post)} · ${esc(emailOf(p.id)) || "no email yet"}</small></span></span><span><button data-e="${p.id}">Edit</button><button data-d="${p.id}">Remove</button></span></div>`).join("") || '<p class="muted">The committee is empty. Import the default list or add people.</p>'}</div>`;
  const redraw = () => R["p-committee"](pg);
  if ($("#cNew")) $("#cNew").onclick = () => { cEdit = "new"; cPhoto = null; redraw(); };
  if ($("#cImp")) $("#cImp").onclick = () => { db.set("committee", defaults().map((p, i) => ({ id: p.id.startsWith("SSAC") ? "p" + String(i + 1).padStart(2, "0") : p.id, pid: p.pid || p.id, name: p.name, post: p.post, pop: true }))); toast("Imported"); redraw(); };
  if ($("#cC")) $("#cC").onclick = () => { cEdit = null; redraw(); };
  if ($("#cPh")) $("#cPh").onchange = async e => { const f = e.target.files[0]; if (!f) return; cPhoto = await imgPng(f, 480); const v = $("#cPv"); v.src = cPhoto; v.hidden = false; };
  if ($("#cF")) $("#cF").onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), A = db.get("committee"); let it = cEdit === "new" ? { id: "p" + Date.now().toString(36), pid: "SSAC-P" + String(A.length + 1).padStart(2, "0") } : A.find(x => x.id === cEdit);
    it.name = d.name.trim(); it.post = d.post.trim(); it.pop = !!d.pop; if (cPhoto) it.photo = cPhoto; if (cEdit === "new") A.push(it); db.set("committee", A);
    const em = d.email.trim().toLowerCase(), M = db.get("staff").filter(x => x.cid !== it.id); if (em) M.push({ id: em, email: em, cid: it.id }); db.set("staff", M);
    cEdit = null; cPhoto = null; toast("Saved"); redraw();
  };
  pg.onclick = e => {
    const ed = e.target.closest("[data-e]"), dl = e.target.closest("[data-d]");
    if (ed) { cEdit = ed.dataset.e; cPhoto = null; redraw(); }
    if (dl && confirm("Remove this panelist from the committee?")) { db.set("committee", db.get("committee").filter(x => x.id !== dl.dataset.d)); db.set("staff", db.get("staff").filter(x => x.cid !== dl.dataset.d)); redraw(); }
  };
};
R["p-gallery"] = pg => {
  const L = db.get("gallery").sort((a, b) => b.at - a.at); gPhoto = "";
  pg.innerHTML = `<header class="ph"><h2>Gallery</h2><p class="lead">Photos you add here appear on the public Gallery page.</p></header>
  <form id="gF" class="panel form"><label class="file">${ic("camera")} Choose photo<input type="file" accept="image/*" hidden id="gPh"></label><img id="gPv" class="prev" hidden alt=""><label>Caption (optional)<input name="cap" maxlength="80"></label><button class="btn primary">Add to gallery</button><p id="gMsg"></p></form>
  <div class="gal">${L.map(g => `<figure><img src="${g.photo}" alt=""><figcaption><span>${esc(g.caption || "")}</span><button data-d="${g.id}" aria-label="Delete">${ic("trash")}</button></figcaption></figure>`).join("")}</div>`;
  $("#gPh").onchange = async e => { const f = e.target.files[0]; if (!f) return; gPhoto = await img(f, 900); const v = $("#gPv"); v.src = gPhoto; v.hidden = false; };
  $("#gF").onsubmit = e => { e.preventDefault(); if (!gPhoto) return msg("#gMsg", "Choose a photo first.", "err"); const G = db.get("gallery"); G.push({ id: "g" + Date.now().toString(36), photo: gPhoto, caption: new FormData(e.target).get("cap").trim(), at: Date.now(), by: curP().name }); db.set("gallery", G); toast("Added"); R["p-gallery"](pg); };
  pg.onclick = e => { const b = e.target.closest("[data-d]"); if (b && confirm("Delete this photo?")) { db.set("gallery", db.get("gallery").filter(x => x.id !== b.dataset.d)); R["p-gallery"](pg); } };
};
R["p-requests"] = pg => {
  const all = members(), L = all.filter(m => m.status === "pending"), H = all.filter(m => m.status !== "pending").sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0));
  const card = m => `<div class="panel req" data-id="${m.id}"><h3>${esc(m.name)}</h3><p class="muted small">Class ${esc(m.cls)} · Roll ${esc(m.roll)} · ID ${esc(m.sid)}<br>${esc(m.phone)} · ${esc(m.email)}<br>Wants to learn: ${esc(m.learn)} · ${ago(m.at)}</p>${db.get("roster").some(r => r.id === m.sid) ? '<p class="msg">This ID is in the member list, but the mobile number and roll did not match.</p>' : ""}<p>${esc(m.why)}</p><div class="btns row"><button class="btn primary" data-a="ok">Accept</button><button class="btn ghost" data-a="no">Reject</button></div></div>`;
  const hrow = m => `<div class="panel hist"><b>${esc(m.name)}</b> <span class="chip ${m.status}">${m.status === "approved" ? "Accepted" : "Rejected"}</span><small class="muted">ID ${esc(m.sid)} · Class ${esc(m.cls)} · ${m.how === "list" ? "Auto: matched member list" : "By " + esc(m.decidedBy || "a panelist")} · ${m.decidedAt ? new Date(m.decidedAt).toLocaleString() : "earlier"}</small></div>`;
  pg.innerHTML = `<header class="ph"><h2>Requests</h2><p class="lead">When an ID number is not in the member list, the request comes here. Accept or reject it. Every decision is saved in History.</p></header>
  <div class="tabs"><button class="${reqTab === "pending" ? "on" : ""}" data-t="pending">Pending (${L.length})</button><button class="${reqTab === "history" ? "on" : ""}" data-t="history">History (${H.length})</button></div>` +
  (reqTab === "pending" ? (L.length ? L.map(card).join("") : '<p class="muted">No pending requests.</p>') : (H.length ? H.map(hrow).join("") : '<p class="muted">No history yet.</p>'));
  pg.onclick = e => {
    const t = e.target.closest("[data-t]"); if (t) { reqTab = t.dataset.t; return R["p-requests"](pg); }
    const b = e.target.closest("[data-a]"); if (!b) return; const A = members(), m = A.find(x => x.id === b.closest(".req").dataset.id), me = curP();
    if (b.dataset.a === "ok") { m.status = "approved"; m.mid = m.sid; notif(m.id, "approved", `Your request was accepted. Log in with your ID number ${m.sid}. Welcome to SSACITC!`); toast("Accepted"); }
    else { if (!confirm("Reject this request?")) return; m.status = "rejected"; toast("Rejected"); }
    m.how = "panelist"; m.decidedAt = Date.now(); m.decidedBy = me.name; db.set("members", A); R["p-requests"](pg);
  };
};
R["p-roster"] = pg => {
  const L = db.get("roster"), q = rq.toLowerCase(), F = L.filter(r => !q || [r.id, r.name, r.roll, r.section, r.phone].join(" ").toLowerCase().includes(q)), reg = new Set(members().map(m => String(m.sid).toLowerCase()));
  pg.innerHTML = `<header class="ph"><h2>Add members</h2><p class="lead">Add the students who bought the club form. When one of them registers online with the same ID number, they can log in right away. ${L.length} in the list.</p></header>
  <form id="rF" class="panel form"><h3>Add one member</h3><div class="two"><label>ID number<input name="id" required pattern="[A-Za-z0-9_\\-]+" title="Letters, numbers, - and _ only"></label><label>Name<input name="name" required></label></div><div class="two"><label>Roll<input name="roll" required></label><label>Section<input name="section" placeholder="e.g. 9 - A" required></label></div><label>Mobile number<input name="phone" type="tel" required></label><button class="btn primary">Add to list</button><p id="rMsg"></p></form>
  <details class="rule-box"><summary>Add many at once</summary><form id="bF" class="form"><label>One member per line: ID, Name, Roll, Section, Mobile<textarea name="rows" rows="5" placeholder="1001, Rahim Uddin, 12, 9-A, 01712345678" required></textarea></label><button class="btn ghost">Add all</button><p id="bMsg"></p></form></details>
  <label class="srch">${ic("search")}<input id="rs" placeholder="Search the list" value="${esc(rq)}"></label>
  <div>${F.map(r => `<div class="row2"><span><b>${esc(r.name)}</b><br><small class="muted">ID ${esc(r.id)} · Roll ${esc(r.roll)} · ${esc(r.section)} · ${esc(r.phone)}</small></span><span>${reg.has(String(r.id).toLowerCase()) ? '<span class="chip">Registered</span> ' : ""}<button data-del="${esc(r.id)}">Remove</button></span></div>`).join("") || '<p class="muted">Nothing here yet.</p>'}</div>`;
  const has = (A, id) => A.some(x => String(x.id).trim().toLowerCase() === String(id).trim().toLowerCase());
  $("#rF").onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), A = db.get("roster"); if (has(A, d.id)) return msg("#rMsg", "This ID number is already in the list.", "err"); A.push({ id: d.id.trim().toLowerCase(), name: d.name.trim(), roll: d.roll.trim(), section: d.section.trim(), phone: d.phone.trim(), phone10: dg(d.phone), at: Date.now(), by: curP().name }); db.set("roster", A); toast("Added"); R["p-roster"](pg); };
  $("#bF").onsubmit = e => { e.preventDefault(); const A = db.get("roster"); let add = 0, skip = 0; new FormData(e.target).get("rows").split("\n").forEach(line => { const c = line.split(/[,\t]/).map(x => x.trim()); if (c.length < 5 || !/^[A-Za-z0-9_-]+$/.test(c[0]) || has(A, c[0])) { if (line.trim()) skip++; return; } A.push({ id: c[0].toLowerCase(), name: c[1], roll: c[2], section: c[3], phone: c[4], phone10: dg(c[4]), at: Date.now(), by: curP().name }); add++; }); db.set("roster", A); toast(`Added ${add}, skipped ${skip}`); R["p-roster"](pg); };
  $("#rs").oninput = e => { rq = e.target.value; R["p-roster"](pg); const i = $("#rs"); i.focus(); i.setSelectionRange(99, 99); };
  pg.onclick = e => { const b = e.target.closest("[data-del]"); if (!b || !confirm("Remove this member from the list?")) return; db.set("roster", db.get("roster").filter(r => String(r.id) !== b.dataset.del)); R["p-roster"](pg); };
};
let editP = false;
R["p-me"] = pg => {
  const p = curP(), mt = p, mine = db.get("notices").filter(n => n.by === p.id);
  const likes = mine.reduce((a, n) => a + n.likes.length, 0), cms = mine.reduce((a, n) => a + n.comments.length, 0), appr = members().filter(m => m.status === "approved" && m.decidedBy === p.name).length;
  const save = o => { Object.assign(authState.me, o); setDoc(authState.ref, o, { merge: true }).catch(fail); };
  const skills = (mt.skills || "").split(",").map(x => x.trim()).filter(Boolean);
  pg.innerHTML = `<div class="cover"><img src="logo.jpg" alt=""></div>
  <div class="pme"><label class="av big">${mt.photo ? `<img src="${mt.photo}" alt="">` : `<span class="ini">${ini(p.name)}</span>`}<input type="file" accept="image/*" hidden id="phIn"><span class="cam">${ic("camera")}</span></label>
  <h2>${esc(p.name)}</h2><p><span class="chip">${esc(p.post)}</span> <span class="chip alt">ID ${esc(p.pid || p.cid || "")}</span></p>
  <p class="muted bio">${mt.bio ? esc(mt.bio) : "Add a short bio so members know you."}</p></div>
  <div class="stats four"><div><b>${mine.length}</b><span>Posts</span></div><div><b>${likes}</b><span>Likes</span></div><div><b>${cms}</b><span>Comments</span></div><div><b>${appr}</b><span>Approved</span></div></div>
  ${editP ? `<form id="eF" class="panel form"><h3>Edit profile</h3><label>Bio<textarea name="bio" rows="3" maxlength="160">${esc(mt.bio)}</textarea></label><div class="two"><label>Phone / WhatsApp<input name="phone" value="${esc(mt.phone)}"></label><label>Facebook link<input name="fb" value="${esc(mt.fb)}" placeholder="https://"></label></div><label>Skills (comma separated)<input name="skills" value="${esc(mt.skills)}" placeholder="Web, Python, Design"></label><div class="btns row"><button class="btn primary">Save</button><button type="button" class="btn ghost" id="eC">Cancel</button></div></form>`
  : `<div class="panel"><div class="row3"><h3>Details</h3><button class="btn ghost sm" id="eB">Edit</button></div><dl class="kv"><dt>Role</dt><dd>${esc(p.post)}</dd><dt>Panelist ID</dt><dd>${esc(p.pid || p.cid || "")}</dd><dt>Phone</dt><dd>${esc(mt.phone || "—")}</dd><dt>Facebook</dt><dd>${mt.fb ? `<a class="lnk" href="${esc(mt.fb)}" target="_blank" rel="noopener">Open profile</a>` : "—"}</dd></dl>${skills.length ? `<p>${skills.map(x => `<span class="chip">${esc(x)}</span>`).join(" ")}</p>` : ""}</div>`}
  <div class="panel"><h3>My recent posts</h3>${mine.length ? mine.slice(-3).reverse().map(n => `<a class="mp" href="#p-feed"><b>${esc(n.title)}</b><small class="muted">${n.likes.length} likes · ${n.comments.length} comments · ${ago(n.at)}</small></a>`).join("") : '<p class="muted">You have not posted yet.</p>'}<div class="btns row"><a class="btn primary sm" href="#p-post">New notice</a></div></div>
  <div class="panel"><h3>Change password</h3><form id="pwF" class="cf"><input name="pw" type="password" minlength="6" placeholder="New password (min 6)" required><button class="btn ghost sm">Update</button></form></div>
  <button class="btn ghost" id="lo">${ic("logout")} Log out</button>`;
  $("#phIn").onchange = async e => { const f = e.target.files[0]; if (f) { save({ photo: await imgPng(f, 400), pop: false }); R["p-me"](pg); } };
  if (editP) {
    $("#eF").onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), fb = d.fb.trim(); save({ bio: d.bio.trim(), phone: d.phone.trim(), fb: /^https?:\/\//i.test(fb) ? fb : "", skills: d.skills.trim() }); editP = false; toast("Profile saved"); R["p-me"](pg); };
    $("#eC").onclick = () => { editP = false; R["p-me"](pg); };
  } else $("#eB").onclick = () => { editP = true; R["p-me"](pg); };
  $("#pwF").onsubmit = async e => { e.preventDefault(); const f = e.target; try { await updatePassword(auth.currentUser, f.pw.value); f.reset(); toast("Password updated"); } catch (er) { toast(er.code === "auth/requires-recent-login" ? "Please log out, log in again, then change it." : "Could not change it."); } };
  $("#lo").onclick = logout;
};

// ---------- About SSACITC ----------
const ABOUT = [["Web Development", ["HTML, CSS, JavaScript", "Frontend and Backend Development", "Responsive Website Design", "Database Management", "Full-Stack Development"]], ["Programming &amp; Software Development", ["Python, C, C++, Java", "Problem Solving and Algorithms", "Software and Application Development", "Open-Source Projects"]], ["Artificial Intelligence", ["Artificial Intelligence (AI)", "Machine Learning Fundamentals", "Generative AI", "AI-Powered Applications", "Automation and Smart Solutions"]], ["Cybersecurity &amp; Networking", ["Cybersecurity Awareness", "Ethical Hacking Fundamentals", "Internet and Network Technologies", "Online Privacy and Digital Safety"]], ["Robotics &amp; Electronics", ["Robotics Fundamentals", "Arduino and Microcontrollers", "Basic Electronics", "IoT (Internet of Things)", "Smart Device Projects"]], ["Graphic Design &amp; Digital Creativity", ["UI/UX Design", "Graphic Design", "Video Editing and Animation", "Digital Content Creation", "Creative Multimedia Projects"]], ["Technology &amp; Innovation", ["Computer Hardware and Software", "Cloud Computing", "Mobile App Development", "Game Development", "Emerging Technologies"]]];
const AIMS = ["Organize technology workshops and training sessions.", "Teach programming and web development from beginner to advanced levels.", "Build real-world websites, applications, and technology projects.", "Arrange coding competitions, quizzes, and tech events.", "Encourage teamwork, research, and creative problem-solving.", "Help students explore new technologies and develop practical skills.", "Share knowledge and support fellow learners."];
R.about = R["m-about"] = R["p-about"] = pg => {
  pg.innerHTML = `<header class="ph"><h2>About SSACITC</h2><p class="lead">Empowering Students Through Technology, Innovation &amp; Creativity</p></header>
  <p class="muted">Safiuddin Sarker Academy and College Information Technology Club (SSACITC) is a student-focused technology community dedicated to exploring the world of Information Technology, developing practical skills, encouraging innovation, and preparing students for the digital future.</p>
  <p class="muted">We believe that technology is not just about using computers — it’s about creating, solving problems, sharing knowledge, and building something meaningful.</p>
  <p class="muted">Our goal is to create an environment where students can learn, experiment, collaborate, and transform their ideas into real-world projects.</p>
  <h3 class="sh">What We Explore</h3><div class="acc">${ABOUT.map((a, i) => `<details ${i === 0 ? "open" : ""}><summary>${i + 1}. ${a[0]}</summary><ul class="plain">${a[1].map(x => `<li>${x}</li>`).join("")}</ul></details>`).join("")}</div>
  <div class="two2"><div class="panel"><h3>Our Mission</h3><p class="muted">To make technology education accessible, practical, and inspiring for students by encouraging creativity, critical thinking, teamwork, and continuous learning.</p></div><div class="panel"><h3>Our Vision</h3><p class="muted">To build a knowledgeable, creative, and innovative student community where future developers, programmers, designers, researchers, and technology enthusiasts can grow together.</p></div></div>
  <h3 class="sh">What We Aim to Do</h3><ul class="plain">${AIMS.map(x => `<li>${x}</li>`).join("")}</ul>
  <p class="tagline">Learn. Build. Innovate. Inspire.</p><p class="muted">SSACITC — Where Curiosity Meets Technology.</p>`;
};

// ---------- menu, router, back button ----------
$("#menuBtn").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", o); };
const pages = $$("main>section"), stack = [];
const tabs = { m: [["m-home", "Home"], ["m-feed", "Feed"], ["m-notices", "Notices"], ["m-profile", "Profile"], ["m-about", "About SSACITC"]], p: [["p-home", "Home"], ["p-post", "Notice & Post"], ["p-feed", "Feed"], ["p-requests", "Requests"], ["p-roster", "Add members"], ["p-me", "My profile"], ["p-about", "About SSACITC"]] };
const menuFor = r => r === "p" && authState.admin ? [...tabs.p.slice(0, -1), ["p-committee", "Committee"], ["p-gallery", "Gallery"], tabs.p[tabs.p.length - 1]] : tabs[r];
const bn = [["m-home", "home", "Home"], ["m-feed", "feed", "Feed"], ["m-notices", "file", "Notices"], ["m-profile", "user", "Profile"]];
function route() {
  let id = decodeURIComponent(location.hash.slice(1)) || "home"; const s = session();
  if (/^[mp]-/.test(id) && (!s || s.role !== id[0])) return go(s ? s.role + "-home" : "login");
  if ((id === "p-committee" || id === "p-gallery") && !authState.admin) return go(s ? "p-home" : "login");
  const pg = pages.find(p => p.id === id) || pages[0]; id = pg.id;
  if (stack[stack.length - 1] !== id) stack.push(id);
  const app = /^[mp]-/.test(id); document.body.classList.toggle("app", app);
  pages.forEach(p => p.classList.toggle("active", p === pg));
  if (R[id]) R[id](pg);
  $$(".trace>*,.people>*,.projs>*,.mosaic>*,.steps>*,.post,.panel", pg).forEach((el, i) => el.style.setProperty("--i", i));
  $("#backBtn").hidden = ["home", "m-home", "p-home"].includes(id);
  $("#bnav").innerHTML = app && s.role === "m" ? bn.map(b => `<a href="#${b[0]}" class="${b[0] === id ? "on" : ""}">${ic(b[1])}<span>${b[2]}</span></a>`).join("") : "";
  const pend = members().filter(m => m.status === "pending").length;
  $("#kebab").hidden = !app; $("#kmenu").hidden = true;
  if (app) $("#kmenu").innerHTML = menuFor(s.role).map(b => `<a href="#${b[0]}" class="${b[0] === id ? "on" : ""}">${b[1]}${b[0] === "p-requests" && pend ? `<b>${pend}</b>` : ""}</a>`).join("") + `<button id="kout">Log out</button>`;
  $("#acts").innerHTML = s ? `<a href="#${s.role}-home">My account</a>` : `<a href="#register">Registration</a><a href="#login">Log in</a>`;
  $$("#nav>a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + id));
  $("#nav").classList.remove("open"); window.scrollTo(0, 0);
}
$("#backBtn").onclick = () => { stack.pop(); const s = session(); go(stack.pop() || (s ? s.role + "-home" : "home")); };
$("#kebab").onclick = e => { e.stopPropagation(); const k = $("#kmenu"); k.hidden = !k.hidden; };
$("#kmenu").onclick = e => { if (e.target.id === "kout") logout(); };
document.addEventListener("click", () => { $("#kmenu").hidden = true; });
addEventListener("hashchange", () => { if (authState.ready) route(); });

// ---------- live data + sign-in state ----------
let unsubs = [];
const sub = (k, q) => unsubs.push(onSnapshot(q, snap => { cache[k] = snap.docs.map(d => ({ ...d.data(), id: d.id })); refresh(); }, e => console.warn(k, e.code)));
const subStaff = () => { sub("members", collection(fs, "members")); sub("roster", collection(fs, "roster")); sub("notices", collection(fs, "notices")); sub("formal", collection(fs, "formal")); sub("notifs", query(collection(fs, "notifs"), where("to", "==", "p"))); };
PUB.forEach(k => onSnapshot(collection(fs, k), snap => { cache[k] = snap.docs.map(d => ({ ...d.data(), id: d.id })); refresh(); }, e => console.warn(k, e.code)));
const LIVE = ["home", "committee", "gallery", "p-home", "m-home", "m-profile", "m-feed", "p-feed", "m-notices", "notices", "p-requests", "p-roster", "p-me"];
function refresh(full) {
  if (!authState.ready || authBusy) return;
  const pg = pages.find(p => p.classList.contains("active")); if (!pg || pg.id === "register") return;
  const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && pg.contains(a)) return;
  if (full) return route();
  if (LIVE.includes(pg.id) && R[pg.id]) R[pg.id](pg);
}
onAuthStateChanged(auth, async user => {
  unsubs.forEach(u => u()); unsubs = []; PRIV.forEach(k => cache[k] = []);
  Object.assign(authState, { ready: true, user, role: null, me: null, ref: null, admin: false, pending: null, unmapped: false, settled: false });
  document.body.classList.add("ready");
  pages.forEach(p => { if (/^[mp]-/.test(p.id)) { p.innerHTML = ""; p.onclick = p.onsubmit = null; } });
  if (user) {
    const em = (user.email || "").toLowerCase();
    try {
      const st = em && em !== CONFIG.adminEmail ? await getDoc(doc(fs, "staff", em)).catch(() => null) : null;
      if (em === CONFIG.adminEmail) {
        Object.assign(authState, { role: "p", admin: true, ref: doc(fs, "staff", em), me: { name: "Admin", post: "Admin", pid: "ADMIN" } });
        unsubs.push(onSnapshot(authState.ref, s => { authState.me = { name: "Admin", post: "Admin", pid: "ADMIN", ...(s.exists() ? s.data() : {}) }; refresh(); }));
        subStaff(); sub("staff", collection(fs, "staff")); authState.settled = true;
      } else if (st && st.exists()) {
        const cid = st.data().cid; authState.role = "p"; authState.ref = doc(fs, "committee", cid);
        const c = await getDoc(authState.ref); authState.me = { ...(c.exists() ? c.data() : { name: em, post: "Panelist" }), cid };
        unsubs.push(onSnapshot(authState.ref, s => { if (s.exists()) { authState.me = { ...s.data(), cid }; refresh(); } }));
        subStaff(); authState.settled = true;
      } else {
        unsubs.push(onSnapshot(doc(fs, "members", user.uid), s => {
          const m = s.exists() ? { ...s.data(), id: s.id } : null, was = authState.role;
          cache.members = m ? [m] : []; authState.unmapped = !m; authState.pending = m && m.status !== "approved" ? m.status : null; authState.role = m && m.status === "approved" ? "m" : null; authState.settled = true;
          if (authState.role === "m" && was !== "m") { sub("notices", collection(fs, "notices")); sub("formal", collection(fs, "formal")); sub("notifs", query(collection(fs, "notifs"), where("to", "==", user.uid))); }
          refresh(was !== authState.role);
        }, e => { authState.settled = true; console.warn(e.code); }));
      }
    } catch (e) { console.error(e); authState.settled = true; }
    await waitFor(() => authState.settled, 6000);
  }
  if (!authBusy) route();
});
setTimeout(() => { if (!authState.ready) { authState.ready = true; document.body.classList.add("ready"); route(); } }, 7000);

// ---------- background network (floating nodes, like the logo circuit) ----------
(() => {
  const cv = $("#net"); if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const x = cv.getContext("2d"), small = innerWidth < 600, N = small ? 26 : 48, D = small ? 110 : 150; let W, H, raf, pts = [];
  const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  size(); pts = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  const draw = () => {
    x.clearRect(0, 0, W, H);
    for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    for (let i = 0; i < N; i++) {
      const a = pts[i]; x.fillStyle = "rgba(111,216,234,.5)"; x.beginPath(); x.arc(a.x, a.y, 1.8, 0, 6.3); x.fill();
      for (let j = i + 1; j < N; j++) { const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < D) { x.strokeStyle = `rgba(169,142,224,${(1 - d / D) * .32})`; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } }
    }
    raf = requestAnimationFrame(draw);
  };
  draw(); addEventListener("resize", size);
  document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); if (!document.hidden) draw(); });
})();
