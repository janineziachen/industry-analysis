<a id="readme-top"></a>

> 🚀 **在线体验 / Live Demo**
>
> 👉 **[https://janinziachen-industry-analysis-production.up.railway.app](https://janinziachen-industry-analysis-production.up.railway.app)**
>
> 点右上角「API 设置」填入你的 Anthropic API Key 即可开始使用。
> Click "API Settings" in the top right corner and enter your Anthropic API Key to get started.

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<br />
<div align="center">

<h3 align="center">行业洞察 · 产品规划 / Industry Insights · Product Planning</h3>

  <p align="center">
    AI 驱动的行业深度分析与产品规划工具 · AI-powered industry analysis and product planning tool
    <br />
    <a href="https://github.com/janineziachen/industry-analysis"><strong>查看文档 / Docs »</strong></a>
    <br />
    <br />
    <a href="https://janinziachen-industry-analysis-production.up.railway.app" target="_blank"><strong>🚀 立即使用 / Live Demo</strong></a>
    &middot;
    <a href="https://github.com/janineziachen/industry-analysis/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/janineziachen/industry-analysis/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

---

<!-- TABLE OF CONTENTS -->
<details>
  <summary>目录 / Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">关于本项目 / About</a></li>
    <li><a href="#built-with">技术栈 / Built With</a></li>
    <li><a href="#getting-started">快速开始 / Getting Started</a></li>
    <li><a href="#usage">使用方式 / Usage</a></li>
    <li><a href="#roadmap">路线图 / Roadmap</a></li>
    <li><a href="#contributing">贡献 / Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">联系 / Contact</a></li>
  </ol>
</details>

---

## About The Project

**中文**

面向产品经理、行业分析师和创业者的 AI 研究工具。输入任意行业名称，系统通过大语言模型生成结构化深度分析报告，涵盖：

- 📊 市场规模与增速
- 🏭 产业链全景
- 📋 政策监管动态
- 💡 核心痛点与 AI 机会
- 🏆 竞争格局与对标企业
- 💰 投融资动态
- 🗺️ 行业速通（核心逻辑 + 面试金句）

报告生成后可一键进入**产品规划**模块，输出 JTBD 需求分析、MVP 功能规划、竞争定位建议与商业可行性评估。

> **数据隐私**：所有生成的报告数据均缓存在浏览器本地（localStorage），不会上传至任何服务器。API Key 同样仅存储在本地浏览器中。

---

**English**

An AI research tool for product managers, industry analysts, and entrepreneurs. Enter any industry name and the system generates a structured in-depth analysis report covering:

- 📊 Market size and growth rate
- 🏭 Industry chain overview
- 📋 Policy and regulatory dynamics
- 💡 Core pain points and AI opportunities
- 🏆 Competitive landscape and benchmark companies
- 💰 Investment and M&A activity
- 🗺️ Industry quick guide (core logic + interview talking points)

After the report is generated, jump directly into the **Product Planning** module for JTBD analysis, MVP scoping, competitive positioning, and business viability assessment.

> **Privacy**: All generated report data is cached in your browser's localStorage only — nothing is uploaded to any server. Your API Key is also stored locally in your browser.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![TailwindCSS][TailwindCSS]][Tailwind-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Getting Started

### 🌐 直接使用 / Use Online (Recommended)

无需安装任何软件，直接打开网站即可 · No installation required, just open the link:

👉 **[https://janinziachen-industry-analysis-production.up.railway.app](https://janinziachen-industry-analysis-production.up.railway.app)**

点右上角「API 设置」填入你的 Anthropic API Key 即可开始使用。
Click "API Settings" in the top right corner and enter your Anthropic API Key.

> **中国用户 / China users**：调用 AI 功能需要能访问 Anthropic API。可在「API 设置」中填入支持国内访问的第三方 API 中转地址。
> Calling AI features requires access to the Anthropic API. Users in China can enter a third-party API proxy URL in the settings.

---

### 💻 本地部署 / Local Development

#### Prerequisites

* Node.js 18+
* npm
  ```sh
  npm install npm@latest -g
  ```
* Anthropic API Key — [console.anthropic.com](https://console.anthropic.com)
* Tavily API Key (optional, for web search) — [tavily.com](https://tavily.com)

#### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/janineziachen/industry-analysis.git
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Copy the environment variables example
   ```sh
   cp .env.local.example .env.local
   ```
4. Add your API keys to `.env.local`
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   TAVILY_API_KEY=your_tavily_key_here
   ```
5. Start the dev server
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Usage

**中文**
1. 在首页输入行业名称（如「AI 客服」、「新能源汽车」），点击「开始分析」
2. 等待 AI 生成完整行业报告（约 2-5 分钟）
3. 点击各模块卡片查看深度详情
4. 点击右下角「专家问答」针对报告内容提问
5. 点击「进入产品规划」生成产品策略方案
6. 通过「导出报告」保存为 Word / PDF / HTML 格式

**English**
1. Enter an industry name (e.g. "AI Customer Service", "EV"), click "Start Analysis"
2. Wait 2-5 minutes for the AI to generate the full report
3. Click on module cards to view in-depth details
4. Click the "Expert Q&A" button to ask questions about the report
5. Click "Enter Product Planning" to generate a product strategy
6. Export the report as Word / PDF / HTML

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Roadmap

- [x] 行业深度分析报告 / Industry analysis report
- [x] 产品规划模块 / Product planning module
- [x] 专家问答浮窗 / Expert Q&A panel
- [x] 报告导出 / Report export (Word / PDF / HTML / Markdown)
- [x] 本地缓存 / Local caching
- [ ] 多行业对比分析 / Multi-industry comparison
- [ ] 自定义报告模板 / Custom report templates

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contact

Project Link: [https://github.com/janineziachen/industry-analysis](https://github.com/janineziachen/industry-analysis)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/janineziachen/industry-analysis.svg?style=for-the-badge
[contributors-url]: https://github.com/janineziachen/industry-analysis/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/janineziachen/industry-analysis.svg?style=for-the-badge
[forks-url]: https://github.com/janineziachen/industry-analysis/network/members
[stars-shield]: https://img.shields.io/github/stars/janineziachen/industry-analysis.svg?style=for-the-badge
[stars-url]: https://github.com/janineziachen/industry-analysis/stargazers
[issues-shield]: https://img.shields.io/github/issues/janineziachen/industry-analysis.svg?style=for-the-badge
[issues-url]: https://github.com/janineziachen/industry-analysis/issues
[license-shield]: https://img.shields.io/github/license/janineziachen/industry-analysis.svg?style=for-the-badge
[license-url]: https://github.com/janineziachen/industry-analysis/blob/main/LICENSE
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
