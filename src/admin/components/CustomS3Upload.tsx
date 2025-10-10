import React, { useState } from 'react';
import { Box, Button, Text } from '@adminjs/design-system';
import axios from 'axios';

const CustomS3Upload = (props) => {
  const { onChange, property, record } = props;
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    // Call your backend endpoint that uploads to S3 and returns the URL
    const { data } = await axios.post('/admin/upload-to-s3', formData);

    onChange(property.name, data.url);
    setUploading(false);
  };

  return (
    <Box>
      <input type="file" onChange={handleUpload} />
      {uploading && <Text>Uploading...</Text>}
      {record.params[property.name] && (
        <a href={record.params[property.name]} target="_blank" rel="noopener noreferrer">
          View uploaded file
        </a>
      )}
    </Box>
  );
};

export default CustomS3Upload;
