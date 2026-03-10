# 🛡️ SafeLink Verifier

**A transparent, real-time tool for detecting phishing and malware in links.**

## 📖 Overview
**SafeLink Verifier** was developed to eliminate the anxiety associated with opening links sent via messaging apps. It provides an objective, third-party security audit for any URL, ensuring that "just clicking a link" never compromises your device's safety.

> **The Goal:** To provide 100% transparency. This app doesn't ask you to "trust the sender"—it asks you to trust the collective intelligence of the world's leading security experts.

## ✨ Features
* **Instant Analysis:** Copy-paste any URL and get results in seconds.
* **Global Security Network:** Powered by the **VirusTotal API**, cross-referencing links with **70+ industry leaders** like ESET, Kaspersky, and Google Safe Browsing.
* **Privacy First:** No tracking, no data collection, and zero advertisements.
* **Visual Confidence:** Clear, color-coded results (Green for Safe, Red for Dangerous).

## 🚀 How It Works
1.  **Input:** Paste a suspicious link into the app.
2.  **Analysis:** SafeLink Verifier encodes the URL and queries the VirusTotal database.
3.  **Verdict:** If the result shows **0 detections**, the link is verified as safe by the global security community.

## 🛠️ Installation & Setup

### Prerequisites
* [Flutter SDK](https://docs.flutter.dev/get-started/install)
* A VirusTotal API Key (Available for free at [virustotal.com](https://www.virustotal.com/))

### Quick Start
1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/your-username/safelink-verifier.git](https://github.com/your-username/safelink-verifier.git)
    ```
2.  **Install dependencies:**
    ```bash
    flutter pub get
    ```
3.  **Add your API Key:**
    Open `lib/main.dart` and replace `YOUR_API_KEY_HERE` with your personal VirusTotal key.
4.  **Run:**
    ```bash
    flutter run
    ```

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.
