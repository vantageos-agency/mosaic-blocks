# Inventaire de portage `any-debate-ai` → `mosaic-blocks`

Date : 2026-07-12. Auteur : Gamma. Mission : `k57d5sdasg7btynea9tnqqrsy985kf1z` — T0 (recherche/cartographie, zéro code écrit).

## Méthode et règle d'exclusion

- Source comptée : `gh api repos/elpiarthera/any-debate-ai/git/trees/HEAD?recursive=1 --jq '[.tree[] | select(.path|startswith("components/")) | select(.type=="blob")] | length'` → **253 blobs** (branche `main`).
- Règle d'exclusion documentée par la tâche : exclure les fichiers non-composants (index, types, hooks, tests, css) du comptage.
- Fichiers exclus après lecture directe des 253 chemins (`components/templates/index.ts` = barrel export ; `components/ui/use-toast.ts` = hook, pas un composant) :
  `grep -v -e 'index.ts$' -e 'use-toast.ts$'` → **251 composants**.
- Aucun autre `.ts` non-`.tsx` trouvé dans l'arbre `components/**` (vérifié par `grep -v '\.tsx$'` sur les 253 chemins → seulement ces deux fichiers).
- **Nombre de lignes du tableau ci-dessous : 251. Nombre de composants retenus : 251. Égalité vérifiée.**
- Référence cible : `/root/coding/mosaic-blocks/src/components/` — **75 dossiers de composants existants** (`gh api repos/vantageos-agency/mosaic-blocks/contents/src/components --jq 'length'` → 75), lus un par un pour chaque verdict DÉJÀ PRÉSENT (docstrings "Ported from ..." citées quand elles existent — preuve directe, pas une supposition).
- **Note factuelle sur le README/CHANGELOG mosaic-blocks** : le README (section 6) annonce une catégorie "Debate" (11 composants : `MosaicDebateRoom`, `MosaicDebateTimer`, `MosaicDebateParticipant`…) et un total de 85 exports. Vérification directe (`find src/components -iname '*debate*'` → aucun résultat ; `ls src/components | wc -l` → 75) montre que **ces composants Debate n'existent PAS dans le repo actuel**. Le texte README est soit aspirationnel soit périmé. Signalé ici sans le corriger (hors scope de cette tâche) — ne pas s'y fier pour un futur portage.
- `CONTRIBUTING.md` **n'existe pas** dans `mosaic-blocks` (vérifié : seul `docs/CONTRIBUTING.md` existe, référencé depuis le README section 15). Non lu séparément, conforme à la consigne de la tâche.
- Licence : aucun code source `any-debate-ai` n'a été recopié dans ce document — seuls les noms de fichiers, les signatures de props (lues via `gh api .../contents/<path>` pour lever les ambiguïtés) et les imports sont cités à des fins de cartographie.

## Légende verdict

- **PORTER** — composant à créer dans `mosaic-blocks`, aucun équivalent existant.
- **DÉJÀ PRÉSENT** — un composant `mosaic-blocks` existant couvre déjà le besoin (nom cité).
- **HORS SCOPE** — spécifique au produit *débat* (arène de débat, tours de parole, comparaison multi-modèles, scoring) sans usage identifié pour EveVantage (poste de travail multi-agents non-technicien). Raison citée à chaque ligne.
- **AMBIGU** — ne peut pas être tranché sans plus d'information (chevauchement partiel, doublon interne à la source, ou usage à la fois générique et débat-teinté). Raison explicite, pas de choix arbitraire.

---

## Tableau (251 lignes)

| source (any-debate-ai) | cible (kebab-case) | verdict | dépendances mosaic-blocks réutilisées | chaînes i18n à externaliser | variantes desktop/mobile | collision de nom ? |
|---|---|---|---|---|---|---|
| components/adaptive/AdaptiveGrid.tsx | adaptive-grid | DÉJÀ PRÉSENT (`adaptive-grid`) | — | aucune (layout pur) | déjà géré par `MosaicDeviceProvider` | non |
| components/adaptive/AdaptiveModal.tsx | adaptive-modal | DÉJÀ PRÉSENT (`adaptive-modal`) | — | labels boutons (props déjà) | déjà géré | non |
| components/adaptive/AdaptiveNavigation.tsx | adaptive-navigation | DÉJÀ PRÉSENT (`adaptive-navigation`) | — | libellés nav (props) | déjà géré | non |
| components/agent-composer/AgentComposer.tsx | agent-composer | DÉJÀ PRÉSENT (`agent-composer` — `MosaicAgentComposer`) | — | labels étapes | orchestrateur responsive déjà présent | non |
| components/agent-composer/AgentComposerDesktop.tsx | agent-composer (desktop) | DÉJÀ PRÉSENT (`MosaicAgentComposerDesktop`) | — | idem | variante desktop déjà exportée séparément | non |
| components/agent-composer/AgentComposerMobile.tsx | agent-composer (mobile) | DÉJÀ PRÉSENT (`MosaicAgentComposerMobile`) | — | idem | variante mobile déjà exportée séparément | non |
| components/agent-composer/AgentEditor.tsx | agent-editor | PORTER | `agent-composer`, `field`, `input` | labels champs, placeholders | à prévoir (aucune existante) | non |
| components/agent-composer/ModelSelector.tsx | model-selector | PORTER | `select` ou `dropdown-menu` | libellés de modèles (props hôte) | à prévoir | non |
| components/agent-composer/ModuleCard.tsx | module-card | DÉJÀ PRÉSENT (`module-card`) | — | titre/description (props) | déjà géré | non |
| components/agent-composer/ModuleSelector.tsx | module-selector | DÉJÀ PRÉSENT (`selector-modal` généralise le picker de modules) | `selector-modal` | libellés items (props) | déjà géré par selector-modal | vérifier forme exacte des props module vs framework/persona/role |
| components/agent-config/AgentBuilderModal.tsx | agent-builder-modal | PORTER | `adaptive-modal`, `selector-modal`, `agent-composer` | titre, boutons étapes | à prévoir | non |
| components/agent-config/AgentPreview.tsx | agent-preview | PORTER | `card`, `agent-card` | labels de preview | à prévoir | non |
| components/agent-config/FrameworkSelector.tsx | framework-selector | DÉJÀ PRÉSENT (`selector-modal` — docstring "Ported from ... FrameworkSelector") | `selector-modal` | libellés catégories (props) | déjà géré | non |
| components/agent-config/PersonaSelector.tsx | persona-selector | DÉJÀ PRÉSENT (`selector-modal` — docstring "Ported from ... PersonaSelector") | `selector-modal` | idem | déjà géré | non |
| components/agent-config/RoleSelector.tsx | role-selector | DÉJÀ PRÉSENT (`selector-modal` — docstring "Ported from ... RoleSelector") | `selector-modal` | idem | déjà géré | non |
| components/agent-management/AgentCard.tsx | agent-card | DÉJÀ PRÉSENT (`agent-card`) | — | labels statut (props) | déjà géré | oui — même nom que `components/agents/agent-card.tsx` (doublon interne à any-debate-ai) |
| components/agent-management/QuickAgentSelector.tsx | quick-agent-selector | DÉJÀ PRÉSENT (`quick-agent-selector`) | — | libellés (props) | déjà géré | non |
| components/agents/AgentFilterSidebar.tsx | filter-sidebar | DÉJÀ PRÉSENT (`filter-sidebar` — docstring "Ported from components/agents/AgentFilterSidebar.tsx" exactement) | — | libellés filtres (props) | déjà géré | non |
| components/agents/agent-card.tsx | agent-card | DÉJÀ PRÉSENT (`agent-card`) | — | idem | déjà géré | oui — doublon avec `agent-management/AgentCard.tsx` |
| components/agents/agent-list.tsx | agent-list | DÉJÀ PRÉSENT (`agent-list`) | — | états vides (props) | déjà géré | non |
| components/agents/desktop/agent-list-desktop.tsx | agent-list (desktop) | DÉJÀ PRÉSENT (`agent-list`, responsive déjà géré) | — | idem | subsumé | non |
| components/agents/mobile/agent-list-mobile.tsx | agent-list (mobile) | DÉJÀ PRÉSENT (`agent-list`) | — | idem | subsumé | non |
| components/artifact/ArtifactCanvas.tsx | artifact-canvas | AMBIGU — doublon de `components/artifacts/ArtifactCanvas.tsx` (dossier singulier vs pluriel, même nom de fichier, contenu proche) ; probable code legacy dans any-debate-ai. Ne porter que la version `artifacts/` (voir ligne suivante). | — | — | — | oui — collision directe avec `artifacts/ArtifactCanvas.tsx` |
| components/artifacts/ArtifactCanvas.tsx | artifact-canvas | PORTER | `card`, `badge`, `progress` | titres de sections, statuts (draft/review/complete) | à prévoir | oui, cf. ligne au-dessus |
| components/artifacts/ArtifactRenderer.tsx | artifact-renderer | PORTER | `card` | aucune (dispatcher de rendu) | à prévoir | non |
| components/artifacts/ArtifactToolbar.tsx | artifact-toolbar | PORTER | `button`, `dropdown-menu` | libellés actions (export, partager…) | à prévoir | non |
| components/artifacts/ChartArtifact.tsx | chart-artifact | PORTER | `card` | légendes graphique | à prévoir | **point de vigilance** : nécessite une lib de charts (Recharts prévu par la doctrine BU-MCP), ne PAS importer `@vantageos/mosaic` (Lit/rxjs, casse Turbopack) |
| components/artifacts/ChecklistArtifact.tsx | checklist-artifact | PORTER | `checkbox`, `card` | libellés items (props hôte) | à prévoir | non |
| components/artifacts/CollaborationIndicator.tsx | collaboration-indicator | PORTER | `avatar`, `badge` | libellé "en train d'éditer" | à prévoir | non |
| components/artifacts/DataTableArtifact.tsx | data-table-artifact | PORTER (wrapper artefact autour de `data-table` existant) | `data-table` | en-têtes colonnes (props) | à prévoir | non |
| components/artifacts/DocumentArtifact.tsx | document-artifact | PORTER | `card` | aucune (contenu = prop) | à prévoir | non |
| components/artifacts/export/ArtifactExportModal.tsx | artifact-export-modal | PORTER | `adaptive-modal` | libellés formats export | à prévoir | non |
| components/artifacts/organization/ArtifactLibrary.tsx | artifact-library | PORTER | `module-library` (pattern générique liste+CRUD), `filter-sidebar` | libellés bibliothèque | à prévoir | non |
| components/artifacts/save-artifact-as-memory-form.tsx | save-artifact-as-memory-form | PORTER | `field`, `input`, `textarea` | libellés formulaire | à prévoir | non |
| components/artifacts/search/ArtifactFilter.tsx | artifact-filter | DÉJÀ PRÉSENT (`filter-bar` générique) | `filter-bar` | libellés filtres (props) | déjà géré | non |
| components/artifacts/search/ArtifactSearch.tsx | artifact-search | PORTER | `input`, `filter-bar` | placeholder recherche | à prévoir | non |
| components/artifacts/templates/ArtifactTemplateSelector.tsx | artifact-template-selector | DÉJÀ PRÉSENT (`selector-modal` générique) | `selector-modal` | libellés items | déjà géré | non |
| components/artifacts/version-history/VersionHistoryPanel.tsx | version-history-panel | PORTER | `card`, `badge` | libellés version/date | à prévoir | non |
| components/billing/cancel-subscription-dialog.tsx | cancel-subscription-dialog | PORTER | `adaptive-modal` | texte de confirmation | à prévoir | non |
| components/billing/change-plan-dialog.tsx | change-plan-dialog | PORTER | `adaptive-modal`, `card`, `pricing-card` | libellés plans | à prévoir | non |
| components/billing/plan-selection-reference.tsx | plan-selection-reference | PORTER | `card`, `pricing-card` | libellés plans/features | à prévoir | non |
| components/billing/purchase-tokens-dialog.tsx | purchase-tokens-dialog | PORTER | `adaptive-modal`, `input` | libellés montants | à prévoir | non |
| components/billing/token-balance-warning.tsx | token-balance-warning | PORTER | `badge` | texte d'alerte | à prévoir | non |
| components/billing/token-balance-widget.tsx | token-balance-widget | PORTER | `card`, `progress` | libellé solde | à prévoir | oui — doublon fonctionnel avec `dashboard/TokenBalance.tsx` (même besoin, noms différents) |
| components/chat/ChatSidebar.tsx | chat-sidebar | PORTER | `app-sidebar` | libellés nav | à prévoir | non |
| components/chat/ChatThread.tsx | chat-thread | PORTER | `message-list`, `message-card` | aucune (contenu = données) | à prévoir | non |
| components/chat/MentionInput.tsx | mention-input | PORTER | `input`, `dropdown-menu` | placeholder | à prévoir | non |
| components/chat/ModeSelector.tsx | — | HORS SCOPE — sélectionne entre modes Chat/Debate/Compare/Auto-Debate (`CHAT_MODES`, `ChatMode`), vérifié par lecture directe du fichier (imports `Columns3`/`MessageCircle`/`Zap` = icônes debate/compare/auto-debate) | — | — | — | non |
| components/chat/auto-debate/AutoDebateMode.tsx | — | HORS SCOPE — mode auto-débat, aucun usage EveVantage identifié | — | — | — | non |
| components/chat/auto-debate/AutoDebateSetup.tsx | — | HORS SCOPE — configuration du mode auto-débat | — | — | — | non |
| components/chat/bookmarks/BookmarkButton.tsx | bookmark-button | PORTER | `button` | tooltip | à prévoir | non |
| components/chat/bookmarks/BookmarkEditor.tsx | bookmark-editor | PORTER | `field`, `textarea` | libellés formulaire | à prévoir | non |
| components/chat/bookmarks/BookmarkPanel.tsx | bookmark-panel | PORTER | `card`, `filter-sidebar` | libellés panneau | à prévoir | non |
| components/chat/bookmarks/CollectionManager.tsx | collection-manager | PORTER | `module-library` (pattern liste+CRUD générique) | libellés collections | à prévoir | non |
| components/chat/compare/CompareAgentSelector.tsx | — | HORS SCOPE — sélection de modèles pour le mode Compare (comparaison multi-modèles), spécifique débat | — | — | — | non |
| components/chat/compare/CompareErrorState.tsx | — | HORS SCOPE — état d'erreur du mode Compare | — | — | — | non |
| components/chat/compare/CompareMode.tsx | — | HORS SCOPE — mode de comparaison multi-modèles | — | — | — | non |
| components/chat/compare/ComparePromptInput.tsx | — | HORS SCOPE — saisie de prompt pour le mode Compare | — | — | — | non |
| components/chat/compare/CompareRoundView.tsx | — | HORS SCOPE — vue par round de comparaison | — | — | — | non |
| components/chat/comparison/ComparisonSelector.tsx | — | HORS SCOPE — sélecteur de sessions à comparer (débat/comparaison de modèles) | — | — | — | non |
| components/chat/comparison/ComparisonView.tsx | — | HORS SCOPE — vue de comparaison multi-session | — | — | — | non |
| components/chat/comparison/InsightCard.tsx | — | HORS SCOPE — vérifié par lecture : `ComparisonInsight` typé (difference/similarity/trend), spécifique à l'analyse de résultats de comparaison/débat | — | — | — | non |
| components/chat/comparison/MessageTimeline.tsx | — | HORS SCOPE — vérifié par lecture : `sessionIds`/`getSessionColor`, frise pour comparer plusieurs sessions de débat en parallèle | — | — | — | non |
| components/chat/comparison/MetricsCard.tsx | — | HORS SCOPE — vérifié par lecture : `ComparisonMetrics`, métriques de comparaison de débat (sentiment, etc.) | — | — | — | non |
| components/chat/debate/DebateMode.tsx | — | HORS SCOPE — mode débat (nom explicite) | — | — | — | non |
| components/chat/edit-session-dialog.tsx | edit-session-dialog | PORTER | `adaptive-modal`, `field` | libellés formulaire | à prévoir | non |
| components/chat/reactions/ReactionAnalytics.tsx | reaction-analytics | PORTER | `card` | libellés métriques | à prévoir | non |
| components/chat/reactions/ReactionBar.tsx | reaction-bar | PORTER | `button` | aucune (emoji = données) | à prévoir | non |
| components/chat/reactions/ReactionPicker.tsx | reaction-picker | PORTER | `popover` (à porter, voir `ui/popover.tsx`) | aucune | à prévoir | non |
| components/chat/save-chat-as-memory-form.tsx | save-chat-as-memory-form | PORTER | `field`, `textarea` | libellés formulaire | à prévoir | non |
| components/chat/search/MessageSearch.tsx | message-search | PORTER | `input` | placeholder | à prévoir | non |
| components/chat/search/SearchFilters.tsx | search-filters | DÉJÀ PRÉSENT (`filter-bar` générique) | `filter-bar` | libellés filtres (props) | déjà géré | non |
| components/chat/threading/ReplyInput.tsx | reply-input | PORTER | `input`, mention-input (à porter) | placeholder | à prévoir | non |
| components/chat/threading/ThreadIndicator.tsx | thread-indicator | PORTER | `badge` | libellé compteur | à prévoir | non |
| components/chat/threading/ThreadView.tsx | thread-view | PORTER | `message-list`, `message-card` | aucune | à prévoir | non |
| components/dashboard/AgentLibrary.tsx | agent-library | DÉJÀ PRÉSENT (composition `agent-list` + `filter-sidebar`, aucun nouveau composant requis) | `agent-list`, `filter-sidebar` | libellés bibliothèque | déjà géré | non |
| components/dashboard/DashboardContent.tsx | dashboard-content | DÉJÀ PRÉSENT (`dashboard-content`) | — | — | déjà géré | non |
| components/dashboard/DashboardHeader.tsx | dashboard-header | DÉJÀ PRÉSENT (`dashboard-header`) | — | — | déjà géré | non |
| components/dashboard/DashboardLayout.tsx | dashboard-layout | DÉJÀ PRÉSENT (`dashboard-layout`) | — | — | déjà géré | non |
| components/dashboard/DashboardSidebar.tsx | dashboard-sidebar | DÉJÀ PRÉSENT (`app-sidebar`) | — | — | déjà géré | non |
| components/dashboard/MetricCard.tsx | metric-card | DÉJÀ PRÉSENT (`stats-grid`, cartes de métriques composées) | `stats-grid` | libellé métrique (props) | déjà géré | non — **si une carte individuelle isolée manque, la extraire de `stats-grid` sera un futur gap, pas un PORTER neuf** |
| components/dashboard/OrgSwitcher.tsx | org-switcher | DÉJÀ PRÉSENT (`org-switcher`) | — | — | déjà géré | non |
| components/dashboard/QuickActions.tsx | quick-actions | DÉJÀ PRÉSENT (`quick-action-card`) | — | — | déjà géré | non |
| components/dashboard/QuickActionsMenu.tsx | quick-actions-menu | DÉJÀ PRÉSENT (`quick-actions-menu`) | — | — | déjà géré | non |
| components/dashboard/RecentActivity.tsx | recent-activity | DÉJÀ PRÉSENT (`activity-feed`) | — | — | déjà géré | non |
| components/dashboard/SessionList.tsx | session-list | PORTER (aucun composant "session" dans mosaic-blocks, cf. `find src/components -iname '*session*'` → vide) | `card` | libellés session | à prévoir | oui — même besoin fonctionnel que `sessions/session-list.tsx` (doublon, à consolider en un seul portage) |
| components/dashboard/TokenBalance.tsx | token-balance | PORTER | `card`, `progress` | libellé solde | à prévoir | oui — doublon avec `billing/token-balance-widget.tsx` |
| components/debate/AddModelButton.tsx | — | HORS SCOPE — vérifié par lecture : `AIModel` typé GPT-4/Claude-3.5/Llama-3/Gemini, bouton d'ajout de modèle pour un débat multi-modèles | — | — | — | non |
| components/debate/AutoModeSwitch.tsx | — | HORS SCOPE — vérifié par lecture : bascule le mode auto-débat entre `AIModel[]` | — | — | — | non |
| components/debate/MessageBubble.tsx | — | HORS SCOPE — vérifié par lecture : bulle typée par `AIModel`, `threadId`/`parentMessageId` de débat ; `message-card` générique déjà présent couvre le besoin EveVantage de bulle de message | — | — | — | non |
| components/debate/ModelColumn.tsx | — | HORS SCOPE — vérifié par lecture : colonne de résultats par modèle IA, vue côte-à-côte de débat | — | — | — | non |
| components/debate/ModelSettings.tsx | — | HORS SCOPE — vérifié par lecture : réglages d'un `AIModel` de débat (import `Dialog`/`DropdownMenu` locaux au produit débat, pas de généralisation identifiée) | — | — | — | non |
| components/debate/save-debate-result-form.tsx | — | HORS SCOPE — sauvegarde d'un résultat de débat ; le mécanisme générique "sauvegarder en mémoire" est déjà couvert par `save-chat-as-memory-form` (PORTER) et `save-artifact-as-memory-form` (PORTER) | — | — | — | non |
| components/export/ExportButton.tsx | export-button | PORTER | `button` | libellé bouton | à prévoir | non |
| components/export/ExportDialog.tsx | export-dialog | PORTER | `adaptive-modal` | libellés formats | à prévoir | non |
| components/export/desktop/export-center-desktop.tsx | export-center | PORTER | `card`, `tabs` | libellés | à prévoir | oui — doublon avec `export-center.tsx` et la variante mobile |
| components/export/export-center.tsx | export-center | PORTER | `card`, `tabs` | libellés | à prévoir | oui, cf. ligne au-dessus |
| components/export/mobile/export-center-mobile.tsx | export-center | PORTER | `card`, `tabs` | libellés | à prévoir | oui, doublon (porter une seule fois, responsive-pair) |
| components/landing/AnalyticsProvider.tsx | analytics-provider | PORTER | aucune | aucune | à prévoir | non |
| components/landing/CompanyLogoBar.tsx | company-logo-bar | DÉJÀ PRÉSENT (`logos-grid`) | `logos-grid` | — | déjà géré | oui — doublon avec `landing/shared/LandingCompanyLogos.tsx` |
| components/landing/ExitIntentPopup.tsx | exit-intent-popup | PORTER | `adaptive-modal` | texte popup | à prévoir | non |
| components/landing/InteractiveDemo.tsx | interactive-demo | PORTER | `card`, `button` | libellés démo | à prévoir | oui — chevauche `landing/shared/LandingDemo.tsx` et `LandingSeeItInActionDesktop/Mobile` (à dédupliquer côté source avant portage) |
| components/landing/LandingPage.tsx | landing-page | PORTER (page de composition) | `hero-split`, `feature-3col`, `testimonials-grid`, `footer-simple`, `navbar` | tous les textes marketing (props) | à prévoir | non |
| components/landing/SocialProofBadge.tsx | social-proof-badge | AMBIGU — proche de `integrations-badge` existant mais usage différent (preuve sociale vs badge d'intégration produit), pas assez d'info pour trancher DÉJÀ PRÉSENT vs PORTER sans voir le rendu | `badge` (si PORTER) | libellé preuve sociale | à prévoir | oui — chevauche `shared/LandingSocialProof.tsx` |
| components/landing/TestimonialCarousel.tsx | testimonial-carousel | DÉJÀ PRÉSENT (`testimonials-grid`) — **vigilance** : grille vs carrousel, comportement de défilement différent, vérifier si une variante `carousel` est nécessaire en plus de la grille | `testimonials-grid` | témoignages (props) | déjà géré (à vérifier variante scroll) | non |
| components/landing/TrustSignals.tsx | trust-signals | PORTER | `badge`, `integrations-badge` | libellés | à prévoir | non |
| components/landing/UrgencyBanner.tsx | urgency-banner | PORTER | `badge` | texte banner | à prévoir | non |
| components/landing/desktop/LandingAgentBuilderDesktop.tsx | landing-agent-builder | PORTER | `agent-composer` | textes marketing | à prévoir | oui — doublon avec la variante mobile |
| components/landing/desktop/LandingBenefitsDesktop.tsx | landing-benefits | PORTER | `feature-3col` | textes bénéfices | à prévoir | oui, doublon mobile |
| components/landing/desktop/LandingFeaturesDesktop.tsx | landing-features | DÉJÀ PRÉSENT (`feature-3col` / `feature-centered-media`) | `feature-3col` | textes features (props) | déjà géré | oui, doublon mobile |
| components/landing/desktop/LandingHeroDesktop.tsx | landing-hero | DÉJÀ PRÉSENT (`hero-split`) | `hero-split` | textes hero (props) | déjà géré | oui, doublon mobile |
| components/landing/desktop/LandingHowItWorksDesktop.tsx | landing-how-it-works | PORTER | `step-pipeline` (existant) | textes étapes | à prévoir | oui, doublon mobile |
| components/landing/desktop/LandingProblemDeepDiveDesktop.tsx | landing-problem-deep-dive | PORTER | `feature-centered-media` | textes | à prévoir | oui, doublon mobile |
| components/landing/desktop/LandingProblemSolutionDesktop.tsx | landing-problem-solution | PORTER | `feature-centered-media` | textes | à prévoir | oui, doublon mobile |
| components/landing/desktop/LandingSeeItInActionDesktop.tsx | landing-see-it-in-action | PORTER | interactive-demo (à porter) | textes | à prévoir | oui, doublon mobile + chevauche LandingDemo |
| components/landing/desktop/LandingSolutionRevealDesktop.tsx | landing-solution-reveal | PORTER | `feature-3col` | textes | à prévoir | oui, doublon mobile |
| components/landing/desktop/LandingStatsDesktop.tsx | landing-stats | DÉJÀ PRÉSENT (`stats-grid`) | `stats-grid` | libellés stats (props) | déjà géré | oui, doublon mobile |
| components/landing/desktop/LandingThreeModesSection.tsx | — | HORS SCOPE — section marketing présentant les 3 modes Chat/Debate/Compare du produit débat | — | — | — | oui — même nom de fichier que la variante mobile (collision interne à any-debate-ai) |
| components/landing/mobile/LandingAgentBuilderMobile.tsx | landing-agent-builder | PORTER | `agent-composer` | textes | à prévoir | oui, doublon desktop |
| components/landing/mobile/LandingBenefitsMobile.tsx | landing-benefits | PORTER | `feature-3col` | textes | à prévoir | oui, doublon desktop |
| components/landing/mobile/LandingFeaturesMobile.tsx | landing-features | DÉJÀ PRÉSENT (`feature-3col`) | `feature-3col` | textes (props) | déjà géré | oui, doublon desktop |
| components/landing/mobile/LandingHeroMobile.tsx | landing-hero | DÉJÀ PRÉSENT (`hero-split`) | `hero-split` | textes (props) | déjà géré | oui, doublon desktop |
| components/landing/mobile/LandingHowItWorksMobile.tsx | landing-how-it-works | PORTER | `step-pipeline` | textes | à prévoir | oui, doublon desktop |
| components/landing/mobile/LandingProblemDeepDiveMobile.tsx | landing-problem-deep-dive | PORTER | `feature-centered-media` | textes | à prévoir | oui, doublon desktop |
| components/landing/mobile/LandingProblemSolutionMobile.tsx | landing-problem-solution | PORTER | `feature-centered-media` | textes | à prévoir | oui, doublon desktop |
| components/landing/mobile/LandingSeeItInActionMobile.tsx | landing-see-it-in-action | PORTER | interactive-demo (à porter) | textes | à prévoir | oui, doublon desktop |
| components/landing/mobile/LandingSolutionRevealMobile.tsx | landing-solution-reveal | PORTER | `feature-3col` | textes | à prévoir | oui, doublon desktop |
| components/landing/mobile/LandingStatsMobile.tsx | landing-stats | DÉJÀ PRÉSENT (`stats-grid`) | `stats-grid` | libellés (props) | déjà géré | oui, doublon desktop |
| components/landing/mobile/LandingThreeModesSection.tsx | — | HORS SCOPE — idem raison desktop, section marketing des 3 modes du débat | — | — | — | oui — même nom que la variante desktop |
| components/landing/shared/LandingCompanyLogos.tsx | landing-company-logos | DÉJÀ PRÉSENT (`logos-grid`) | `logos-grid` | — | déjà géré | oui — doublon avec `CompanyLogoBar.tsx` |
| components/landing/shared/LandingDemo.tsx | landing-demo | AMBIGU — chevauche fortement `InteractiveDemo.tsx` et `LandingSeeItInAction*` (3 composants pour un besoin proche), impossible de trancher lequel est canonique sans lire le rendu complet des 3 fichiers | interactive-demo (si PORTER) | textes démo | à prévoir | oui, cf. raison |
| components/landing/shared/LandingFinalCTA.tsx | landing-final-cta | PORTER | `button`, `card` | texte CTA | à prévoir | non |
| components/landing/shared/LandingSocialProof.tsx | landing-social-proof | AMBIGU — chevauche `SocialProofBadge.tsx` et `TestimonialCarousel.tsx`, périmètre exact indéterminé sans lecture complète | `testimonials-grid` (si DÉJÀ PRÉSENT partiel) | textes | à prévoir | oui, cf. raison |
| components/layout/main-nav.tsx | main-nav | DÉJÀ PRÉSENT (`main-nav`) | — | libellés nav (props) | déjà géré | non |
| components/marketplace/MarketplaceFilterSidebar.tsx | filter-sidebar | DÉJÀ PRÉSENT (`filter-sidebar` générique) | `filter-sidebar` | libellés filtres (props) | déjà géré | non |
| components/marketplace/desktop/marketplace-card-desktop.tsx | marketplace-card | PORTER (aucune carte marketplace individuelle trouvée, seule la liste existe) | `card`, `badge` | libellés carte | à prévoir | oui, doublon mobile |
| components/marketplace/desktop/marketplace-list-desktop.tsx | marketplace-list | DÉJÀ PRÉSENT (`marketplace-list`) | — | — | déjà géré | oui, doublon avec `marketplace-list.tsx` racine et variante mobile |
| components/marketplace/marketplace-list.tsx | marketplace-list | DÉJÀ PRÉSENT (`marketplace-list`) | — | — | déjà géré | non |
| components/marketplace/mobile/marketplace-card-mobile.tsx | marketplace-card | PORTER | `card`, `badge` | libellés | à prévoir | oui, doublon desktop |
| components/marketplace/mobile/marketplace-list-mobile.tsx | marketplace-list | DÉJÀ PRÉSENT (`marketplace-list`) | — | — | déjà géré | oui, doublon |
| components/memory/MemoryFilterSidebar.tsx | filter-sidebar | DÉJÀ PRÉSENT (`filter-sidebar`) | `filter-sidebar` | libellés filtres (props) | déjà géré | non |
| components/memory/add-memory-form.tsx | add-memory-form | PORTER | `field`, `textarea`, `input` | libellés formulaire | à prévoir | non |
| components/memory/desktop/memory-card-desktop.tsx | memory-card | PORTER | `card`, `badge` | libellés | à prévoir | oui, doublon mobile |
| components/memory/desktop/memory-grid-desktop.tsx | memory-grid | PORTER | `adaptive-grid` | — | à prévoir | non |
| components/memory/document-upload.tsx | document-upload | PORTER (priorité SYNTHESE : "import de documents") | aucune | libellés upload | à prévoir | non |
| components/memory/edit-memory-dialog.tsx | edit-memory-dialog | PORTER | `adaptive-modal`, `field` | libellés formulaire | à prévoir | non |
| components/memory/memory-dashboard.tsx | memory-dashboard | PORTER | `dashboard-layout`, `stats-grid` | libellés dashboard | à prévoir | non |
| components/memory/mobile/memory-card-mobile.tsx | memory-card | PORTER | `card`, `badge` | libellés | à prévoir | oui, doublon desktop |
| components/memory/mobile/memory-list-mobile.tsx | memory-list | PORTER | `adaptive-grid` | — | à prévoir | non |
| components/memory/shared/memory-filters.tsx | filter-bar | DÉJÀ PRÉSENT (`filter-bar` générique) | `filter-bar` | libellés (props) | déjà géré | non |
| components/memory/shared/memory-search.tsx | memory-search | PORTER | `input` | placeholder | à prévoir | non |
| components/memory/url-scraper.tsx | url-scraper | PORTER (priorité SYNTHESE : "aspiration de pages web") | aucune | libellés | à prévoir | non |
| components/messages/desktop/message-list-desktop.tsx | message-list | DÉJÀ PRÉSENT (`message-list`) | — | — | déjà géré | oui, doublon |
| components/messages/message-card.tsx | message-card | DÉJÀ PRÉSENT (`message-card`) | — | — | déjà géré | non |
| components/messages/message-list.tsx | message-list | DÉJÀ PRÉSENT (`message-list`) | — | — | déjà géré | non |
| components/messages/mobile/message-list-mobile.tsx | message-list | DÉJÀ PRÉSENT (`message-list`) | — | — | déjà géré | oui, doublon |
| components/module-libraries/FrameworkEditorModal.tsx | module-library | DÉJÀ PRÉSENT (`module-library` — docstring : "Ported from components/module-libraries/ (FrameworkLibrary, PersonaLibrary, RoleLibrary + desktop/mobile variants + forms + editor modals). Combined into a single generic pattern.") | `module-library` | libellés champs (props `MosaicModuleFormField`) | déjà géré | non |
| components/module-libraries/FrameworkFilterSidebar.tsx | filter-sidebar | DÉJÀ PRÉSENT (`filter-sidebar`) | `filter-sidebar` | libellés (props) | déjà géré | non |
| components/module-libraries/FrameworkLibrary.tsx | module-library | DÉJÀ PRÉSENT (`module-library`, cf. docstring citée) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/PersonaEditorModal.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/PersonaLibrary.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/RoleEditorModal.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/RoleLibrary.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/desktop/FrameworkLibraryDesktop.tsx | module-library | DÉJÀ PRÉSENT (`module-library`, responsive déjà géré) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/desktop/PersonaLibraryDesktop.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/desktop/RoleLibraryDesktop.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/forms/FrameworkForm.tsx | module-library | DÉJÀ PRÉSENT (`module-library` — `MosaicModuleForm`) | `module-library` | libellés champs | déjà géré | non |
| components/module-libraries/forms/PersonaForm.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/forms/RoleForm.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/mobile/FrameworkLibraryMobile.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/mobile/PersonaLibraryMobile.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/module-libraries/mobile/RoleLibraryMobile.tsx | module-library | DÉJÀ PRÉSENT (`module-library`) | `module-library` | libellés | déjà géré | non |
| components/organization/admin-only-guard.tsx | admin-only-guard | PORTER — vérifié par lecture (mock `useOrganizationContext`, garde RBAC générique, s'aligne avec le concept "mandats" de la SYNTHESE) | `button`, `skeleton` (via `org-loading-state` existant) | texte accès refusé | à prévoir | non |
| components/organization/create-organization-dialog.tsx | create-organization-dialog | DÉJÀ PRÉSENT (`org-panel` — export `MosaicCreateOrgDialog`) | `org-panel` | libellés formulaire (props) | déjà géré | non |
| components/organization/desktop/MemberListDesktop.tsx | member-list | DÉJÀ PRÉSENT (`org-panel` — export `MosaicMemberList`, responsive déjà géré) | `org-panel` | libellés | déjà géré | oui, doublon mobile + `org-member-list.tsx` |
| components/organization/desktop/OrganizationOverviewDesktop.tsx | org-panel (tab overview) | DÉJÀ PRÉSENT (`org-panel` — `MosaicOrgPanel` tabs overview/members/settings) | `org-panel` | libellés onglets | déjà géré | oui, doublon mobile |
| components/organization/desktop/OrganizationSettingsDesktop.tsx | org-panel (tab settings) | DÉJÀ PRÉSENT (`org-panel`) | `org-panel` | libellés | déjà géré | oui, doublon mobile |
| components/organization/invite-member-dialog.tsx | invite-member-dialog | DÉJÀ PRÉSENT (`org-panel` — export `MosaicInviteMemberDialog`) | `org-panel` | libellés formulaire (props) | déjà géré | non |
| components/organization/mobile/MemberListMobile.tsx | member-list | DÉJÀ PRÉSENT (`org-panel` — `MosaicMemberList`) | `org-panel` | libellés | déjà géré | oui, doublon desktop |
| components/organization/mobile/OrganizationOverviewMobile.tsx | org-panel (tab overview) | DÉJÀ PRÉSENT (`org-panel`) | `org-panel` | libellés | déjà géré | oui, doublon desktop |
| components/organization/mobile/OrganizationSettingsMobile.tsx | org-panel (tab settings) | DÉJÀ PRÉSENT (`org-panel`) | `org-panel` | libellés | déjà géré | oui, doublon desktop |
| components/organization/multi-org-indicator.tsx | multi-org-indicator | DÉJÀ PRÉSENT (`org-panel` — export `MosaicMultiOrgIndicator`) | `org-panel` | libellé | déjà géré | non |
| components/organization/org-context-display.tsx | org-context-display | PORTER — vérifié par lecture (utilise `OrgRoleBadge`, désormais couvert, mais l'affichage combiné nom/avatar/rôle/switch n'est pas retrouvé tel quel dans `org-panel`/`org-switcher`) | `org-panel` (`MosaicOrgRoleBadge`), `org-switcher` | libellés | à prévoir | non |
| components/organization/org-loading-state.tsx | org-loading-state | DÉJÀ PRÉSENT (`skeleton` générique) | `skeleton` | — | déjà géré | non |
| components/organization/org-member-list.tsx | member-list | DÉJÀ PRÉSENT (`org-panel` — `MosaicMemberList`) | `org-panel` | libellés | déjà géré | oui, doublon avec `desktop/MemberListDesktop.tsx` et `mobile/MemberListMobile.tsx` |
| components/organization/role-badge.tsx | role-badge | DÉJÀ PRÉSENT (`org-panel` — export `MosaicOrgRoleBadge`) | `org-panel` | libellés rôle | déjà géré | non |
| components/sessions/desktop/session-list-desktop.tsx | session-list | PORTER (aucun composant "session" existant) | `card`, `adaptive-grid` | libellés | à prévoir | oui, doublon mobile + `dashboard/SessionList.tsx` |
| components/sessions/mobile/session-list-mobile.tsx | session-list | PORTER | `card`, `adaptive-grid` | libellés | à prévoir | oui, doublon desktop |
| components/sessions/session-card.tsx | session-card | PORTER | `card`, `badge` | libellés | à prévoir | non |
| components/sessions/session-list.tsx | session-list | PORTER | session-card (à porter) | libellés | à prévoir | oui, cf. doublon ci-dessus — **un seul portage `session-list` recommandé pour les 3 variantes + `dashboard/SessionList.tsx`** |
| components/settings/preferences-panel.tsx | preferences-panel | DÉJÀ PRÉSENT (`preferences-panel`) | — | — | déjà géré | non |
| components/settings/profile-panel.tsx | profile-panel | DÉJÀ PRÉSENT (`profile-panel`) | — | — | déjà géré | non |
| components/shared/delete-confirmation-dialog.tsx | delete-confirmation-dialog | DÉJÀ PRÉSENT (`delete-confirmation-dialog`) | — | texte confirmation (props) | déjà géré | non |
| components/templates/AgentTeamPreview.tsx | template-gallery (AgentTeamPreview) | DÉJÀ PRÉSENT (`template-gallery` — export `MosaicAgentTeamPreview`, docstring "Ported from components/templates/ ... AgentTeamPreview") | `template-gallery` | libellés (props) | déjà géré | non |
| components/templates/QuickStartPanel.tsx | template-gallery (QuickStartPanel) | DÉJÀ PRÉSENT (`template-gallery` — export `MosaicQuickStartPanel`) | `template-gallery` | libellés | déjà géré | non |
| components/templates/SaveTemplateModal.tsx | save-template-modal | PORTER (non listé dans la docstring "Ported from" de `template-gallery`) | `adaptive-modal`, `field` | libellés formulaire | à prévoir | non |
| components/templates/TemplateCard.tsx | template-gallery (TemplateCard) | DÉJÀ PRÉSENT (`template-gallery` — export `MosaicTemplateCard`) | `template-gallery` | libellés (props) | déjà géré | non |
| components/templates/TemplateFilterSidebar.tsx | filter-sidebar | DÉJÀ PRÉSENT (`filter-sidebar`) | `filter-sidebar` | libellés | déjà géré | non |
| components/templates/TemplateGallery.tsx | template-gallery | DÉJÀ PRÉSENT (`template-gallery` — export `MosaicTemplateGallery`) | `template-gallery` | libellés | déjà géré | non |
| components/templates/TemplateManagementPanel.tsx | template-management-panel | PORTER (non listé dans la docstring "Ported from" de `template-gallery`, gestion/CRUD admin) | `template-gallery`, `data-table` | libellés admin | à prévoir | non |
| components/templates/TemplatePreview.tsx | template-gallery (TemplatePreview) | DÉJÀ PRÉSENT (`template-gallery` — export `MosaicTemplatePreview`) | `template-gallery` | libellés | déjà géré | non |
| components/templates/TemplateSelectorModal.tsx | template-gallery (TemplateSelectorModal) | DÉJÀ PRÉSENT (`template-gallery`, docstring cite explicitement "TemplateSelectorModal" comme absorbé) | `template-gallery` | libellés | déjà géré | non |
| components/templates/desktop/QuickStartDesktop.tsx | template-gallery (QuickStartPanel desktop) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicQuickStartPanel`, responsive déjà géré) | `template-gallery` | libellés | déjà géré | oui, doublon mobile |
| components/templates/desktop/TemplateCardDesktop.tsx | template-gallery (TemplateCard desktop) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicTemplateCard`) | `template-gallery` | libellés | déjà géré | oui — doublon avec `desktop/template-card-desktop.tsx` (casse différente, même fonction) |
| components/templates/desktop/TemplateListDesktop.tsx | template-list | PORTER (liste de templates non citée dans la docstring "Ported from") | `template-gallery`, `adaptive-grid` | libellés | à prévoir | oui, doublon avec `desktop/template-list-desktop.tsx`, `mobile/TemplateListMobile.tsx`, `mobile/template-list-mobile.tsx`, `template-list.tsx` racine |
| components/templates/desktop/TemplatePreviewDesktop.tsx | template-gallery (TemplatePreview desktop) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicTemplatePreview`) | `template-gallery` | libellés | déjà géré | oui, doublon avec `mobile/TemplateDetailMobile.tsx` |
| components/templates/desktop/template-card-desktop.tsx | template-gallery (TemplateCard desktop) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicTemplateCard`) | `template-gallery` | libellés | déjà géré | oui — doublon avec `desktop/TemplateCardDesktop.tsx` (même dossier, casse différente = doublon interne any-debate-ai) |
| components/templates/desktop/template-list-desktop.tsx | template-list | PORTER | `template-gallery`, `adaptive-grid` | libellés | à prévoir | oui, doublon (cf. ligne `TemplateListDesktop.tsx`) — **porter `template-list` une seule fois pour toutes les variantes** |
| components/templates/mobile/AgentTeamPreviewMobile.tsx | template-gallery (AgentTeamPreview mobile) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicAgentTeamPreview`) | `template-gallery` | libellés | déjà géré | oui, doublon desktop |
| components/templates/mobile/QuickStartMobile.tsx | template-gallery (QuickStartPanel mobile) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicQuickStartPanel`) | `template-gallery` | libellés | déjà géré | oui, doublon desktop |
| components/templates/mobile/TemplateCardCompact.tsx | template-gallery (TemplateCard compact) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicTemplateCard`, vérifier variante `compact`) | `template-gallery` | libellés | déjà géré | non |
| components/templates/mobile/TemplateDetailMobile.tsx | template-gallery (TemplatePreview mobile) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicTemplatePreview`) | `template-gallery` | libellés | déjà géré | oui, doublon desktop |
| components/templates/mobile/TemplateGalleryMobile.tsx | template-gallery (mobile) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicTemplateGallery`) | `template-gallery` | libellés | déjà géré | non |
| components/templates/mobile/TemplateListMobile.tsx | template-list | PORTER | `template-gallery`, `adaptive-grid` | libellés | à prévoir | oui, doublon (cf. `TemplateListDesktop.tsx`) |
| components/templates/mobile/template-card-mobile.tsx | template-gallery (TemplateCard mobile) | DÉJÀ PRÉSENT (`template-gallery` — `MosaicTemplateCard`) | `template-gallery` | libellés | déjà géré | oui — doublon avec `mobile/TemplateCardCompact.tsx` |
| components/templates/mobile/template-list-mobile.tsx | template-list | PORTER | `template-gallery`, `adaptive-grid` | libellés | à prévoir | oui, doublon (cf. `TemplateListDesktop.tsx`) |
| components/templates/shared/TemplateAgentCard.tsx | template-agent-card | PORTER (non listé dans la docstring "Ported from") | `agent-card` | libellés | à prévoir | non |
| components/templates/shared/TemplateCategoryChips.tsx | template-category-chips | PORTER | `badge` | libellés catégories | à prévoir | non |
| components/templates/shared/TemplateSearchBar.tsx | template-search-bar | AMBIGU — proche de `filter-bar` + `input` combinés mais forme exacte (barre unique recherche+catégories) non vérifiée | `input`, `filter-bar` (si PORTER confirmé) | placeholder | à prévoir | non |
| components/templates/template-list.tsx | template-list | PORTER | `template-gallery`, `adaptive-grid` | libellés | à prévoir | oui — composant de base derrière tous les doublons `*TemplateList*` ci-dessus ; **porter une seule fois** |
| components/theme-provider.tsx | theme-provider | DÉJÀ PRÉSENT (`theme-provider`) | — | — | déjà géré | non |
| components/ui/alert-dialog.tsx | alert-dialog | PORTER (absent des 75 primitives existantes) | aucune | libellés (props hôte) | à prévoir | non |
| components/ui/avatar.tsx | avatar | DÉJÀ PRÉSENT (`avatar`) | — | — | déjà géré | non |
| components/ui/badge.tsx | badge | DÉJÀ PRÉSENT (`badge`) | — | — | déjà géré | non |
| components/ui/breadcrumb.tsx | breadcrumb | PORTER (absent en standalone ; `dashboard-layout` consomme un tableau `breadcrumbs` en interne mais n'expose pas de primitive `Breadcrumb` réutilisable seule) | aucune | libellés (props) | à prévoir | non |
| components/ui/button.tsx | button | DÉJÀ PRÉSENT (`button`) | — | — | déjà géré | non |
| components/ui/canvas-toggle.tsx | canvas-toggle | PORTER (nouveau, lié à `ArtifactCanvas`) | `button` | libellé toggle | à prévoir | non |
| components/ui/card.tsx | card | DÉJÀ PRÉSENT (`card`) | — | — | déjà géré | non |
| components/ui/checkbox.tsx | checkbox | DÉJÀ PRÉSENT (`checkbox`) | — | — | déjà géré | non |
| components/ui/dialog.tsx | dialog | DÉJÀ PRÉSENT (`adaptive-modal` couvre le cas d'usage modal générique) | `adaptive-modal` | — | déjà géré | non — **vigilance** : si un usage a besoin d'un dialog headless non-adaptatif (sans responsive desktop/mobile), gap potentiel |
| components/ui/drawer.tsx | drawer | PORTER (absent des 75 primitives, panneau latéral distinct de `adaptive-modal`) | aucune | — | à prévoir | non |
| components/ui/dropdown-menu.tsx | dropdown-menu | DÉJÀ PRÉSENT (`dropdown-menu`) | — | — | déjà géré | non |
| components/ui/input.tsx | input | DÉJÀ PRÉSENT (`input`) | — | — | déjà géré | non |
| components/ui/label.tsx | label | DÉJÀ PRÉSENT (`field` — sous-composant `Field.Label` cité dans CHANGELOG) | `field` | — | déjà géré | non |
| components/ui/navigation-menu.tsx | navigation-menu | AMBIGU — `main-nav`/`app-sidebar` couvrent la navigation top-level, mais un méga-menu déroulant avec sous-items n'est pas confirmé équivalent | `main-nav` (partiel) | libellés menu | à prévoir | non |
| components/ui/popover.tsx | popover | PORTER (absent des 75 primitives) | aucune | — | à prévoir | non |
| components/ui/progress.tsx | progress | DÉJÀ PRÉSENT (`progress`) | — | — | déjà géré | non |
| components/ui/radio-group.tsx | radio-group | DÉJÀ PRÉSENT (`radio-group`) | — | — | déjà géré | non |
| components/ui/resizable.tsx | resizable | PORTER (absent des 75 primitives) | aucune | — | à prévoir | non |
| components/ui/scroll-area.tsx | scroll-area | DÉJÀ PRÉSENT (`scroll-area`) | — | — | déjà géré | non |
| components/ui/select.tsx | select | DÉJÀ PRÉSENT (`select`) | — | — | déjà géré | non |
| components/ui/separator.tsx | separator | DÉJÀ PRÉSENT (`separator`) | — | — | déjà géré | non |
| components/ui/sheet.tsx | sheet | AMBIGU — proche d'`adaptive-modal` mais le sheet est un panneau latéral slide-in, pattern potentiellement distinct ; pas assez d'info pour confirmer la fusion | `adaptive-modal` (si fusionnable) | — | à prévoir | non |
| components/ui/skeleton.tsx | skeleton | DÉJÀ PRÉSENT (`skeleton`) | — | — | déjà géré | non |
| components/ui/slider.tsx | slider | DÉJÀ PRÉSENT (`slider`) | — | — | déjà géré | non |
| components/ui/switch.tsx | switch | DÉJÀ PRÉSENT (`switch`) | — | — | déjà géré | non |
| components/ui/tabs.tsx | tabs | DÉJÀ PRÉSENT (`tabs`) | — | — | déjà géré | non |
| components/ui/textarea.tsx | textarea | DÉJÀ PRÉSENT (`textarea`) | — | — | déjà géré | non |
| components/ui/theme-toggle.tsx | theme-toggle | DÉJÀ PRÉSENT (`theme-toggle`) | — | — | déjà géré | non |
| components/ui/toast.tsx | toast | PORTER (absent des 75 primitives ; source dépend de `sonner`, ne pas porter la dépendance `sonner` telle quelle sans vérification licence/bundle) | aucune | messages toast (props hôte) | à prévoir | non |
| components/ui/tooltip.tsx | tooltip | DÉJÀ PRÉSENT (`tooltip`) | — | — | déjà géré | non |

---

## 1. Collisions de nom (avec les 75 composants existants ET en interne à any-debate-ai)

**Collisions internes à any-debate-ai** (même nom de fichier ou même besoin fonctionnel dans deux dossiers différents — à résoudre AVANT tout portage, sinon deux tâches PORTER dupliquées) :

- `components/artifact/ArtifactCanvas.tsx` vs `components/artifacts/ArtifactCanvas.tsx` — dossier singulier vs pluriel.
- `components/agent-management/AgentCard.tsx` vs `components/agents/agent-card.tsx`.
- `components/dashboard/SessionList.tsx` vs `components/sessions/session-list.tsx` (+ variantes desktop/mobile).
- `components/billing/token-balance-widget.tsx` vs `components/dashboard/TokenBalance.tsx`.
- `components/organization/org-member-list.tsx` vs `components/organization/desktop/MemberListDesktop.tsx` vs `components/organization/mobile/MemberListMobile.tsx`.
- `components/landing/CompanyLogoBar.tsx` vs `components/landing/shared/LandingCompanyLogos.tsx`.
- `components/landing/InteractiveDemo.tsx` vs `components/landing/shared/LandingDemo.tsx` vs `LandingSeeItInActionDesktop.tsx`/`LandingSeeItInActionMobile.tsx`.
- `components/landing/desktop/LandingThreeModesSection.tsx` vs `components/landing/mobile/LandingThreeModesSection.tsx` (même nom de fichier, dossiers différents).
- `components/templates/desktop/TemplateCardDesktop.tsx` vs `components/templates/desktop/template-card-desktop.tsx` (casse différente, même dossier).
- `components/templates/*TemplateList*` — 5 fichiers pour le même besoin (`desktop/TemplateListDesktop.tsx`, `desktop/template-list-desktop.tsx`, `mobile/TemplateListMobile.tsx`, `mobile/template-list-mobile.tsx`, `template-list.tsx` racine).
- `components/marketplace/marketplace-list.tsx` vs `desktop/marketplace-list-desktop.tsx` vs `mobile/marketplace-list-mobile.tsx`.
- `components/export/export-center.tsx` vs `desktop/export-center-desktop.tsx` vs `mobile/export-center-mobile.tsx`.

**Collisions avec les 75 existants** (nom cible identique à un dossier `mosaic-blocks` déjà en place — confirme le verdict DÉJÀ PRÉSENT, pas un risque de collision à la publication puisqu'aucun PORTER n'est prévu dessus) : `adaptive-grid`, `adaptive-modal`, `adaptive-navigation`, `agent-card`, `agent-composer`, `agent-list`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dashboard-content`, `dashboard-header`, `dashboard-layout`, `delete-confirmation-dialog`, `dropdown-menu`, `filter-sidebar`, `input`, `logos-grid`, `main-nav`, `marketplace-list`, `message-card`, `message-list`, `module-card`, `module-library`, `org-panel`, `org-switcher`, `preferences-panel`, `profile-panel`, `progress`, `quick-action-card`, `quick-actions-menu`, `quick-agent-selector`, `radio-group`, `scroll-area`, `select`, `selector-modal`, `separator`, `skeleton`, `slider`, `stats-grid`, `switch`, `tabs`, `template-gallery`, `testimonials-grid`, `textarea`, `theme-provider`, `theme-toggle`, `tooltip`.

---

## 2. Ordre de portage (graphe de dépendances)

**Vague 0 — primitives manquantes (aucune dépendance sur les autres PORTER)** : `alert-dialog`, `breadcrumb`, `canvas-toggle`, `drawer`, `popover`, `resizable`, `toast`. Ces 7 primitives sont des feuilles du graphe — tout composant PORTER de niveau supérieur qui les cite comme dépendance doit attendre leur portage.

**Vague 1 — composants composés qui ne dépendent que de primitives DÉJÀ PRÉSENTES** (peuvent démarrer en parallèle de la Vague 0) :
`agent-editor`, `model-selector`, `agent-builder-modal`, `agent-preview`, `session-card`, `member`-related (déjà couvert), `save-chat-as-memory-form`, `save-artifact-as-memory-form`, `add-memory-form`, `edit-memory-dialog`, `edit-session-dialog`, `document-upload`, `url-scraper`, `memory-search`, `bookmark-button`, `bookmark-editor`, `reaction-bar` (attend `popover` pour `reaction-picker`), `thread-indicator`, `admin-only-guard`, `org-context-display`, `template-agent-card`, `template-category-chips`, `save-template-modal`, `token-balance-widget`/`token-balance` (consolidé), `cancel-subscription-dialog`, `change-plan-dialog`, `plan-selection-reference`, `purchase-tokens-dialog`, `token-balance-warning`, `export-button`, `export-dialog`, `analytics-provider`, `exit-intent-popup`, `trust-signals`, `urgency-banner`, `landing-final-cta`.

**Vague 2 — dépend d'un composant Vague 1** :
- `session-list` (consolidé, 5 doublons) dépend de `session-card` (Vague 1).
- `chat-thread`, `thread-view` dépendent de `message-list`/`message-card` (déjà présents) — peuvent démarrer immédiatement mais groupés ici pour lisibilité fonctionnelle chat.
- `reply-input`, `mention-input` (dépendance croisée : `reply-input` dépend de `mention-input`).
- `bookmark-panel` dépend de `bookmark-button`/`bookmark-editor` (Vague 1) + `filter-sidebar` (déjà présent).
- `collection-manager` dépend de `module-library` (déjà présent).
- `artifact-canvas`, `artifact-renderer`, `artifact-toolbar`, `chart-artifact`, `checklist-artifact`, `collaboration-indicator`, `document-artifact`, `data-table-artifact` — famille artefacts, dépendent toutes de primitives déjà présentes (`card`, `badge`, `checkbox`, `data-table`) → peuvent démarrer en Vague 1 réellement, mais `artifact-export-modal` et `version-history-panel` dépendent d'`artifact-canvas`/`artifact-renderer` en amont (Vague 2).
- `artifact-library` dépend de `module-library` (déjà présent) + `artifact-canvas` (pour la preview dans la bibliothèque) → Vague 2.
- `artifact-search` dépend de `artifact-canvas`/`artifact-renderer` pour le rendu des résultats → Vague 2.
- `export-center` (consolidé 3 doublons) dépend de `export-button`/`export-dialog` (Vague 1).
- `memory-dashboard` dépend de `memory-card`, `memory-grid`, `memory-list` (Vague 1/2) + `dashboard-layout`/`stats-grid` (déjà présents).
- `template-list` (consolidé 5 doublons) dépend de `template-gallery` (déjà présent) — Vague 1 en réalité, listé ici pour le groupement avec ses doublons.
- `template-management-panel` dépend de `template-gallery` (déjà présent) + `data-table` (déjà présent) → Vague 1.
- `chat-sidebar` dépend de `app-sidebar` (déjà présent) → Vague 1.
- Toutes les sections `landing-*` (Vague 2) dépendent des blocs marketing déjà présents (`feature-3col`, `hero-split`, `stats-grid`, `step-pipeline`) OU de `interactive-demo`/`agent-composer` — **`landing-agent-builder` dépend donc de `agent-editor`/`agent-builder-modal` (Vague 1) et doit attendre leur portage**.
- `landing-page` (composition finale) dépend de TOUTES les sections `landing-*` ci-dessus → dernière étape de la famille landing.

**Vague 3 — résolution des AMBIGU avant tout code** (bloque le portage tant qu'un humain ou une lecture plus approfondie ne tranche pas) : `landing-demo` vs `interactive-demo` vs `landing-see-it-in-action` (3 candidats pour 1 besoin) ; `landing-social-proof` vs `social-proof-badge` vs `testimonial-carousel` ; `template-search-bar` ; `navigation-menu` ; `sheet` vs `adaptive-modal`.

**Ordre recommandé global** : Vague 0 (primitives) → Vague 1 (composés sur primitives déjà présentes) → Vague 2 (composés sur Vague 1) → arbitrage Vague 3 → reprise du portage des items débloqués.

---

## 3. HORS SCOPE (liste + raison)

| Composant | Raison |
|---|---|
| `chat/ModeSelector.tsx` | Sélectionne entre modes Chat/Debate/Compare/Auto-Debate — vérifié : `CHAT_MODES`, `ChatMode` typés autour du produit débat. |
| `chat/auto-debate/AutoDebateMode.tsx` | Mode auto-débat, aucun usage EveVantage identifié. |
| `chat/auto-debate/AutoDebateSetup.tsx` | Configuration du mode auto-débat. |
| `chat/compare/CompareAgentSelector.tsx` | Sélection de modèles pour comparaison multi-modèles (mode Compare). |
| `chat/compare/CompareErrorState.tsx` | État d'erreur spécifique au mode Compare. |
| `chat/compare/CompareMode.tsx` | Mode de comparaison multi-modèles. |
| `chat/compare/ComparePromptInput.tsx` | Saisie de prompt pour le mode Compare. |
| `chat/compare/CompareRoundView.tsx` | Vue par round de comparaison. |
| `chat/comparison/ComparisonSelector.tsx` | Sélecteur de sessions à comparer (débat). |
| `chat/comparison/ComparisonView.tsx` | Vue de comparaison multi-session. |
| `chat/comparison/InsightCard.tsx` | `ComparisonInsight` typé (difference/similarity/trend) — analyse de résultats de comparaison de débat. |
| `chat/comparison/MessageTimeline.tsx` | `sessionIds`/`getSessionColor` — frise pour comparer plusieurs sessions de débat. |
| `chat/comparison/MetricsCard.tsx` | `ComparisonMetrics` — métriques de comparaison de débat. |
| `chat/debate/DebateMode.tsx` | Mode débat (nom explicite). |
| `debate/AddModelButton.tsx` | Ajout de modèle `AIModel` (GPT-4/Claude/Llama/Gemini) pour un débat multi-modèles. |
| `debate/AutoModeSwitch.tsx` | Bascule le mode auto-débat entre modèles. |
| `debate/MessageBubble.tsx` | Bulle typée par `AIModel`, `threadId` de débat — `message-card` générique couvre déjà le besoin EveVantage. |
| `debate/ModelColumn.tsx` | Colonne de résultats par modèle IA, vue côte-à-côte de débat. |
| `debate/ModelSettings.tsx` | Réglages d'un `AIModel` de débat, pas de généralisation identifiée. |
| `debate/save-debate-result-form.tsx` | Sauvegarde d'un résultat de débat — le mécanisme générique "sauvegarder en mémoire" est déjà couvert ailleurs (PORTER `save-chat-as-memory-form`/`save-artifact-as-memory-form`). |
| `landing/desktop/LandingThreeModesSection.tsx` | Section marketing présentant les 3 modes Chat/Debate/Compare du produit débat. |
| `landing/mobile/LandingThreeModesSection.tsx` | Idem, variante mobile. |

**21 composants HORS SCOPE au total.**

---

Orchestrator: Gamma — VantageOS Team | 2026-07-12
