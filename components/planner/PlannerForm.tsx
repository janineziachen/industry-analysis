'use client';

import { useState } from 'react';
import { Link2, Link2Off } from 'lucide-react';
import type { ProjectInfo } from '@/lib/planner-types';

interface PlannerFormProps {
  fromIndustry?: string;
  onSubmit: (info: ProjectInfo) => void;
}

const DEPTH_OPTIONS = [
  { value: 'quick', label: '快速分析', desc: '核心模块，2-3分钟' },
  { value: 'detailed', label: '深度分析', desc: '全量模块，5-8分钟' },
] as const;

export default function PlannerForm({ fromIndustry = '', onSubmit }: PlannerFormProps) {
  const [info, setInfo] = useState<ProjectInfo>({
    description: '',
    targetUser: '',
    coreCapability: '',
    constraints: '',
    competitivePreference: '',
    depth: 'detailed',
    linkedIndustry: fromIndustry,
  });

  const set = (field: keyof ProjectInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = info.description.trim().length > 0;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(info); }}
      className="pf-form"
    >
      <div className="pf-section">
        <div className="pf-section-title">基本信息</div>

        <div className="pf-field">
          <label className="pf-label">
            产品描述 <span style={{ color: 'var(--color-accent)' }}>*</span>
          </label>
          <textarea
            value={info.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="用一两句话描述你想做的产品或服务——解决什么问题、为谁解决"
            className="pf-textarea"
            rows={3}
          />
        </div>

        <div className="pf-field">
          <label className="pf-label">目标用户</label>
          <input
            type="text"
            value={info.targetUser}
            onChange={(e) => set('targetUser', e.target.value)}
            placeholder="谁会使用？他们现在怎么解决这个问题？"
            className="pf-input"
          />
        </div>

        <div className="pf-field">
          <label className="pf-label">核心能力 / 资源</label>
          <input
            type="text"
            value={info.coreCapability}
            onChange={(e) => set('coreCapability', e.target.value)}
            placeholder="技术团队、行业人脉、资金、独有数据…"
            className="pf-input"
          />
        </div>
      </div>

      <div className="pf-section">
        <div className="pf-section-title">约束与偏好</div>

        <div className="pf-field">
          <label className="pf-label">约束条件<span className="pf-hint">可选</span></label>
          <input
            type="text"
            value={info.constraints}
            onChange={(e) => set('constraints', e.target.value)}
            placeholder="预算、时间、技术栈等限制"
            className="pf-input"
          />
        </div>

        <div className="pf-field">
          <label className="pf-label">竞争偏好<span className="pf-hint">可选</span></label>
          <input
            type="text"
            value={info.competitivePreference}
            onChange={(e) => set('competitivePreference', e.target.value)}
            placeholder="想对标或避开的竞品方向"
            className="pf-input"
          />
        </div>

        <div className="pf-field">
          <label className="pf-label">分析深度</label>
          <div className="pf-chips">
            {DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('depth', opt.value)}
                className={`pf-chip ${info.depth === opt.value ? 'selected' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {fromIndustry && (
        <div className="pf-section">
          <div className="pf-section-title">关联行业报告</div>
          <div className="pf-field">
            <div className="pf-link-toggle">
              <button
                type="button"
                onClick={() => set('linkedIndustry', info.linkedIndustry ? '' : fromIndustry)}
                className={`pf-toggle-btn ${info.linkedIndustry ? 'active' : ''}`}
              >
                {info.linkedIndustry ? <Link2 size={13} /> : <Link2Off size={13} />}
                {info.linkedIndustry ? `已关联「${fromIndustry}」行业报告` : `不关联行业报告`}
              </button>
              <span className="pf-hint">{info.linkedIndustry ? '规划将引用该行业的市场数据、痛点与机会' : '点击关联以引用行业分析数据'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="pf-actions">
        <button
          type="submit"
          disabled={!canSubmit}
          className="pf-btn pf-btn-primary"
        >
          生成产品规划方案
        </button>
      </div>
    </form>
  );
}
