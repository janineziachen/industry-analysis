'use client'

import { useState, useRef } from 'react'
import { Send, SkipForward } from 'lucide-react'
import { ProjectInfo } from '@/lib/planner-types'

interface Question {
  key: keyof ProjectInfo
  question: string
  options: string[]
}

function buildQuestions(industries: string[]): Question[] {
  return [
    {
      key: 'description',
      question: industries.length > 0
        ? `你想基于哪个行业做产品？或者直接描述你的想法。`
        : '你想做什么产品或服务？用一句话描述。',
      options: [],
    },
    {
      key: 'targetUser',
      question: '目标用户是谁？他们现在怎么解决这个问题？',
      options: ['中小企业主', '开发者/技术团队', 'C端消费者'],
    },
    {
      key: 'coreCapability',
      question: '你/团队的核心能力或资源是什么？',
      options: ['有技术团队', '有行业人脉和渠道', '有资金但无技术'],
    },
    {
      key: 'constraints',
      question: '预算和时间约束？',
      options: ['3个月内上线 MVP，预算10万以内', '半年时间，预算充足', '时间不急，先验证方向'],
    },
    {
      key: 'competitivePreference',
      question: '有没有明确想避开的方向或对标的竞品？',
      options: ['不想做 ToC', '避开巨头已有功能', '没有特别限制'],
    },
  ]
}

interface Message {
  role: 'assistant' | 'user'
  text: string
}

type Props = {
  onComplete: (info: ProjectInfo) => void
  industries?: string[]
}

export default function ChatCollector({ onComplete, industries = [] }: Props) {
  const questions = buildQuestions(industries)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: questions[0].question },
  ])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Partial<ProjectInfo>>({})
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  function buildProjectInfo(partial: Partial<ProjectInfo>): ProjectInfo {
    return {
      description: partial.description ?? '',
      targetUser: partial.targetUser ?? '',
      coreCapability: partial.coreCapability ?? '',
      constraints: partial.constraints ?? '',
      competitivePreference: partial.competitivePreference ?? '',
      depth: 'detailed',
      linkedIndustry: '',
    }
  }

  function advance(answer: string) {
    const key = currentQuestion.key
    const updatedAnswers = { ...answers, [key]: answer }
    setAnswers(updatedAnswers)

    const userMsg: Message = { role: 'user', text: answer }

    if (isLastQuestion) {
      setMessages((prev) => [...prev, userMsg])
      onComplete(buildProjectInfo(updatedAnswers))
      return
    }

    const nextIndex = currentIndex + 1
    const nextQuestion = questions[nextIndex]
    const assistantMsg: Message = { role: 'assistant', text: nextQuestion.question }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setCurrentIndex(nextIndex)
    setInputValue('')
    inputRef.current?.focus()
  }

  function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    advance(trimmed)
  }

  function handleOptionClick(option: string) {
    advance(option)
  }

  function handleSkip() {
    onComplete(buildProjectInfo(answers))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  // Determine if we should show quick-reply options (only for the last assistant message)
  const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant')
  const showOptions = lastAssistantIndex === 0 // last message is from assistant

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: 'var(--color-ink)',
      }}
    >
      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((msg, i) => {
          const isAssistant = msg.role === 'assistant'
          const isLatestAssistant =
            isAssistant &&
            i === messages.length - 1 - [...messages].reverse().findIndex((m) => m.role === 'assistant')

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: isAssistant ? 'flex-start' : 'flex-end',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    background: isAssistant
                      ? 'var(--color-panel)'
                      : 'rgba(var(--color-accent-rgb, 99, 102, 241), 0.15)',
                    color: 'var(--color-ink-strong)',
                    border: isAssistant ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {msg.text}
                </div>
              </div>

              {/* Quick reply pills — only after the latest assistant message */}
              {isAssistant && isLatestAssistant && showOptions && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingLeft: '4px',
                  }}
                >
                  {currentQuestion.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleOptionClick(opt)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-ink)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          'var(--color-panel)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                          'var(--color-accent)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          'var(--color-surface)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                          'var(--color-border)'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Input bar */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
        }}
      >
        {/* Skip button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSkip}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-ink)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-ink)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
            }}
          >
            <SkipForward size={13} />
            跳过，直接生成
          </button>
        </div>

        {/* Text input row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的回答…"
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-ink)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: inputValue.trim() ? 'var(--color-accent)' : 'var(--color-border)',
              color: inputValue.trim() ? '#fff' : 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
