'use client'

import { useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const DropZone = styled.div`
  border: 2px dashed ${({ $dragOver, theme }) =>
    $dragOver ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xxxl};
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $dragOver, theme }) =>
    $dragOver ? theme.colors.tealLight : 'transparent'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

const DropIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const DropTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const DropDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const HiddenInput = styled.input`
  display: none;
`

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const ScanningOverlay = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl};
`

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid ${({ theme }) => theme.colors.borderLight};
  border-top-color: ${({ theme }) => theme.colors.teal};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`

const ScanningText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ScanningSubtext = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const PreviewImage = styled.div`
  width: 100%;
  height: 200px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.grayLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  overflow: hidden;
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.coral};
  font-size: 14px;
  margin-top: ${({ theme }) => theme.spacing.md};
  text-align: center;
`

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

export default function ScanUpload({ onScanComplete }) {
  const [dragOver, setDragOver] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const inputRef = useRef(null)

  function validateFile(file) {
    if (!file) return 'No file selected'
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG and PNG images are allowed'
    if (file.size > MAX_FILE_SIZE) return 'File must be under 10MB'
    return null
  }

  function handleFile(file) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setPreview(URL.createObjectURL(file))
    setScanning(true)

    // Simulate AI scanning
    setTimeout(() => {
      setScanning(false)
      if (onScanComplete) onScanComplete()
    }, 2500)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e) {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  if (scanning) {
    return (
      <Card>
        {preview && <PreviewImage>{'\uD83D\uDCF7'}</PreviewImage>}
        <ScanningOverlay>
          <Spinner />
          <ScanningText>Koda is scanning your fridge...</ScanningText>
          <ScanningSubtext>Detecting items and checking freshness</ScanningSubtext>
        </ScanningOverlay>
      </Card>
    )
  }

  return (
    <Card>
      <DropZone
        $dragOver={dragOver}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <DropIcon>{'\uD83D\uDCF8'}</DropIcon>
        <DropTitle>Take a photo or upload an image</DropTitle>
        <DropDesc>JPG or PNG, max 10MB</DropDesc>
        <HiddenInput
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleChange}
        />
      </DropZone>
      {error && <ErrorText>{error}</ErrorText>}
    </Card>
  )
}
