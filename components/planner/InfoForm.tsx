'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectInfo } from '@/lib/planner-types';

interface InfoFormProps {
  initialInfo: ProjectInfo;
  industries: string[];
  onConfirm: (info: ProjectInfo) => void;
  onBack: () => void;
}

export default function InfoForm({ initialInfo, industries, onConfirm, onBack }: InfoFormProps) {
  const [info, setInfo] = useState<ProjectInfo>(initialInfo);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof ProjectInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    background: 'var(--color-panel)',
    color: 'var(--color-ink-strong)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.375rem',
    fontSize: '0.8125rem',
    color: 'var(--color-ink)',
    fontWeight: 500,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '1rem',
  };

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid var(--color-border)',
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--color-ink-strong)',
          marginBottom: '1.25rem',
        }}
      >
        确认项目信息
      </h2>

      {/* Core fields */}
      <div style={fieldStyle}>
        <label style={labelStyle}>产品描述</label>
        <input
          type="text"
          value={info.description ?? ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="简要描述你的产品想法"
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>目标用户</label>
        <input
          type="text"
          value={info.targetUser ?? ''}
          onChange={(e) => handleChange('targetUser', e.target.value)}
          placeholder="谁会使用这个产品？"
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>核心能力</label>
        <input
          type="text"
          value={info.coreCapability ?? ''}
          onChange={(e) => handleChange('coreCapability', e.target.value)}
          placeholder="产品最核心的功能或优势"
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>约束条件</label>
        <input
          type="text"
          value={info.constraints ?? ''}
          onChange={(e) => handleChange('constraints', e.target.value)}
          placeholder="时间、资源、技术等限制"
          style={inputStyle}
        />
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-muted)',
          fontSize: '0.8125rem',
          padding: '0.25rem 0',
          marginBottom: showAdvanced ? '1rem' : '1.5rem',
        }}
      >
        {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        高级选项
      </button>

      {/* Advanced fields */}
      {showAdvanced && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>竞争偏好</label>
            <input
              type="text"
              value={info.competitivePreference ?? ''}
              onChange={(e) => handleChange('competitivePreference', e.target.value)}
              placeholder="希望对标或差异化的竞品方向"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>关联行业</label>
            <select
              value={info.linkedIndustry ?? '不关联'}
              onChange={(e) => handleChange('linkedIndustry', e.target.value)}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="不关联">不关联</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>分析深度</label>
            <select
              value={info.depth ?? 'detailed'}
              onChange={(e) => handleChange('depth', e.target.value as 'quick' | 'detailed')}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="quick">快速分析</option>
              <option value="detailed">深度分析</option>
            </select>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1.125rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-ink)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          返回修改
        </button>

        <button
          onClick={() => onConfirm(info)}
          disabled={!info.description?.trim()}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--color-accent)',
            background: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
            color: 'var(--color-accent)',
            fontSize: '0.875rem',
            cursor: !info.description?.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: !info.description?.trim() ? 0.5 : 1,
          }}
        >
          生成产品规划方案
        </button>
      </div>
    </div>
  );
}
