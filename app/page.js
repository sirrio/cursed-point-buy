"use client";

import { useEffect, useMemo, useState } from "react";

const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const LABELS = {
  STR: "Strength",
  DEX: "Dexterity",
  CON: "Constitution",
  INT: "Intelligence",
  WIS: "Wisdom",
  CHA: "Charisma"
};

const COSTS = {
  6: -3,
  7: -1,
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
  16: 12
};

const CURSES = {
  STR: {
    7: "Traglast (Carry Weight) halbiert. Schwache Muskulatur; z. B. dünne Arme und schnelle Erschöpfung beim Tragen.",
    6: "Bewegungsrate dauerhaft -5 ft. Hinkender Gang; z. B. altes Knieleiden oder schlecht verheilter Bruch."
  },
  DEX: {
    7: "Armor Class -1. Ungelenke Bewegungen; z. B. schlechte Haltung oder fehlende Feinmotorik.",
    6: "-3 auf Initiativewürfe. Verzögerte Reaktion; z. B. Zittern oder langsames Erfassen der Lage."
  },
  CON: {
    7: "Hit Dice zählen als W4 (nicht für MaxHP). Schwache Regeneration; z. B. blasse Haut und schnelle Ermüdung.",
    6: "Death Saves erst ab 12 erfolgreich. Gebrechlicher Körper; z. B. Atemprobleme oder schwaches Herz."
  },
  INT: {
    7: "INT-Proficiencies werden Half Proficiency, Expertise wird normale Proficiency. Lückenhafte Bildung; z. B. fehlende Grundlagen oder Denkpausen.",
    6: "Mindest-DC für Concentration-Checks ist 12. Überforderung; z. B. Migräne bei starker geistiger Anstrengung."
  },
  WIS: {
    7: "Passive Perception -3. Unaufmerksam; z. B. abwesender Blick oder leicht ablenkbar.",
    6: "Keine Opportunity Attacks. Späte Gefahrenerkennung; z. B. reagiert erst, wenn es schon zu spät ist."
  },
  CHA: {
    7: "Keine Help-Aktion. Unsichere Ausstrahlung; z. B. nervöse Stimme oder fehlender Blickkontakt.",
    6: "Melee-Angriffe gegen dich critten bei 19-20. Lesbare Körpersprache; z. B. offenkundige Anspannung im Kampf."
  }
};

const INITIAL_SCORES = {
  STR: 8,
  DEX: 8,
  CON: 8,
  INT: 8,
  WIS: 8,
  CHA: 8
};

function scoreModifier(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function evaluate(scores) {
  const totalCost = ABILITIES.reduce((sum, ability) => sum + COSTS[scores[ability]], 0);
  const remaining = 27 - totalCost;
  const count16 = ABILITIES.filter((ability) => scores[ability] === 16).length;
  const below8 = ABILITIES.filter((ability) => scores[ability] < 8).length;

  const errors = [];
  if (remaining < 0) {
    errors.push(`Zu viele Punkte ausgegeben (${totalCost}/27).`);
  }
  if (count16 > 1) {
    errors.push("Maximal 1 Wert darf 16 sein.");
  }
  if (below8 > 2) {
    errors.push("Maximal 2 Werte dürfen unter 8 liegen.");
  }

  return { totalCost, remaining, count16, below8, errors };
}

export default function Page() {
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [hint, setHint] = useState("");
  const [showCosts, setShowCosts] = useState(true);
  const [showActiveCurses, setShowActiveCurses] = useState(true);

  const state = useMemo(() => evaluate(scores), [scores]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const applyViewportMode = () => {
      const mobile = mediaQuery.matches;
      setShowCosts(!mobile);
      setShowActiveCurses(!mobile);
    };

    applyViewportMode();
    mediaQuery.addEventListener("change", applyViewportMode);
    return () => mediaQuery.removeEventListener("change", applyViewportMode);
  }, []);

  function trySet(ability, value) {
    if (value < 6 || value > 16) {
      return;
    }

    const nextScores = { ...scores, [ability]: value };
    const nextState = evaluate(nextScores);
    if (nextState.errors.length > 0) {
      setHint(nextState.errors[0]);
      return;
    }

    setHint("");
    setScores(nextScores);
  }

  function getCurses(ability, value) {
    if (value === 7) {
      return [{ trigger: 7, text: CURSES[ability][7] }];
    }

    if (value === 6) {
      return [
        { trigger: 7, text: CURSES[ability][7] },
        { trigger: 6, text: CURSES[ability][6] }
      ];
    }

    return [];
  }

  const activeCurses = ABILITIES.flatMap((ability) => {
    const value = scores[ability];
    return getCurses(ability, value).map((curse) => ({
      ability,
      score: value,
      trigger: curse.trigger,
      text: curse.text
    }));
  });

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-block">
          <p className="brand-kicker">Hybrid Point Buy</p>
          <p className="brand">Character Builder</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => setScores(INITIAL_SCORES)}>
          Reset
        </button>
      </header>

      <main className="page">
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-kicker">Simple, Lean, Playable</p>
            <h1>Build your stats in seconds</h1>
            <p className="subline">
              27 Punkte, Min 6 / Max 16 (vor Boni), max. 1x 16, max. 2 Werte unter 8.
            </p>
          </div>
          <div className="hero-metrics">
            <article className="hero-chip">
              <span>Remaining</span>
              <strong>{state.remaining}</strong>
            </article>
            <article className="hero-chip hero-chip-soft">
              <span>Spent</span>
              <strong>{state.totalCost}</strong>
            </article>
          </div>
        </section>

        <section className="panel">
          <div className="rule-list">
            <span>27 Punkte</span>
            <span>Min 6 / Max 16</span>
            <span>Max 1x 16</span>
            <span>Max 2 Werte unter 8</span>
            <span>6 = Curse 7 + 6</span>
          </div>

          <div className="stats">
            <article>
              <span>Verbrauchte Punkte</span>
              <strong>{state.totalCost}</strong>
            </article>
            <article>
              <span>Verbleibend</span>
              <strong>{state.remaining}</strong>
            </article>
            <article>
              <span>Werte &lt; 8</span>
              <strong>
                {state.below8} / 2
              </strong>
            </article>
            <article>
              <span>Wert 16</span>
              <strong>
                {state.count16} / 1
              </strong>
            </article>
          </div>

          {hint ? <p className="error">{hint}</p> : null}

          <div className="grid">
            {ABILITIES.map((ability) => {
              const value = scores[ability];
              const curses = getCurses(ability, value);
              return (
                <article key={ability} className="ability-card">
                  <header>
                    <h2>{ability}</h2>
                    <small>{LABELS[ability]}</small>
                  </header>
                  <div className="controls">
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => trySet(ability, value - 1)}
                      disabled={value <= 6}
                    >
                      -
                    </button>
                    <div className="value">
                      <strong>{value}</strong>
                      <span>Mod {scoreModifier(value)}</span>
                      <span>Kosten {COSTS[value] >= 0 ? `+${COSTS[value]}` : COSTS[value]}</span>
                    </div>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => trySet(ability, value + 1)}
                      disabled={value >= 16}
                    >
                      +
                    </button>
                  </div>
                  {curses.length === 0 ? (
                    <p className="no-curse">Kein Curse aktiv.</p>
                  ) : (
                    <div className="curse">
                      <ul>
                        {curses.map((curse) => (
                          <li key={`${ability}-${curse.trigger}`}>{curse.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="actions">
            <button type="button" onClick={() => setScores(INITIAL_SCORES)}>
              Reset auf 8
            </button>
          </div>

          <section className="rules">
            <section className="rules-block">
              <div className="rules-head">
                <h2>Kosten</h2>
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowCosts((prev) => !prev)}
                  aria-expanded={showCosts}
                >
                  {showCosts ? "Ausblenden" : "Einblenden"}
                </button>
              </div>
              {showCosts ? (
                <table>
                  <thead>
                    <tr>
                      <th>Wert</th>
                      <th>Kosten</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(COSTS).map(([score, cost]) => (
                      <tr key={score}>
                        <td>{score}</td>
                        <td>{cost >= 0 ? `+${cost}` : cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </section>

            <section className="rules-block">
              <div className="rules-head">
                <h2>Aktive Curses</h2>
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowActiveCurses((prev) => !prev)}
                  aria-expanded={showActiveCurses}
                >
                  {showActiveCurses ? "Ausblenden" : "Einblenden"}
                </button>
              </div>

              {showActiveCurses ? (
                activeCurses.length === 0 ? (
                  <p>Keine Curses aktiv.</p>
                ) : (
                  <ul>
                    {activeCurses.map((entry) => (
                      <li key={`${entry.ability}-${entry.score}-${entry.trigger}`}>
                        <strong>
                          {entry.ability} {entry.score} (Curse {entry.trigger}):
                        </strong>{" "}
                        {entry.text}
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </section>
          </section>
        </section>
      </main>
    </div>
  );
}
