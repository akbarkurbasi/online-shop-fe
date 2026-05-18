import React, { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'
import type Quill from 'quill'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    if (containerRef.current && !quillRef.current) {
      const QuillModule = require('quill')
      const Quill = QuillModule.default || QuillModule
      
      if (typeof Quill !== 'function') {
        console.error('Quill is still not a constructor:', QuillModule)
        return
      }
      
      const quill = new Quill(containerRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Write your article content here...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        }
      })

      quillRef.current = quill as Quill

      // Set initial value
      if (value) {
        quill.root.innerHTML = value
      }

      // Listen for text changes
      quill.on('text-change', () => {
        if (!isUpdatingRef.current) {
          onChange(quill.root.innerHTML)
        }
      })
    }
  }, [onChange, placeholder])

  // Sync value from props to editor
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      isUpdatingRef.current = true
      quillRef.current.root.innerHTML = value || ''
      isUpdatingRef.current = false
    }
  }, [value])

  return (
    <div className="bg-background">
      <div 
        ref={containerRef} 
        className="min-h-[300px] text-base font-sans [&_.ql-editor]:min-h-[300px] [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:border-input [&_.ql-container]:border-input"
      />
    </div>
  )
}
