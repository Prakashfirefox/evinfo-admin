import React, { useState, useEffect } from 'react'
import { Box, Text } from '@adminjs/design-system'
import { BasePropertyProps } from 'adminjs'

const MAX_LENGTH = 1000
const FORBIDDEN_WORDS = ['spam', 'fake', 'banned']

const CustomTextEditor: React.FC<BasePropertyProps> = ({ property, record, onChange }) => {
  const [error, setError] = useState<string | null>(null)
  const [ReactQuill, setReactQuill] = useState<any>(null)

  useEffect(() => {
    // Load Quill CSS
    const link = document.createElement('link')
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    // Load ReactQuill dynamically
    const loadQuill = async () => {
      const { default: RQ } = await import('react-quill')
      setReactQuill(() => RQ)
    }
    
    loadQuill()

    return () => {
      // Cleanup: remove the stylesheet when component unmounts
      document.head.removeChild(link)
    }
  }, [])

  const handleChange = (value: string) => {
    if (value.length > MAX_LENGTH) {
      setError(`Content cannot exceed ${MAX_LENGTH} characters.`)
    } else if (FORBIDDEN_WORDS.some(word => value.toLowerCase().includes(word))) {
      setError(`Your text contains forbidden words.`)
    } else {
      setError(null)
    }

    onChange(property.name, value)
  }

  if (!ReactQuill) {
    return <div>Loading editor...</div>
  }

  return (
    <Box>
      <ReactQuill
        value={record.params[property.name] || ''}
        onChange={handleChange}
        theme="snow"
        placeholder="Write content..."
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
        }}
      />
      {error && <Text color="danger">{error}</Text>}
    </Box>
  )
}

export default CustomTextEditor