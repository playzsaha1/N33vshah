import { useEffect, useMemo, useRef, useState } from "react";
import data from "./data/neev.json";

const navItems = [
  ["home", "Home"],
  ["about", "About"],
  ["countdown", "Birthday Countdown"],
  ["favourites", "Favourite Things"],
  ["usernames", "Online Usernames"],
  ["ask", "Ask Neev Bot"],
  ["secret", "Secret Section"],
  ["red-button", "Big Red Button"],
];

function getBirthdayState(profile) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const birthdayThisYear = new Date(
    currentYear,
    profile.birthdayMonth - 1,
    profile.birthdayDay,
  );
  const isBirthday =
    now.getMonth() === profile.birthdayMonth - 1 &&
    now.getDate() === profile.birthdayDay;
  const nextBirthday =
    now > birthdayThisYear && !isBirthday
      ? new Date(currentYear + 1, profile.birthdayMonth - 1, profile.birthdayDay)
      : birthdayThisYear;
  const distance = Math.max(0, nextBirthday.getTime() - now.getTime());

  return {
    isBirthday,
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    year: nextBirthday.getFullYear(),
  };
}

function getBotAnswer(question) {
  const cleanQuestion = question.trim().toLowerCase();

  if (!cleanQuestion) {
    return data.bot.greeting;
  }

  const match = data.bot.answers.find((item) =>
    item.keywords.some((keyword) => cleanQuestion.includes(keyword.toLowerCase())),
  );

  return match ? match.answer : data.bot.fallback;
}

function useLocalNames() {
  const [names, setNames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("neev-secret-names") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("neev-secret-names", JSON.stringify(names));
  }, [names]);

  return [names, setNames];
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, index) => (
        <span key={index} style={{ "--drop": index, "--x": `${(index * 29) % 100}%` }} />
      ))}
    </div>
  );
}

function ChatInterface({ compact = false }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: data.bot.greeting },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();
    const question = input.trim();

    if (!question) {
      return;
    }

    setMessages((current) => [
      ...current,
      { from: "user", text: question },
      { from: "bot", text: getBotAnswer(question) },
    ]);
    setInput("");
  }

  return (
    <div className={compact ? "chat compact-chat" : "chat"}>
      <div className="chat-feed" ref={listRef}>
        {messages.map((message, index) => (
          <div className={`chat-bubble ${message.from}`} key={`${message.text}-${index}`}>
            {message.text}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          aria-label="Ask Neev Bot a question"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about birthday, games, Roblox..."
          value={input}
        />
        <button type="submit">Ask</button>
      </form>
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`chat-widget ${open ? "open" : ""}`}>
      {open && (
        <div className="widget-panel">
          <div className="widget-header">
            <div>
              <span>Neev Bot</span>
              <small>Local facts only</small>
            </div>
            <button aria-label="Close chat widget" onClick={() => setOpen(false)}>
              x
            </button>
          </div>
          <ChatInterface compact />
        </div>
      )}
      <button
        aria-label={open ? "Close Neev Bot" : "Open Neev Bot"}
        className="widget-toggle"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "Close" : "Bot"}
      </button>
    </div>
  );
}

function SecretSection() {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState("");
  const [warning, setWarning] = useState("");
  const [names, setNames] = useLocalNames();

  const blockedWords = data.secret.blockedWords.map((word) => word.toLowerCase());
  const specialNames = data.secret.specialNames.map((item) => item.toLowerCase());

  function checkCode(event) {
    event.preventDefault();
    setVerified(code.trim() === data.secret.accessCode);
    setWarning(code.trim() === data.secret.accessCode ? "" : "Access denied. Try again.");
  }

  function submitName(event) {
    event.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      return;
    }

    if (blockedWords.some((word) => cleanName.toLowerCase().includes(word))) {
      setWarning("That name contains inappropriate wording. Please keep it clean.");
      return;
    }

    setNames((current) => [
      { id: crypto.randomUUID(), value: cleanName },
      ...current,
    ]);
    setName("");
    setWarning("");
  }

  return (
    <section className="section secret-section" id="secret">
      <div className="section-heading">
        <p>Access layer</p>
        <h2>Secret Section</h2>
      </div>
      <div className="glass split-secret">
        <div>
          <h3>{verified ? "Verified Identity" : "Enter the code"}</h3>
          <p>
            A small private wall for people who make it through the lock screen.
          </p>
        </div>
        {!verified ? (
          <form className="inline-form" onSubmit={checkCode}>
            <input
              aria-label="Secret code"
              onChange={(event) => setCode(event.target.value)}
              placeholder="Secret code"
              type="password"
              value={code}
            />
            <button type="submit">Unlock</button>
          </form>
        ) : (
          <form className="inline-form" onSubmit={submitName}>
            <input
              aria-label="Visitor name"
              maxLength="32"
              onChange={(event) => setName(event.target.value)}
              placeholder="Type your name"
              value={name}
            />
            <button type="submit">Add</button>
          </form>
        )}
        {warning && <p className="warning">{warning}</p>}
        {verified && (
          <div className="name-grid">
            {names.length === 0 ? (
              <p className="muted">No names yet. Be the first verified visitor.</p>
            ) : (
              names.map((item) => {
                const special = specialNames.includes(item.value.toLowerCase());
                return (
                  <div className={`name-card ${special ? "special" : ""}`} key={item.id}>
                    <span>{item.value}</span>
                    {special && <strong>Legend</strong>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function BigRedButton() {
  const [clicks, setClicks] = useState(0);
  const [burst, setBurst] = useState(false);

  function handleClick() {
    const nextClicks = clicks + 1;
    setClicks(nextClicks > 2 ? 1 : nextClicks);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 520);
  }

  const text =
    clicks === 0 ? "Do not press" : clicks === 1 ? "NEEV" : "Neev is a Barbie girl";

  return (
    <section className="section red-button-section" id="red-button">
      <div className="section-heading">
        <p>Highly scientific</p>
        <h2>Big Red Button</h2>
      </div>
      <div className="red-stage">
        <button className={`red-button ${burst ? "shake" : ""}`} onClick={handleClick}>
          {text}
        </button>
        {clicks > 0 && (
          <div className={`comic-pop ${burst ? "pop" : ""}`}>
            {clicks === 1 ? "BOOM. Name unlocked." : "Visual sound effect: sparkle."}
          </div>
        )}
      </div>
    </section>
  );
}

function App() {
  const { profile } = data;
  const [birthday, setBirthday] = useState(() => getBirthdayState(profile));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBirthday(getBirthdayState(profile));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [profile]);

  const facts = useMemo(
    () => [
      ["Age", profile.age],
      ["Favourite colour", profile.favouriteColour],
      ["Favourite food", profile.favouriteFood],
      ["Favourite artist", profile.favouriteArtist],
    ],
    [profile],
  );

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#home">
          <span>NS</span>
          <strong>Neev Shah</strong>
        </a>
        <nav aria-label="Main navigation">
          {navItems.map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Division 1 energy / PS5 mode / light-blue aura</p>
              <h1>{profile.name}</h1>
              <p>{profile.about}</p>
              <div className="hero-actions">
                <a className="primary-action" href="#ask">
                  Ask Neev Bot
                </a>
                <a className="secondary-action" href="#favourites">
                  See the facts
                </a>
              </div>
            </div>
            <div className="hero-card glass">
              <div className="orbital-ring" />
              <div className="player-token">NS</div>
              <div className="stat-strip">
                <span>Division 1</span>
                <span>Rocket League</span>
                <span>FC</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <div className="section-heading">
            <p>About</p>
            <h2>Built Different On The Pitch</h2>
          </div>
          <div className="about-grid">
            <article className="glass feature-card">
              <h3>Soccer Brain</h3>
              <p>
                Division 1 soccer takes pace, control, and a bit of ice in the
                veins. Neev brings the all-action version.
              </p>
            </article>
            <article className="glass feature-card">
              <h3>Console Mode</h3>
              <p>
                Off the pitch, it is PS5 time: Rocket League clips, FC matches,
                and casual chaos with clean controller work.
              </p>
            </article>
          </div>
        </section>

        <section className="section countdown-section" id="countdown">
          {birthday.isBirthday && <Confetti />}
          <div className="section-heading">
            <p>28 May every year</p>
            <h2>Birthday Countdown</h2>
          </div>
          <div className="glass countdown-card">
            {birthday.isBirthday ? (
              <h3>Happy Birthday, Neev. Light-blue legend day is live.</h3>
            ) : (
              <h3>Countdown to 28 May {birthday.year}</h3>
            )}
            <div className="time-grid">
              {[
                ["Days", birthday.days],
                ["Hours", birthday.hours],
                ["Minutes", birthday.minutes],
                ["Seconds", birthday.seconds],
              ].map(([label, value]) => (
                <div className="time-tile" key={label}>
                  <strong>{String(value).padStart(2, "0")}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="favourites">
          <div className="section-heading">
            <p>Loadout</p>
            <h2>Favourite Things</h2>
          </div>
          <div className="fact-grid">
            {facts.map(([label, value]) => (
              <article className="glass fact-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
            <article className="glass fact-card wide">
              <span>Favourite games</span>
              <strong>{profile.favouriteGames.join(" + ")}</strong>
            </article>
          </div>
        </section>

        <section className="section" id="usernames">
          <div className="section-heading">
            <p>Online</p>
            <h2>Online Usernames</h2>
          </div>
          <div className="glass username-card">
            <span>Roblox</span>
            <strong>{profile.robloxUsername}</strong>
          </div>
        </section>

        <section className="section ask-section" id="ask">
          <div className="section-heading">
            <p>No API. No backend. Just local JavaScript.</p>
            <h2>Ask Neev Bot</h2>
          </div>
          <ChatInterface />
        </section>

        <SecretSection />
        <BigRedButton />
      </main>

      <ChatWidget />
    </>
  );
}

export default App;
