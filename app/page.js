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
    7: {
      impact: "Traglast (Carry Weight) halbiert.",
      flavor: "Schwache Muskulatur; z. B. dünne Arme und schnelle Erschöpfung beim Tragen."
    },
    6: {
      impact: "Bewegungsrate dauerhaft -5 ft.",
      flavor: "Hinkender Gang; z. B. altes Knieleiden oder schlecht verheilter Bruch."
    }
  },
  DEX: {
    7: {
      impact: "Armor Class -1.",
      flavor: "Ungelenke Bewegungen; z. B. schlechte Haltung oder fehlende Feinmotorik."
    },
    6: {
      impact: "-3 auf Initiativewürfe.",
      flavor: "Verzögerte Reaktion; z. B. Zittern oder langsames Erfassen der Lage."
    }
  },
  CON: {
    7: {
      impact: "Hit Dice zählen als W4 (nicht für MaxHP).",
      flavor: "Schwache Regeneration; z. B. blasse Haut und schnelle Ermüdung."
    },
    6: {
      impact: "Death Saves erst ab 12 erfolgreich.",
      flavor: "Gebrechlicher Körper; z. B. Atemprobleme oder schwaches Herz."
    }
  },
  INT: {
    7: {
      impact: "INT-Proficiencies werden Half Proficiency, Expertise wird normale Proficiency.",
      flavor: "Lückenhafte Bildung; z. B. fehlende Grundlagen oder Denkpausen."
    },
    6: {
      impact: "Mindest-DC für Concentration-Checks ist 12.",
      flavor: "Überforderung; z. B. Migräne bei starker geistiger Anstrengung."
    }
  },
  WIS: {
    7: {
      impact: "Passive Perception -3.",
      flavor: "Unaufmerksam; z. B. abwesender Blick oder leicht ablenkbar."
    },
    6: {
      impact: "Keine Opportunity Attacks.",
      flavor: "Späte Gefahrenerkennung; z. B. reagiert erst, wenn es schon zu spät ist."
    }
  },
  CHA: {
    7: {
      impact: "Keine Help-Aktion.",
      flavor: "Unsichere Ausstrahlung; z. B. nervöse Stimme oder fehlender Blickkontakt."
    },
    6: {
      impact: "Melee-Angriffe gegen dich critten bei 19-20.",
      flavor: "Lesbare Körpersprache; z. B. offenkundige Anspannung im Kampf."
    }
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
  const [showActiveCurses, setShowActiveCurses] = useState(true);

  const state = useMemo(() => evaluate(scores), [scores]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const applyViewportMode = () => {
      const mobile = mediaQuery.matches;
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
      return [{ trigger: 7, ...CURSES[ability][7] }];
    }

    if (value === 6) {
      return [
        { trigger: 7, ...CURSES[ability][7] },
        { trigger: 6, ...CURSES[ability][6] }
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
      impact: curse.impact,
      flavor: curse.flavor
    }));
  });

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-block">
          <p className="brand">Hybrid Point Buy</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => setScores(INITIAL_SCORES)}>
          Reset
        </button>
      </header>

      <main className="page">
        <section className="panel">
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
                          <li key={`${ability}-${curse.trigger}`} className="curse-item">
                            <span className="curse-label">Curse {curse.trigger} Impact</span>
                            <span className="curse-impact">{curse.impact}</span>
                            <span className="curse-flavor">Flavor: {curse.flavor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <section className="rules">
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
                  <ul className="active-curse-list">
                    {activeCurses.map((entry) => (
                      <li key={`${entry.ability}-${entry.score}-${entry.trigger}`} className="active-curse-item">
                        <strong>
                          {entry.ability} {entry.score} (Curse {entry.trigger}):
                        </strong>{" "}
                        <span className="active-curse-impact">{entry.impact}</span>
                        <span className="active-curse-flavor">Flavor: {entry.flavor}</span>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </section>

            <details className="cost-reference">
              <summary>Point Cost Reference</summary>
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
            </details>
          </section>
        </section>
      </main>
    </div>
  );
}
