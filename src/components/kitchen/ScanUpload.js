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

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.coral};
  font-size: 14px;
  margin-top: ${({ theme }) => theme.spacing.md};
  text-align: center;
`

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const PreviewWrap = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  aspect-ratio: 1;
`

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const RemoveBtn = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`

const AddMoreZone = styled.div`
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  aspect-ratio: 1;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  gap: 4px;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ScanButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 16px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
`

const PhotoCount = styled.div`
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const MAX_PHOTOS = 4
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

export default function ScanUpload({ onScanComplete }) {
  const [dragOver, setDragOver] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [photos, setPhotos] = useState([]) // { file, previewUrl }
  const inputRef = useRef(null)
  const addMoreRef = useRef(null)

  function validateFile(file) {
    if (!file) return 'No file selected'
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG and PNG images are allowed'
    if (file.size > MAX_FILE_SIZE) return 'File must be under 10MB'
    return null
  }

  function addFiles(files) {
    setError(null)
    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }

    const toAdd = Array.from(files).slice(0, remaining)
    const valid = []
    for (const file of toAdd) {
      const err = validateFile(file)
      if (err) {
        setError(err)
        return
      }
      valid.push({ file, previewUrl: URL.createObjectURL(file) })
    }

    setPhotos(prev => [...prev, ...valid])
  }

  function removePhoto(index) {
    setPhotos(prev => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1024
        const QUALITY = 0.7
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
        URL.revokeObjectURL(img.src)
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
      }
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleScan() {
    if (photos.length === 0) return
    setScanning(true)

    try {
      const results = await Promise.all(
        photos.map(photo => compressImage(photo.file))
      )
      if (onScanComplete) onScanComplete(results)
    } catch {
      setError('Could not process images. Please try again.')
      setScanning(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  function handleChange(e) {
    if (e.target.files.length) addFiles(e.target.files)
    e.target.value = ''
  }

  if (scanning) {
    return (
      <Card>
        <ScanningOverlay>
          <Spinner />
          <ScanningText>Koda is scanning your photos...</ScanningText>
          <ScanningSubtext>Detecting items and checking freshness</ScanningSubtext>
        </ScanningOverlay>
      </Card>
    )
  }

  // No photos yet — show the initial drop zone
  if (photos.length === 0) {
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
          <DropTitle>Take photos or upload images</DropTitle>
          <DropDesc>Up to {MAX_PHOTOS} photos, JPG or PNG, max 10MB each</DropDesc>
          <HiddenInput
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={handleChange}
          />
        </DropZone>
        {error && <ErrorText>{error}</ErrorText>}
      </Card>
    )
  }

  // Photos selected — show previews + scan button
  return (
    <Card>
      <PreviewGrid>
        {photos.map((photo, i) => (
          <PreviewWrap key={i}>
            <PreviewImg src={photo.previewUrl} alt={`Photo ${i + 1}`} />
            <RemoveBtn onClick={() => removePhoto(i)} aria-label="Remove photo">
              {'\u2715'}
            </RemoveBtn>
          </PreviewWrap>
        ))}
        {photos.length < MAX_PHOTOS && (
          <AddMoreZone onClick={() => addMoreRef.current?.click()}>
            <span style={{ fontSize: 24 }}>+</span>
            Add more
            <HiddenInput
              ref={addMoreRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleChange}
            />
          </AddMoreZone>
        )}
      </PreviewGrid>

      <PhotoCount>{photos.length} of {MAX_PHOTOS} photos</PhotoCount>

      <ScanButton onClick={handleScan}>
        Scan {photos.length === 1 ? 'photo' : `${photos.length} photos`}
      </ScanButton>

      {error && <ErrorText>{error}</ErrorText>}
    </Card>
  )
}
