import React from 'react'
import { Box, Label, Button, Input, TextArea, FormGroup, Icon } from '@adminjs/design-system'

const BlogSectionsEdit = (props: any) => {
  const { property, record, onChange } = props
  console.log('BlogSectionsEdit props:', props)

  if (!record) return <div>Loading...</div>
  // Try to safely parse sections (AdminJS stores mixed types as string sometimes)
  let sections = [];

  try {
    const raw = record.params[property.path];

    // Case 1: If "sections" is stored as a JSON string
    if (typeof raw === 'string') {
      try {
        sections = JSON.parse(raw || '[]');
      } catch {
        sections = [];
      }
    }
    // Case 2: If AdminJS flattened the object (sections.0.heading, etc.)
    else if (!raw && record?.params) {
      const sectionKeys = Object.keys(record.params).filter((key) =>
        key.startsWith('sections.')
      );

      if (sectionKeys.length > 0) {
        const builtSections: any[] = [];

        sectionKeys.forEach((key) => {
          const match = key.match(/^sections\.(\d+)\.(.+)$/);
          if (match) {
            const index = parseInt(match[1], 10);
            const field = match[2];
            builtSections[index] = builtSections[index] || {};
            builtSections[index][field] = record.params[key];
          }
        });

        sections = builtSections.filter(Boolean);
      }
    }
    // Case 3: Already an array
    else if (Array.isArray(raw)) {
      sections = raw;
    }
  } catch (err) {
    console.warn('❌ Failed to process sections field:', err);
    sections = [];
  }


  const handleAddSection = () => {
    const newSections = [
      ...sections,
      { heading: '', content: '', images: '', order: sections.length },
    ]
    onChange(property.path, JSON.stringify(newSections))
  }

  const handleRemoveSection = (index: number) => {
    const newSections = sections.filter((_: any, i: number) => i !== index)
    const updatedSections = newSections.map((s: any, i: number) => ({ ...s, order: i }))
    onChange(property.path, JSON.stringify(updatedSections))
  }

  const handleSectionChange = (index: number, field: string, value: any) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], [field]: value }
    console.log('Updated section:', newSections[index])
    console.log('All sections after update:', newSections)
    console.log('Serialized sections:', JSON.stringify(newSections))
    onChange(property.path, JSON.stringify(newSections))
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    )
      return

    const newSections = [...sections]
    const newIndex = direction === 'up' ? index - 1 : index + 1
      ;[newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]

    const updatedSections = newSections.map((s: any, i: number) => ({ ...s, order: i }))
    onChange(property.path, JSON.stringify(updatedSections))
  }

  return (
    <FormGroup>
      <Label>{property.label} ({sections.length})</Label>
      <Box>
        {sections.map((section: any, index: number) => (
          <Box
            key={index}
            mb="lg"
            p="xl"
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }}
          >
            <Box
              flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              mb="md"
            >
              <Label>Section {index + 1}</Label>
              <Box flex flexDirection="row" gap="sm">
                <Button
                  type="button"
                  size="sm"
                  variant="light"
                  onClick={() => handleMoveSection(index, 'up')}
                  disabled={index === 0}
                >
                  <Icon icon="ChevronUp" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="light"
                  onClick={() => handleMoveSection(index, 'down')}
                  disabled={index === sections.length - 1}
                >
                  <Icon icon="ChevronDown" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => handleRemoveSection(index)}
                >
                  Remove
                </Button>
              </Box>
            </Box>

            <Box mb="md">
              <Label>Heading</Label>
              <Input
                value={section.heading || ''}
                onChange={(e) =>
                  handleSectionChange(index, 'heading', e.target.value)
                }
                placeholder="Enter section heading"
              />
            </Box>

            <Box mb="md">
              <Label>Content</Label>
              <TextArea
                rows={6}
                value={section.content || ''}
                onChange={(e) =>
                  handleSectionChange(index, 'content', e.target.value)
                }
                placeholder="Enter section content"
              />
            </Box>

            <Box>
              <Label>Images (comma-separated URLs)</Label>
              <Input
                value={section.images || ''}
                onChange={(e) =>
                  handleSectionChange(
                    index,
                    'images',
                    e.target.value
                  )
                }
                placeholder="Enter image URLs separated by commas"
              />
            </Box>
          </Box>
        ))}

        <Button type="button" onClick={handleAddSection} variant="primary">
          + Add Section
        </Button>
      </Box>
    </FormGroup>
  )
}

export default BlogSectionsEdit
