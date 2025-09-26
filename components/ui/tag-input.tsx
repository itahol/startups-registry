'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

// Simple TagInput that allows tags with spaces when quoted or using Enter
// Usage: <TagInput value={tags} onChange={setTags} placeholder="add tag" />
export function TagInput({ value = [], onChange, placeholder = 'Add tag' }: {
  value?: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = React.useState('')

  const addTag = (tag: string) => {
    const normalized = tag.trim()
    if (!normalized) return
    if (value.includes(normalized)) return
    onChange([...value, normalized])
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
      setInput('')
    } else if (e.key === 'Backspace' && !input && value.length) {
      // remove last
      const last = value[value.length - 1]
      removeTag(last)
    }
  }

  const onBlur = () => {
    if (input.trim()) {
      addTag(input)
      setInput('')
    }
  }

  return (
    <div className="min-h-[40px] w-full rounded-md border border-gray-200 bg-transparent px-2 py-1">
      <div className="flex flex-wrap gap-2 items-center">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-sm">
            <span className="truncate max-w-[10rem]">{tag}</span>
            <button type="button" onClick={() => removeTag(tag)} className="text-xs text-muted-foreground">×</button>
          </span>
        ))}

        <input
          className={cn('flex-1 min-w-[8rem] bg-transparent outline-none py-1 text-sm')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={placeholder}
        />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">Press Enter or comma to add. Tags may contain spaces.</div>
    </div>
  )
}
