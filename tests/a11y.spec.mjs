import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { execSync } from "child_process";

const PORT = 4325;

async function run() {
  execSync("npm run build", { stdio: "pipe" });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const pages = [
    "/",
    "/achat-energie/",
    "/achat-energie/comparatif-fournisseurs/",
    "/achat-energie/contrat-electricite/",
    "/achat-energie/contrat-gaz/",
    "/achat-energie/energie-verte-entreprise/",
    "/achat-energie/faq/",
    "/achat-energie/prix-electricite-professionnel/",
    "/achat-energie/prix-gaz-professionnel/",
    "/diagnostic-gratuit/",
    "/dispositifs/",
    "/dispositifs/calcul-prime/",
    "/dispositifs/comprendre-les-cee/",
    "/dispositifs/demarches/",
    "/dispositifs/faq/",
    "/dispositifs/glossaire/",
    "/dispositifs/kwh-cumac/",
    "/dispositifs/legislation/",
    "/dispositifs/obliges/",
    "/expertises/",
    "/expertises/air-comprime/",
    "/expertises/air-comprime/faq/",
    "/expertises/air-comprime/industrie/",
    "/expertises/air-comprime/prime-cee/",
    "/expertises/air-comprime/reseau/",
    "/expertises/air-comprime/tarifs/",
    "/expertises/destratificateur/",
    "/expertises/destratificateur/faq/",
    "/expertises/destratificateur/industrie/",
    "/expertises/destratificateur/prime-cee/",
    "/expertises/destratificateur/tarifs/",
    "/expertises/destratificateur/tertiaire/",
    "/expertises/variateur-de-vitesse/",
    "/expertises/variateur-de-vitesse/faq/",
    "/expertises/variateur-de-vitesse/industrie/",
    "/expertises/variateur-de-vitesse/prime-cee/",
    "/expertises/variateur-de-vitesse/tarifs/",
    "/expertises/variateur-de-vitesse/ventilation/",
    "/expertises/vmc-double-flux/",
    "/expertises/vmc-double-flux/faq/",
    "/expertises/vmc-double-flux/industrie/",
    "/expertises/vmc-double-flux/prime-cee/",
    "/expertises/vmc-double-flux/tarifs/",
    "/expertises/vmc-double-flux/tertiaire/",
    "/marches/",
    "/marches/agriculture/",
    "/marches/collectivites/",
    "/marches/habitat-collectif/",
    "/marches/industrie/",
    "/marches/logistique/",
    "/marches/tertiaire/",
    "/mentions-legales/",
    "/mobilite-electrique/",
    "/politique-confidentialite/",
    "/qui-sommes-nous/",
    "/reglementation/",
  ];

  let totalViolations = 0;

  for (const path of pages) {
    await page.goto(`http://localhost:${PORT}${path}`, {
      waitUntil: "networkidle",
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const contrastIssues = results.violations.filter(
      (v) => v.id === "color-contrast"
    );

    if (contrastIssues.length > 0) {
      console.error(`\n❌ CONTRASTE — ${path}`);
      for (const violation of contrastIssues) {
        for (const node of violation.nodes) {
          console.error(`  ${node.failureSummary}`);
          console.error(`  Element: ${node.html.slice(0, 120)}`);
          console.error("");
        }
      }
      totalViolations += contrastIssues.reduce(
        (sum, v) => sum + v.nodes.length,
        0
      );
    }

    const otherIssues = results.violations.filter(
      (v) => v.id !== "color-contrast"
    );
    if (otherIssues.length > 0) {
      console.error(`\n⚠️  A11Y — ${path}`);
      for (const v of otherIssues) {
        console.error(
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} occurrences)`
        );
      }
      totalViolations += otherIssues.reduce(
        (sum, v) => sum + v.nodes.length,
        0
      );
    }

    if (
      contrastIssues.length === 0 &&
      otherIssues.length === 0
    ) {
      console.log(`✅ ${path} — aucun problème d'accessibilité`);
    }
  }

  await browser.close();

  if (totalViolations > 0) {
    console.error(`\n${totalViolations} violation(s) détectée(s).`);
    process.exit(1);
  } else {
    console.log("\n✅ Tous les tests d'accessibilité passent.");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
