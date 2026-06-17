import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read events.json
const eventsData = JSON.parse(fs.readFileSync("events.json", "utf8"));
const events = eventsData._embedded.events;

// Extract match data
const matches = events.map((event) => {
  const venue = event._embedded?.venues?.[0] || {};
  const name = event.name;

  // Parse team names from event name
  // Format: "World Cup: Match XX Group X - Team A vs Team B"
  const teamsMatch = name.match(/-\s*(.+?)\s+vs\s+(.+)$/);
  let team1 = "TBD";
  let team2 = "TBD";

  if (teamsMatch) {
    team1 = teamsMatch[1].trim();
    team2 = teamsMatch[2].trim();
  }

  // Extract group info
  const groupMatch = name.match(/Group\s+([A-H])/i);
  const group = groupMatch ? groupMatch[1].toUpperCase() : null;

  // Check if it's a knockout match
  const isKnockout =
    name.toLowerCase().includes("round of") ||
    name.toLowerCase().includes("quarter") ||
    name.toLowerCase().includes("semi") ||
    name.toLowerCase().includes("final");

  return {
    id: event.id,
    name: name,
    team1,
    team2,
    group,
    isKnockout,
    date: event.dates?.start?.dateTime || "",
    localDate: event.dates?.start?.localDate || "",
    localTime: event.dates?.start?.localTime || "",
    venue: venue.name || "TBD",
    city: venue.city?.name || "",
    state: venue.state?.name || "",
    country: venue.country?.countryCode || "",
    url: event.url || "",
  };
});

// Sort by date
matches.sort((a, b) => new Date(a.date) - new Date(b.date));

// Separate group stage and knockout matches
const groupMatches = matches.filter((m) => m.group && !m.isKnockout);
const knockoutMatches = matches.filter((m) => m.isKnockout);

// Select first 8 group matches for display
const selectedGroupMatches = groupMatches.slice(0, 8);
const selectedKnockoutMatches = knockoutMatches.slice(0, 3);

console.log(`Total matches: ${matches.length}`);
console.log(`Group matches: ${groupMatches.length}`);
console.log(`Knockout matches: ${knockoutMatches.length}`);
console.log("\nSelected group matches:");
selectedGroupMatches.forEach((m) => {
  console.log(`${m.localDate} - ${m.team1} vs ${m.team2} (${m.venue})`);
});

console.log("\nSelected knockout matches:");
selectedKnockoutMatches.forEach((m) => {
  console.log(`${m.localDate} - ${m.name} (${m.venue})`);
});

// Generate HTML card for a match - different templates for each landing
function generateMatchCard(match, index, template = "default") {
  const stage = match.isKnockout ? "playoffs" : "grupos";
  const team1Flag = getFlag(match.team1);
  const team2Flag = getFlag(match.team2);
  const venueLocation = `${match.city}, ${match.state || match.country}`;

  if (template === "index") {
    // Premium/VIP template for index.html
    return `
            <article class="card" data-stage="${stage}">
                <div class="c-time">
                    <span class="c-date" data-utc="${match.date}">${formatDate(match.localDate)}</span>
                    <span class="c-venue">🏟️ ${venueLocation}, ${match.venue}</span>
                </div>
                <div class="c-teams">
                    <div class="team">
                        <span class="flag" role="img" aria-label="Bandera de ${team1Flag.name}">${team1Flag.emoji}</span>
                        ${match.team1}
                    </div>
                    <div class="team">
                        <span class="flag" role="img" aria-label="Bandera de ${team2Flag.name}">${team2Flag.emoji}</span>
                        ${match.team2}
                    </div>
                </div>
                <div class="c-text">
                    Últimos accesos para los sectores VIP y Hospitality. La
                    <strong>venta de boletos para ${match.team1} vs ${match.team2} en ${match.venue}</strong>
                    está registrando una demanda histórica.
                </div>
                <div class="c-actions">
                    <button class="btn btn-gold" onclick="route('tickets', '${match.id}')" aria-label="Adquirir acceso para ${match.team1} vs ${match.team2}">
                        Adquirir Acceso
                    </button>
                    <button class="btn btn-outline" onclick="route('info', '${match.id}')" aria-label="Ver detalles del recinto para ${match.team1} vs ${match.team2}">
                        Detalles del Recinto
                    </button>
                </div>
            </article>`;
  } else if (template === "boletosfifa") {
    // Sales-focused template for boletosfifa.store.html
    return `
            <article class="card" id="${match.id}" data-stage="${stage}">
                <header class="c-time">
                    <span class="c-date" data-utc="${match.date}">${formatDate(match.localDate)}</span>
                    <span class="c-venue">${match.venue} — ${venueLocation}</span>
                </header>
                <h3 class="match-title">${match.team1} vs ${match.team2}</h3>
                <div class="c-text">
                    Disponibilidad inmediata de
                    <strong>boletos de Categoría 1, 2 y 3</strong>.
                    Asegura tus asientos juntos en ${match.venue}.
                    Entradas 100% verificadas para este partido del ${match.group ? `Grupo ${match.group}` : "torneo"}.
                </div>
                <div class="c-actions">
                    <button class="btn btn-gold" onclick="route('tickets', '${match.id}')">
                        Comprar Boletos
                    </button>
                    <button class="btn btn-outline" onclick="route('info', '${match.id}')">
                        Ver Precios
                    </button>
                </div>
            </article>`;
  } else if (template === "copa26") {
    // Access-focused template for copa26.store.html
    return `
            <article class="card" id="${match.id}" data-stage="${stage}">
                <header class="c-time">
                    <span class="c-date" data-utc="${match.date}">${formatDate(match.localDate)}</span>
                    <span class="c-venue">${match.venue} — ${venueLocation}</span>
                </header>
                <h3 class="match-title">${match.team1} vs ${match.team2}</h3>
                <div class="c-text">
                    Localidades disponibles para las
                    <strong>categorías preferenciales 1, 2 y asientos generales</strong>.
                    Asegura pases contiguos en ${match.venue}.
                    Entradas garantizadas para este partido del ${match.group ? `Grupo ${match.group}` : "torneo"}.
                </div>
                <div class="c-actions">
                    <button class="btn btn-gold" onclick="route('tickets', '${match.id}')">
                        Adquirir Entradas
                    </button>
                    <button class="btn btn-outline" onclick="route('info', '${match.id}')">
                        Consultar Precios
                    </button>
                </div>
            </article>`;
  } else if (template === "github") {
    // Flag-focused template for boletosfifa.github.io.html
    return `
            <article class="card" data-stage="${stage}">
                <div class="c-time">
                    <span class="c-date" data-utc="${match.date}">${formatDate(match.localDate)}</span>
                    <span class="c-venue">${match.venue}, ${match.city}, ${match.state || match.country}</span>
                </div>
                <div class="c-teams">
                    <div class="team">
                        <span class="flag" role="img" aria-label="Bandera de ${team1Flag.name}">${team1Flag.emoji}</span>
                        ${match.team1}
                    </div>
                    <div class="team">
                        <span class="flag" role="img" aria-label="Bandera de ${team2Flag.name}">${team2Flag.emoji}</span>
                        ${match.team2}
                    </div>
                </div>
                <div class="c-text">
                    ${match.group ? `Entradas disponibles para el partido del Grupo ${match.group}.` : "Entradas disponibles para este emocionante encuentro."}
                    Asegura tu lugar en ${match.venue} con <strong>boletos verificados</strong>.
                </div>
                <div class="c-actions">
                    <button class="btn btn-gold" onclick="route('tickets', '${match.id}')" aria-label="Comprar boletos para ${match.team1} vs ${match.team2}">
                        Comprar Boletos
                    </button>
                    ${
                      match.isKnockout
                        ? ""
                        : `
                    <button class="btn btn-outline" onclick="route('info', '${match.id}')" aria-label="Ver detalles del estadio">
                        Info del Estadio
                    </button>
                    `
                    }
                </div>
            </article>`;
  } else {
    // Default template
    return `
            <article class="card" data-stage="${stage}">
                <div class="c-time">
                    <span class="c-date" data-utc="${match.date}">${formatDate(match.localDate)}</span>
                    <span class="c-venue">${venueLocation}, ${match.venue}</span>
                </div>
                <div class="c-teams">
                    <div class="team">
                        <span class="flag" role="img" aria-label="Bandera de ${team1Flag.name}">${team1Flag.emoji}</span>
                        ${match.team1}
                    </div>
                    <div class="team">
                        <span class="flag" role="img" aria-label="Bandera de ${team2Flag.name}">${team2Flag.emoji}</span>
                        ${match.team2}
                    </div>
                </div>
                <div class="c-text">
                    <strong>Boletos disponibles</strong> para ${match.team1} vs ${match.team2}.
                    Asegura tu lugar en ${match.venue} para este emocionante partido del ${match.group ? `Grupo ${match.group}` : "torneo"}.
                </div>
                <div class="c-actions">
                    <button class="btn btn-gold" onclick="route('tickets', '${match.id}')">
                        Ver Disponibilidad
                    </button>
                </div>
            </article>`;
  }
}

// Simple date formatter
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { day: "numeric", month: "short" };
  return date.toLocaleDateString("es-ES", options);
}

// Get flag emoji for team (simplified mapping)
function getFlag(teamName) {
  const flagMap = {
    USA: { emoji: "🇺🇸", name: "Estados Unidos" },
    "United States": { emoji: "🇺🇸", name: "Estados Unidos" },
    Australia: { emoji: "🇦🇺", name: "Australia" },
    Turkey: { emoji: "🇹🇷", name: "Turquía" },
    Mexico: { emoji: "🇲🇽", name: "México" },
    Korea: { emoji: "🇰🇷", name: "Corea" },
    "South Korea": { emoji: "🇰🇷", name: "Corea" },
    Czechia: { emoji: "🇨🇿", name: "República Checa" },
    Brazil: { emoji: "🇧🇷", name: "Brasil" },
    Haiti: { emoji: "🇭🇹", name: "Haití" },
    Scotland: { emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", name: "Escocia" },
    "Saudi Arabia": { emoji: "🇸🇦", name: "Arabia Saudita" },
    Uruguay: { emoji: "🇺🇾", name: "Uruguay" },
    Argentina: { emoji: "🇦🇷", name: "Argentina" },
    Algeria: { emoji: "🇩🇿", name: "Argelia" },
    Poland: { emoji: "🇵🇱", name: "Polonia" },
    Switzerland: { emoji: "🇨🇭", name: "Suiza" },
    Canada: { emoji: "🇨🇦", name: "Canadá" },
    Japan: { emoji: "🇯🇵", name: "Japón" },
    Spain: { emoji: "🇪🇸", name: "España" },
    Colombia: { emoji: "🇨🇴", name: "Colombia" },
    England: { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Inglaterra" },
    Nigeria: { emoji: "🇳🇬", name: "Nigeria" },
    Paraguay: { emoji: "🇵🇾", name: "Paraguay" },
  };

  // Try exact match first
  if (flagMap[teamName]) {
    return flagMap[teamName];
  }

  // Try partial match
  for (const [key, value] of Object.entries(flagMap)) {
    if (
      teamName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(teamName.toLowerCase())
    ) {
      return value;
    }
  }

  return { emoji: "🏳️", name: teamName };
}

// Generate the HTML content for each landing template
const indexGridContent = selectedGroupMatches
  .map((match, i) => generateMatchCard(match, i, "index"))
  .join("\n");
const boletosfifaGridContent = selectedGroupMatches
  .map((match, i) => generateMatchCard(match, i, "boletosfifa"))
  .join("\n");
const copa26GridContent = selectedGroupMatches
  .map((match, i) => generateMatchCard(match, i, "copa26"))
  .join("\n");

const githubGridContent = selectedGroupMatches
  .map((match, i) => generateMatchCard(match, i, "github"))
  .join("\n");

// Save to separate files for each landing
fs.writeFileSync("matches_index.html", indexGridContent, "utf8");
console.log("\nGenerated matches_index.html with premium template");

fs.writeFileSync("matches_boletosfifa.html", boletosfifaGridContent, "utf8");
console.log("Generated matches_boletosfifa.html with sales template");

fs.writeFileSync("matches_copa26.html", copa26GridContent, "utf8");
console.log("Generated matches_copa26.html with access template");

fs.writeFileSync("matches_github.html", githubGridContent, "utf8");
console.log("Generated matches_github.html with github template");

// Export for use in updating HTML files
export {
  matches,
  selectedGroupMatches,
  selectedKnockoutMatches,
  generateMatchCard,
};
