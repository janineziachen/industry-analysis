import type { Metadata } from 'next';
import './globals.css';
import { GlobalHeader } from '@/components/GlobalHeader';

export const metadata: Metadata = {
  title: '行业洞察 · 产品规划',
  description: '从行业深度分析到产品策略规划的完整工作流',
};

const ANTI_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <GlobalHeader />
        {children}
      </body>
    </html>
  );
}
