'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cardsService } from '@/services/cards'

interface CreateCardModalProps {
  boardId: string
  columnId: string
  columnName: string
  onClose: () => void
}

const PRIORITIES = [
  { value: 'low', label: 'Low', dot: '#888780', text: '#5F5E5A' },
  { value: 'medium', label: 'Medium', dot: '#378ADD', text: '#185FA5' },
  { value: 'high', label: 'High', dot: '#BA7517', text: '#854F0B' },
  { value: 'critical', label: 'Critical', dot: '#E24B4A', text: '#A32D2D' },
]

export default function CreateCardModal({ boardId, columnId, columnName, onClose }: CreateCardModalProps) {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [tagsInput, setTagsInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      cardsService.create(boardId, columnId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        tags: tags.length > 0 ? tags : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      onClose()
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      const msg = err?.response?.data?.error?.message || 'Erro ao criar card.'
      setError(msg)
    },
  })

  function handleAddTag() {
    const t = tagsInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
    }
    setTagsInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  function handleSubmit() {
    if (!title.trim()) {
      setError('O título é obrigatório.')
      return
    }
    setError('')
    createMutation.mutate()
  }

  const selectedPriority = PRIORITIES.find(p => p.value === priority)!

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(28,28,27,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px',
        width: '100%', maxWidth: '520px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid #EBEBEA',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1C1C1B' }}>Novo card</div>
            <div style={{ fontSize: '12px', color: '#888780', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Adicionando em</span>
              <span style={{
                backgroundColor: '#EBEBEA', borderRadius: '4px',
                padding: '1px 7px', fontSize: '11px', fontWeight: '500', color: '#1C1C1B',
              }}>{columnName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', backgroundColor: '#F5F5F4',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontSize: '14px', color: '#5F5E5A', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Título */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: '#5F5E5A', marginBottom: '6px' }}>
              Título <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Ex: Implementar tela de dashboard"
              style={{
                width: '100%', padding: '10px 14px', fontSize: '13px',
                border: `1px solid ${error && !title.trim() ? '#E24B4A' : '#D3D1C7'}`,
                borderRadius: '8px', outline: 'none',
                color: '#1C1C1B', fontFamily: 'inherit', boxSizing: 'border-box',
                backgroundColor: error && !title.trim() ? '#FFFAFA' : '#FFFFFF',
              }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#5F5E5A', display: 'block', marginBottom: '6px' }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o que precisa ser feito..."
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '13px',
                border: '1px solid #D3D1C7', borderRadius: '8px', outline: 'none',
                resize: 'none', color: '#1C1C1B', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Prioridade */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#5F5E5A', display: 'block', marginBottom: '8px' }}>
              Prioridade
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value as typeof priority)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
                    cursor: 'pointer', border: '1px solid',
                    borderColor: priority === p.value ? p.dot : '#D3D1C7',
                    backgroundColor: priority === p.value ? '#F5F5F4' : '#FFFFFF',
                    color: p.text,
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: p.dot }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#5F5E5A', display: 'block', marginBottom: '6px' }}>
              Tags
            </label>
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                    fontWeight: '500', backgroundColor: '#E6F1FB', color: '#185FA5',
                  }}>
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#185FA5', padding: '0', fontSize: '10px', lineHeight: '1',
                      }}
                    >✕</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Digite e pressione Enter"
                style={{
                  flex: 1, padding: '8px 12px', fontSize: '13px',
                  border: '1px solid #D3D1C7', borderRadius: '8px', outline: 'none',
                  color: '#1C1C1B', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleAddTag}
                style={{
                  padding: '8px 12px', fontSize: '12px', fontWeight: '500',
                  backgroundColor: '#F5F5F4', border: '1px solid #D3D1C7',
                  borderRadius: '8px', cursor: 'pointer', color: '#5F5E5A',
                  whiteSpace: 'nowrap',
                }}
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#5F5E5A', display: 'block', marginBottom: '6px' }}>
              Data limite
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '13px',
                border: '1px solid #D3D1C7', borderRadius: '8px', outline: 'none',
                color: dueDate ? '#1C1C1B' : '#888780', fontFamily: 'inherit', boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          {/* Erro */}
          {error && (
            <div style={{
              padding: '10px 14px', backgroundColor: '#FCEBEB',
              border: '1px solid #F09595', borderRadius: '8px',
              fontSize: '13px', color: '#A32D2D',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #EBEBEA',
          display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', fontSize: '13px', color: '#5F5E5A',
              backgroundColor: '#FFFFFF', border: '1px solid #D3D1C7',
              borderRadius: '8px', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || createMutation.isPending}
            style={{
              padding: '10px 20px', fontSize: '13px', fontWeight: '500',
              backgroundColor: title.trim() ? '#1C1C1B' : '#D3D1C7',
              color: title.trim() ? '#FFFFFF' : '#888780',
              border: 'none', borderRadius: '8px',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {createMutation.isPending ? 'Criando...' : 'Criar card'}
          </button>
        </div>
      </div>
    </div>
  )
}