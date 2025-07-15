# Dashboard de Recrutement Professionnel / Professional Recruitment Dashboard

## 🇫🇷 Présentation
Ce projet est un tableau de bord moderne pour l’analyse et la gestion des résultats de tests de recrutement. Il permet de visualiser, filtrer, exporter et analyser les performances des candidats à partir de fichiers CSV fusionnés.

## 🇬🇧 Overview
This project is a modern dashboard for analyzing and managing recruitment test results. It allows you to visualize, filter, export, and analyze candidate performance from merged CSV files.

---

## 🚀 Stack Technique / Tech Stack
- **Next.js 14+ (App Router, TypeScript)**
- **shadcn/ui, Tailwind CSS**
- **Zustand, React Query**
- **Chart.js, react-chartjs-2**
- **Zod (validation)**
- **jsPDF, PapaParse, FileSaver**

---

## ⚙️ Installation & Démarrage / Getting Started

```bash
# 1. Installer les dépendances / Install dependencies
npm install

# 2. Lancer le serveur de développement / Start dev server
npm run dev

# 3. Accéder à l’application / Access the app
http://localhost:3000
```

---

## ✨ Fonctionnalités Principales / Main Features
- Importation de plusieurs fichiers CSV (fusion automatique)
- Détection et gestion des doublons
- Seuil d’admission dynamique, historique des seuils
- Statistiques avancées (moyenne, médiane, quartiles, min/max)
- Visualisations interactives (histogramme, camembert, barres)
- Tableau de candidats paginé, tri, recherche, favoris, export CSV/PDF
- Rapport PDF complet (stats, graphiques, tableau)
- Mode sombre/clair, responsive, accessibilité

---

## 🗂️ Structure du Code / Code Structure
- `src/app/` : Pages et layout principal
- `src/features/candidates/` : Logique métier, composants, statistiques, import/export
- `src/hooks/` : Hooks personnalisés (chargement, parsing)
- `src/context/` : Stores Zustand (favoris, seuils)
- `src/types/` : Types TypeScript
- `src/utils/` : Utilitaires (CSV, helpers)

---

## 🧑‍💻 Bonnes Pratiques / Best Practices
- Code typé, modulaire, maintenable
- Accessibilité (ARIA, navigation clavier, contrastes)
- Tests unitaires et d’intégration (Jest, Testing Library)
- Optimisation (lazy loading, memo, responsive)
- Sécurité (validation, sanitization)

---

## 👩‍💼 Guide Utilisateur / User Guide

### 🇫🇷
1. Importez un ou plusieurs fichiers CSV (drag & drop ou sélection)
2. Ajustez le seuil d’admission selon vos critères
3. Analysez les KPIs, graphiques et statistiques
4. Filtrez, triez, marquez des favoris dans le tableau
5. Exportez les résultats (CSV, PDF, rapport complet)
6. Consultez l’historique des seuils et revenez à une version antérieure si besoin

### 🇬🇧
1. Import one or more CSV files (drag & drop or select)
2. Adjust the admission threshold as needed
3. Analyze KPIs, charts, and statistics
4. Filter, sort, and bookmark candidates in the table
5. Export results (CSV, PDF, full report)
6. View threshold history and revert to a previous version if needed

---

## 📣 Contact & Support
Pour toute question ou contribution, contactez l’équipe technique ou ouvrez une issue sur le dépôt.

For questions or contributions, contact the technical team or open an issue on the repository.
# mass-recrutement
