# HRT Recorder Web

A privacy-focused, web-based tool for simulating and tracking estradiol levels during Hormone Replacement Therapy (HRT). 

> **✨ Created via Gemini 3 Vibe Coding**

## 🧠 Algorithm & Core Logic

The pharmacokinetic algorithms, mathematical models, and parameters used in this simulation are derived directly from the **[HRT-Recorder-PKcomponent-Test](https://github.com/LaoZhong-Mihari/HRT-Recorder-PKcomponent-Test)** repository.

We strictly adhere to the `PKcore.swift` and `PKparameter.swift` logic provided by **@LaoZhong-Mihari**, ensuring that the web simulation matches the accuracy of the original native implementation (including 3-compartment models, two-part depot kinetics, and specific sublingual absorption tiers).

## 🚀 Features

*   **Multi-Route Simulation**: Supports Injection (Valerate, Benzoate, Cypionate, Enanthate), Oral, Sublingual, Gel, and Patches.
*   **Real-time Visualization**: Interactive charts showing estimated estradiol concentration (pg/mL) over time.
*   **Sublingual Guidance**: Detailed "Hold Time" and absorption parameter ($\theta$) guidance based on strict medical modeling.
*   **Privacy First**: All data is stored entirely in your browser's `localStorage`. No data is ever sent to a server.
*   **Bilingual**: Native support for **Simplified Chinese** and **English**.

## 🛠️ Run Locally

This project is built with **React** and **TypeScript**. You can run it easily using a modern frontend tooling setup like [Vite](https://vitejs.dev/).

1.  **Clone or Download** the files.
2.  **Initialize a Vite project** (if starting from scratch):
    ```bash
    npm create vite@latest hrt-recorder -- --template react-ts
    cd hrt-recorder
    npm install
    ```
3.  **Install Dependencies**:
    ```bash
    npm install recharts lucide-react uuid @types/uuid clsx tailwind-merge
    ```
4.  **Setup Tailwind CSS**:
    Follow the [Tailwind CSS Vite Guide](https://tailwindcss.com/docs/guides/vite) to generate your `tailwind.config.js`.
5.  **Add Code**:
    *   Place `logic.ts` and `index.tsx` into your `src/` folder.
    *   Update `index.html` entry point if necessary.
6.  **Run**:
    ```bash
    npm run dev
    ```

## 🌐 Deployment & Hosting

You are **very welcome** to deploy this application to your own personal website, blog, or server! 

We want this tool to be accessible to everyone who needs it. You do not need explicit permission to host it.

**Attribution Requirement:**
If you deploy this app publicly, please:
1.  **Keep the original algorithm credits**: Visibly link back to the [HRT-Recorder-PKcomponent-Test](https://github.com/LaoZhong-Mihari/HRT-Recorder-PKcomponent-Test) repository.
2.  **Respect the license**: Ensure you follow any licensing terms associated with the original algorithm code.

*Happy Estimating!* 🏳️‍⚧️