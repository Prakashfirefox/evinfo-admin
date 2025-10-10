// src/admin/components/BlogSectionsList.tsx
import React from 'react';
import { Badge } from '@adminjs/design-system';

const BlogSectionsList = (props) => {
  const { property, record } = props;
  const sections = record.params[property.path] || [];

  return (
    <Badge>{sections.length} sections</Badge>
  );
};

export default BlogSectionsList;