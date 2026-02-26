"use client";

import { useMemo, useState } from "react";

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

  const state = useMemo(() => evaluate(scores), [scores]);

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

  function getCurse(ability, value) {
    return value <= 7 ? CURSES[ability][value] : "";
  }

  const activeCurses = ABILITIES.filter((ability) => scores[ability] <= 7).map((ability) => ({
    ability,
    score: scores[ability],
    text: CURSES[ability][scores[ability]]
  }));

  return (
    <main className="page">
      <section className="panel">
        <h1>Hybrid Point Buy</h1>
        <p className="subline">27 Punkte, Min 6 / Max 16, max. 1x 16, max. 2 Werte unter 8.</p>
        <ul className="rule-list">
          <li>Budget: 27 Punkte.</li>
          <li>Attributswerte vor Boni: Min 6, Max 16.</li>
          <li>Maximal ein Attribut darf 16 sein.</li>
          <li>Maximal zwei Attribute dürfen unter 8 liegen.</li>
          <li>Wert 6 oder 7 aktiviert einen Curse.</li>
        </ul>

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
            const curse = getCurse(ability, value);
            return (
              <article key={ability} className="ability-card">
                <header>
                  <h2>{ability}</h2>
                  <small>{LABELS[ability]}</small>
                </header>
                <div className="controls">
                  <button type="button" onClick={() => trySet(ability, value - 1)} disabled={value <= 6}>
                    -
                  </button>
                  <div className="value">
                    <strong>{value}</strong>
                    <span>Mod {scoreModifier(value)}</span>
                    <span>Kosten {COSTS[value] >= 0 ? `+${COSTS[value]}` : COSTS[value]}</span>
                  </div>
                  <button type="button" onClick={() => trySet(ability, value + 1)} disabled={value >= 16}>
                    +
                  </button>
                </div>
                <p className={curse ? "curse" : "no-curse"}>{curse || "Kein Curse aktiv."}</p>
              </article>
            );
          })}
        </div>

        <div className="actions">
          <button type="button" onClick={() => setScores(INITIAL_SCORES)}>
            Reset auf 8/8/8/8/8/8
          </button>
        </div>

        <section className="rules">
          <h2>Kosten</h2>
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

          <h2>Aktive Curses</h2>
          {activeCurses.length === 0 ? (
            <p>Keine Curses aktiv.</p>
          ) : (
            <ul>
              {activeCurses.map((entry) => (
                <li key={`${entry.ability}-${entry.score}`}>
                  <strong>
                    {entry.ability} {entry.score}:
                  </strong>{" "}
                  {entry.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
