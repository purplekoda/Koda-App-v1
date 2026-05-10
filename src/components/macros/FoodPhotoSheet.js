'use client';

import { useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const Sheet = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl} 0 0;
  width: 100%;
  max-width: 480px;
  padding: ${({ theme }) => theme.spacing.xl};
  padding-bottom: calc(${({ theme }) => theme.spacing.xxl} + env(safe-area-inset-bottom, 0px));
`;

const Handle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.grayMid};
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Tip = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.infoLight};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const OptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  & + & {
    margin-top: ${({ theme }) => theme.spacing.md};
  }
`;

const OptionIcon = styled.span`
  font-size: 22px;
  width: 36px;
  text-align: center;
`;

const CancelButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  min-height: ${({ theme }) => theme.touchTarget};
`;

const HiddenInput = styled.input`
  display: none;
`;

export default function FoodPhotoSheet({ onImageSelected, onClose }) {
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      onImageSelected({
        base64,
        mimeType: file.type || 'image/jpeg',
        preview: reader.result,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <Handle />
        <Title>Add food or snack</Title>
        <Tip>
          For the most accurate results, take a clear photo of the nutrition label on the packaging.
          If there is no label, photograph the food itself and Gemini will estimate.
        </Tip>

        <OptionButton onClick={() => cameraRef.current?.click()}>
          <OptionIcon>&#x1F4F7;</OptionIcon>
          Take a photo
        </OptionButton>

        <OptionButton onClick={() => uploadRef.current?.click()}>
          <OptionIcon>&#x1F5BC;&#xFE0F;</OptionIcon>
          Upload from camera roll
        </OptionButton>

        <HiddenInput
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />
        <HiddenInput ref={uploadRef} type="file" accept="image/*" onChange={handleFileChange} />

        <CancelButton onClick={onClose}>Cancel</CancelButton>
      </Sheet>
    </Overlay>
  );
}
