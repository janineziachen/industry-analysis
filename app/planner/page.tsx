'use client';

import './planner.css';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PlannerForm from '@/components/planner/PlannerForm';
import PlanResult from '@/components/planner/PlanResult';
import type { ProjectInfo } from '@/lib/planner-types';
import type { IndustryAnalysis } from '@/lib/analysis-schema';

type Phase = 'input' | 'result';

const PLANNER_CACHE_KEY = 'planner_last_session';

function loadIndustryData(name: string): IndustryAnalysis | null {
  try {
    const raw = localStorage.getItem('industry_cache_' + name);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function PlannerContent() {
  const searchParams = useSearchParams();
  const fromIndustry = searchParams.get('from') ?? '';

  const [phase, setPhase] = useState<Phase>('input');
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [industryData, setIndustryData] = useState<IndustryAnalysis | null>(null);

  const handleSubmit = (info: ProjectInfo) => {
    setProjectInfo(info);
    if (info.linkedIndustry) {
      setIndustryData(loadIndustryData(info.linkedIndustry));
    } else {
      setIndustryData(null);
    }
    try {
      localStorage.setItem(PLANNER_CACHE_KEY, JSON.stringify({ projectInfo: info }));
    } catch {}
    setPhase('result');
  };

  return (
    <>
      {phase === 'input' && (
        <PlannerForm fromIndustry={fromIndustry} onSubmit={handleSubmit} />
      )}
      {phase === 'result' && projectInfo && (
        <PlanResult
          projectInfo={projectInfo}
          industryData={industryData}
          onBack={() => setPhase('input')}
        />
      )}
    </>
  );
}

export default function PlannerPage() {
  return (
    <div className="planner-page">
      <div className="planner-container">
        <div className="planner-header">
          <h1>产品规划</h1>
          <p className="planner-header-desc">
            填写产品信息，生成包含需求分析、产品方案、竞争定位和商业评估的完整规划
          </p>
        </div>
        <Suspense fallback={null}>
          <PlannerContent />
        </Suspense>
      </div>
    </div>
  );
}
