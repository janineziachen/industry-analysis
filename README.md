<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">

<h3 align="center">行业洞察 · 产品规划</h3>

  <p align="center">
    AI 驱动的行业深度分析与产品规划工具。输入行业名称，2-5 分钟生成专业研报，并支持一键进入产品规划阶段。
    <br />
    <a href="https://github.com/janineziachen/industry-analysis"><strong>查看文档 »</strong></a>
    <br />
    <br />
    <a href="https://frabjous-cajeta-82bc8f.netlify.app/" target="_blank"><strong>🚀 立即使用</strong></a>
    &middot;
    <a href="https://github.com/janineziachen/industry-analysis/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/janineziachen/industry-analysis/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>目录</summary>
  <ol>
    <li>
      <a href="#about-the-project">关于本项目</a>
      <ul>
        <li><a href="#built-with">技术栈</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">快速开始</a>
      <ul>
        <li><a href="#prerequisites">先决条件</a></li>
        <li><a href="#installation">安装</a></li>
      </ul>
    </li>
    <li><a href="#usage">使用方式</a></li>
    <li><a href="#roadmap">路线图</a></li>
    <li><a href="#contributing">贡献</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">联系</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

本项目是一个面向产品经理、行业分析师和创业者的 AI 研究工具。输入任意行业名称，系统通过大语言模型生成结构化深度分析报告，涵盖市场规模、产业链全景、政策监管、核心痛点、AI 机会、竞争格局、对标企业、投融资动态等模块。

报告生成后可一键进入**产品规划**模块，基于行业数据输出 JTBD 需求分析、MVP 功能规划、竞争定位建议与商业可行性评估。

> **关于 API Key**：本工具需要用户自备 Anthropic API Key（或兼容 OpenAI 格式的第三方服务）。打开网站后，点击右上角「API 设置」填入即可。Key 仅存储在你的浏览器本地，不会上传至任何服务器。
>
> **关于数据隐私**：你生成的所有报告数据均缓存在浏览器本地（localStorage），不会上传或存储在任何云端服务器，请放心使用。

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![TailwindCSS][TailwindCSS]][Tailwind-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Node.js 18+
* npm

```sh
npm install npm@latest -g
```

* Anthropic API Key —— 在 [console.anthropic.com](https://console.anthropic.com) 免费申请
* Tavily API Key（可选，用于联网搜索）—— 在 [tavily.com](https://tavily.com) 申请

### Installation

1. 克隆仓库
   ```sh
   git clone https://github.com/janineziachen/industry-analysis.git
   ```
2. 安装依赖
   ```sh
   npm install
   ```
3. 复制环境变量示例文件
   ```sh
   cp .env.local.example .env.local
   ```
4. 在 `.env.local` 中填入你的 API Key
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   TAVILY_API_KEY=your_tavily_key_here
   ```
   > 也可跳过此步骤，在页面右上角「API 设置」中直接填写，Key 仅存储在浏览器本地。

5. 启动开发服务器
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

1. 在首页输入行业名称（如「AI 客服」、「新能源汽车」），点击「开始分析」
2. 等待 AI 生成完整行业报告（约 2-5 分钟）
3. 点击各模块卡片查看深度详情
4. 点击右下角「专家问答」针对报告内容提问
5. 点击「进入产品规划」生成产品策略方案
6. 通过「导出报告」保存为 Word / PDF / HTML 格式

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] 行业深度分析报告生成
- [x] 产品规划模块
- [x] 专家问答浮窗
- [x] 报告导出（Word / PDF / HTML / Markdown）
- [x] 本地缓存
- [ ] 多行业对比分析
- [ ] 自定义报告模板

See the [open issues](https://github.com/janineziachen/industry-analysis/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Project Link: [https://github.com/janineziachen/industry-analysis](https://github.com/janineziachen/industry-analysis)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



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
