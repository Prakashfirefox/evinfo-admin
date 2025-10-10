// src/admin/components/BlogSectionsShow.tsx
import React from 'react';
import { Box, Label, Text, Header } from '@adminjs/design-system';

const BlogSectionsShow = (props) => {
  const { property, record } = props;
  const sections = record.params[property.path] || [];

  return (
    <Box>
      <Label>{property.label} ({sections.length})</Label>
      {sections.length > 0 ? (
        <Box>
          {sections.map((section, index) => (
            <Box key={index} mb="xl" p="xl" style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <Header.H4>{section.heading || `Section ${index + 1}`}</Header.H4>
              <Text mt="md">{section.content}</Text>
              {section.images && section.images.length > 0 && (
                <Box mt="md">
                  <Label>Images:</Label>
                  <Box as="ul" mt="sm">
                    {section.images.map((image, imgIndex) => (
                      <Box as="li" key={imgIndex}>
                        <Text as="a" href={image} target="_blank" rel="noopener noreferrer">
                          {image}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      ) : (
        <Text>No sections added</Text>
      )}
    </Box>
  );
};

export default BlogSectionsShow;