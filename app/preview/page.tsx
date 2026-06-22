'use client';

import './preview.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadSettings } from '@/lib/chat-storage';

export default function PreviewHomePage() {
  const [industry, setIndustry] = useState('');
  const [hasKey, setHasKey] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const settings = loadSettings();
    setHasKey(!!settings?.anthropicApiKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (industry.trim()) {
      router.push(`/preview/analysis/${encodeURIComponent(industry.trim())}`);
    }
  };

  return (
    <main className="apple-page">
      {/* Nav */}
      <nav className="apple-nav">
        <div className="apple-nav-inner">
          <span className="apple-nav-logo">Industry Insight</span>
          <span className="apple-nav-badge">AI-Powered</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="apple-hero">
        <div className="apple-hero-inner">
          <p className="apple-hero-eyebrow">深度行业分析</p>
          <h1 className="apple-hero-title">
            洞察行业本质。
          </h1>
          <p className="apple-hero-subtitle">
            输入任意行业，AI 为你生成专业级结构化报告。
            <br />
            痛点、机会、对标企业，一目了然。
          </p>

          <form onSubmit={handleSubmit} className="apple-search-form">
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="输入行业名称，如：新能源汽车、医疗AI、跨境电商..."
              className="apple-search-input"
            />
            <button
              type="submit"
              disabled={!industry.trim()}
              className="apple-search-btn"
            >
              开始分析
            </button>
          </form>

          {!hasKey && (
            <p className="apple-hint">
              首次使用？点击右上角 <span className="apple-hint-accent">API 设置</span> 配置密钥
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="apple-features">
        <div className="apple-features-grid">
          <FeatureCard
            title="结构化洞察"
            desc="从痛点到机会，用数据说话的行业全景"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="apple-feature-icon">
                <path d="M3 13h4l3-8 4 16 3-8h4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <FeatureCard
            title="AI 专家问答"
            desc="多角色视角，基于报告内容的深度对话"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="apple-feature-icon">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <FeatureCard
            title="一键报告"
            desc="DOCX / PDF 导出，面试或汇报直接使用"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="apple-feature-icon">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="apple-footer">
        <p>Powered by Claude &middot; Built with Next.js</p>
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="apple-feature-card">
      <div className="apple-feature-icon-wrap">{icon}</div>
      <h3 className="apple-feature-title">{title}</h3>
      <p className="apple-feature-desc">{desc}</p>
    </div>
  );
}
