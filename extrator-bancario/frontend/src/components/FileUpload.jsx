import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';

export default function FileUpload({ onFileSelect }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f0f0f0' : '#fff',
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Solte o PDF aqui...</p>
      ) : (
        <div>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>
            📤 Arraste o extrato bancário (PDF) aqui
          </p>
          <p style={{ color: '#666' }}>ou clique para selecionar</p>
        </div>
      )}
    </div>
  );
}