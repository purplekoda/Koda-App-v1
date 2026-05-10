'use client';

import { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import StepShell from '../shared/StepShell';
import FaithPracticeToggle from '@/components/faith/FaithPracticeToggle';
import FaithPracticeCards from '@/components/faith/FaithPracticeCards';
import {
  PICKY_EATER_ISSUES,
  MEMBER_ALLERGY_OPTIONS,
  MEMBER_DIET_OPTIONS,
} from '@/data/onboarding-options';

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MemberCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`;

const MemberHeader = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.tealLight}40;
  color: ${({ theme }) => theme.colors.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
`;

const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const MemberMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 11px;
  font-weight: 600;
  background: ${({ $color }) => $color || '#e5e5e5'};
  color: ${({ $textColor }) => $textColor || '#333'};
`;

const ExpandIcon = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textTertiary};
  transition: transform 0.2s;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`;

const ExpandedContent = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2px;
`;

const SectionHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.button`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.border)};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.tealLight + '30' : 'transparent')};
  color: ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.textPrimary)};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
`;

const PickyToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $active }) => ($active ? '#D97706' : '#e5e5e5')};
  background: ${({ $active }) => ($active ? '#FEF3C7' : 'transparent')};
  cursor: pointer;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? '#92400E' : '#666')};
`;

const ToggleTrack = styled.span`
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: ${({ $on }) => ($on ? '#D97706' : '#D1D5DB')};
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
`;

const ToggleKnob = styled.span`
  position: absolute;
  top: 2px;
  left: ${({ $on }) => ($on ? '20px' : '2px')};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
`;

const PickyPanel = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid #FCD34D;
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FFFBEB;
`;

const AINote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  line-height: 1.4;
  font-style: italic;
`;

const MacrosToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $active }) => ($active ? '#D97706' : '#e5e5e5')};
  background: ${({ $active }) => ($active ? '#FEF3C7' : 'transparent')};
  cursor: pointer;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? '#92400E' : '#666')};
`;

const MacrosPanel = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid #FCD34D;
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FFFBEB;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MacroInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const MacroLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 70px;
`;

const MacroInput = styled.input`
  width: 80px;
  height: 34px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  text-align: center;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.teal}; }
`;

const MacroUnit = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const InfoBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.tealLight}15;
  border: 1px solid ${({ theme }) => theme.colors.tealLight}40;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`;

const AddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Input = styled.input`
  flex: 1;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.teal}; }
`;

const SmallInput = styled(Input)`
  width: 60px;
  flex: none;
  text-align: center;
`;

const AddBtn = styled.button`
  height: 36px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.4; }
`;

const CustomTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const CustomTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: #FEF3C7;
  font-size: 12px;
  color: #92400E;
`;

const RemoveTag = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  color: #92400E;
  cursor: pointer;
  line-height: 1;
`;

const ProfileFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const RemoveLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: #DC2626;
  cursor: pointer;
`;

const SaveBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const FaithDivider = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textTertiary};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const HouseholdBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight}30;
  color: ${({ theme }) => theme.colors.teal};
  margin-left: ${({ theme }) => theme.spacing.sm};
  text-transform: none;
  letter-spacing: normal;
`;

const FaithSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: ${({ theme }) => theme.spacing.lg};
`;

const FaithSectionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const FaithHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
  line-height: 1.4;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const activeGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(29, 158, 117, 0.3); }
  50% { box-shadow: 0 0 0 4px rgba(29, 158, 117, 0); }
`;

const ActiveMemberCard = styled(MemberCard)`
  ${({ $active }) =>
    $active &&
    css`
    border-color: ${({ theme }) => theme.colors.teal};
    animation: ${activeGlow} 2s ease-in-out infinite;
  `}
`;

const AgeGroupRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const AgeGroupBtn = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1.5px solid ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.border)};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.tealLight + '30' : 'transparent')};
  color: ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.textSecondary)};
  font-size: 13px;
  font-weight: ${({ $selected }) => ($selected ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s;
`;

const CustomRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export default function HouseholdMembersStep({
  members,
  onChange,
  onNext,
  onBack,
  onSkip,
  isPending,
  embedded = false,
  userName,
  faithPractices,
  onChangeFaith,
  displayMode = false,
  activeMemberIdx = null,
}) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');
  const [customDiet, setCustomDiet] = useState('');

  // Auto-populate the logged-in user as the first member if list is empty
  if (!displayMode && members.length === 0 && userName) {
    // Use onChange in a microtask to avoid setting state during render
    Promise.resolve().then(() => {
      onChange([
        {
          name: userName,
          age: null,
          age_group: 'adult',
          is_picky_eater: false,
          picky_issues: [],
          allergies: [],
          dietary_restrictions: [],
          track_macros: false,
          macro_calories: null,
          macro_protein_g: null,
          macro_carbs_g: null,
          macro_fat_g: null,
          is_owner: true,
        },
      ]);
      setExpandedIdx(0);
    });
  }

  const updateMember = (idx, updates) => {
    const next = members.map((m, i) => (i === idx ? { ...m, ...updates } : m));
    onChange(next);
  };

  const toggleArrayItem = (idx, field, item) => {
    const arr = members[idx][field] || [];
    const next = arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
    updateMember(idx, { [field]: next });
  };

  const addMember = () => {
    if (!newName.trim()) return;
    const newIdx = members.length;
    const parsedAge = newAge ? parseInt(newAge, 10) : null;
    onChange([
      ...members,
      {
        name: newName.trim(),
        age: parsedAge,
        age_group: parsedAge !== null && parsedAge <= 17 ? 'child' : 'adult',
        is_picky_eater: false,
        picky_issues: [],
        allergies: [],
        dietary_restrictions: [],
        track_macros: false,
        macro_calories: null,
        macro_protein_g: null,
        macro_carbs_g: null,
        macro_fat_g: null,
      },
    ]);
    setNewName('');
    setNewAge('');
    setExpandedIdx(newIdx);
  };

  const removeMember = (idx) => {
    // Don't allow removing the owner (first member)
    if (members[idx]?.is_owner) return;
    onChange(members.filter((_, i) => i !== idx));
  };

  const addCustomNote = (idx) => {
    if (!customNote.trim()) return;
    const issues = members[idx].picky_issues || [];
    updateMember(idx, { picky_issues: [...issues, customNote.trim()] });
    setCustomNote('');
  };

  const addCustomAllergy = (idx) => {
    if (!customAllergy.trim()) return;
    const allergies = members[idx].allergies || [];
    if (!allergies.includes(customAllergy.trim())) {
      updateMember(idx, { allergies: [...allergies, customAllergy.trim()] });
    }
    setCustomAllergy('');
  };

  const addCustomDiet = (idx) => {
    if (!customDiet.trim()) return;
    const diets = members[idx].dietary_restrictions || [];
    if (!diets.includes(customDiet.trim())) {
      updateMember(idx, { dietary_restrictions: [...diets, customDiet.trim()] });
    }
    setCustomDiet('');
  };

  const content = (
    <MemberList>
      {members.map((member, idx) => {
        const isOpen = !displayMode && expandedIdx === idx;
        const isActive = displayMode && activeMemberIdx === idx;
        const CardComponent = displayMode ? ActiveMemberCard : MemberCard;
        return (
          <CardComponent key={idx} $active={isActive}>
            <MemberHeader
              type="button"
              onClick={displayMode ? undefined : () => setExpandedIdx(isOpen ? null : idx)}
              style={displayMode ? { cursor: 'default' } : undefined}
            >
              <Avatar>{(member.name || '?')[0].toUpperCase()}</Avatar>
              <MemberInfo>
                <MemberName>
                  {member.name || 'Unnamed'}
                  {member.is_owner && (
                    <Badge $color="#E0F2FE" $textColor="#0369A1" style={{ marginLeft: 6 }}>
                      You
                    </Badge>
                  )}
                </MemberName>
                <MemberMeta>
                  <Badge
                    $color={member.age_group === 'child' ? '#EDE9FE' : '#F0FDF4'}
                    $textColor={member.age_group === 'child' ? '#6D28D9' : '#15803D'}
                  >
                    {member.age_group === 'child' ? 'Child' : 'Adult'}
                  </Badge>
                  {member.age != null && <span>Age {member.age}</span>}
                  {(member.allergies || []).map((a) => (
                    <Badge key={a} $color="#FEE2E2" $textColor="#991B1B">
                      {a}
                    </Badge>
                  ))}
                  {(member.dietary_restrictions || []).map((d) => (
                    <Badge key={d} $color="#E0F2FE" $textColor="#0369A1">
                      {d}
                    </Badge>
                  ))}
                  {member.is_picky_eater && (
                    <Badge $color="#FEF3C7" $textColor="#92400E">
                      Picky eater
                    </Badge>
                  )}
                  {member.track_macros && (
                    <Badge $color="#D1FAE5" $textColor="#065F46">
                      Macros
                    </Badge>
                  )}
                </MemberMeta>
              </MemberInfo>
              {!displayMode && <ExpandIcon $open={isOpen}>&#9662;</ExpandIcon>}
            </MemberHeader>

            {isOpen && (
              <ExpandedContent>
                <div>
                  <SectionLabel>Age</SectionLabel>
                  <SmallInput
                    type="number"
                    placeholder="Age"
                    value={member.age ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const age = val === '' ? null : parseInt(val, 10);
                      const updates = { age };
                      if (age !== null) {
                        updates.age_group = age <= 17 ? 'child' : 'adult';
                      }
                      updateMember(idx, updates);
                    }}
                    min={0}
                    max={120}
                  />
                </div>

                <div>
                  <SectionLabel>Adult or child?</SectionLabel>
                  <AgeGroupRow>
                    <AgeGroupBtn
                      type="button"
                      $selected={member.age_group !== 'child'}
                      onClick={() => updateMember(idx, { age_group: 'adult' })}
                    >
                      Adult
                    </AgeGroupBtn>
                    <AgeGroupBtn
                      type="button"
                      $selected={member.age_group === 'child'}
                      onClick={() => updateMember(idx, { age_group: 'child' })}
                    >
                      Child
                    </AgeGroupBtn>
                  </AgeGroupRow>
                </div>

                <div>
                  <SectionLabel>Allergies</SectionLabel>
                  <SectionHint>Koda will never suggest recipes with these ingredients.</SectionHint>
                  <ChipGrid>
                    {MEMBER_ALLERGY_OPTIONS.map((opt) => (
                      <Chip
                        key={opt}
                        type="button"
                        $selected={(member.allergies || []).includes(opt)}
                        onClick={() => toggleArrayItem(idx, 'allergies', opt)}
                      >
                        {opt}
                      </Chip>
                    ))}
                  </ChipGrid>
                  {(member.allergies || []).filter((a) => !MEMBER_ALLERGY_OPTIONS.includes(a))
                    .length > 0 && (
                    <CustomTagRow>
                      {(member.allergies || [])
                        .filter((a) => !MEMBER_ALLERGY_OPTIONS.includes(a))
                        .map((tag) => (
                          <CustomTag key={tag}>
                            {tag}
                            <RemoveTag
                              type="button"
                              onClick={() => toggleArrayItem(idx, 'allergies', tag)}
                            >
                              &times;
                            </RemoveTag>
                          </CustomTag>
                        ))}
                    </CustomTagRow>
                  )}
                  <CustomRow>
                    <Input
                      placeholder="Other allergy..."
                      value={customAllergy}
                      onChange={(e) => setCustomAllergy(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomAllergy(idx)}
                      maxLength={60}
                    />
                    <AddBtn
                      type="button"
                      onClick={() => addCustomAllergy(idx)}
                      disabled={!customAllergy.trim()}
                    >
                      Add
                    </AddBtn>
                  </CustomRow>
                </div>

                <div>
                  <SectionLabel>Dietary restrictions</SectionLabel>
                  <SectionHint>
                    Koda will make accommodations and suggest alternatives where possible.
                  </SectionHint>
                  <ChipGrid>
                    {MEMBER_DIET_OPTIONS.map((opt) => (
                      <Chip
                        key={opt}
                        type="button"
                        $selected={(member.dietary_restrictions || []).includes(opt)}
                        onClick={() => toggleArrayItem(idx, 'dietary_restrictions', opt)}
                      >
                        {opt}
                      </Chip>
                    ))}
                  </ChipGrid>
                  {(member.dietary_restrictions || []).filter(
                    (d) => !MEMBER_DIET_OPTIONS.includes(d),
                  ).length > 0 && (
                    <CustomTagRow>
                      {(member.dietary_restrictions || [])
                        .filter((d) => !MEMBER_DIET_OPTIONS.includes(d))
                        .map((tag) => (
                          <CustomTag key={tag}>
                            {tag}
                            <RemoveTag
                              type="button"
                              onClick={() => toggleArrayItem(idx, 'dietary_restrictions', tag)}
                            >
                              &times;
                            </RemoveTag>
                          </CustomTag>
                        ))}
                    </CustomTagRow>
                  )}
                  <CustomRow>
                    <Input
                      placeholder="Other restriction..."
                      value={customDiet}
                      onChange={(e) => setCustomDiet(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomDiet(idx)}
                      maxLength={60}
                    />
                    <AddBtn
                      type="button"
                      onClick={() => addCustomDiet(idx)}
                      disabled={!customDiet.trim()}
                    >
                      Add
                    </AddBtn>
                  </CustomRow>
                </div>

                <div>
                  <PickyToggle
                    type="button"
                    $active={member.is_picky_eater}
                    onClick={() => updateMember(idx, { is_picky_eater: !member.is_picky_eater })}
                  >
                    <span>Picky eater</span>
                    <ToggleTrack $on={member.is_picky_eater}>
                      <ToggleKnob $on={member.is_picky_eater} />
                    </ToggleTrack>
                  </PickyToggle>

                  {member.is_picky_eater && (
                    <PickyPanel>
                      <ChipGrid>
                        {PICKY_EATER_ISSUES.map((issue) => (
                          <Chip
                            key={issue}
                            type="button"
                            $selected={(member.picky_issues || []).includes(issue)}
                            onClick={() => toggleArrayItem(idx, 'picky_issues', issue)}
                          >
                            {issue}
                          </Chip>
                        ))}
                      </ChipGrid>
                      {(member.picky_issues || []).filter((p) => !PICKY_EATER_ISSUES.includes(p))
                        .length > 0 && (
                        <CustomTagRow>
                          {(member.picky_issues || [])
                            .filter((p) => !PICKY_EATER_ISSUES.includes(p))
                            .map((tag) => (
                              <CustomTag key={tag}>
                                {tag}
                                <RemoveTag
                                  type="button"
                                  onClick={() => toggleArrayItem(idx, 'picky_issues', tag)}
                                >
                                  &times;
                                </RemoveTag>
                              </CustomTag>
                            ))}
                        </CustomTagRow>
                      )}
                      <CustomRow>
                        <Input
                          placeholder="e.g. won't eat anything green"
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomNote(idx)}
                          maxLength={100}
                        />
                        <AddBtn
                          type="button"
                          onClick={() => addCustomNote(idx)}
                          disabled={!customNote.trim()}
                        >
                          Add
                        </AddBtn>
                      </CustomRow>
                      <AINote>
                        Koda will use this to find meals the whole family can enjoy, suggesting easy
                        swaps for picky eaters.
                      </AINote>
                    </PickyPanel>
                  )}
                </div>

                <div>
                  <MacrosToggle
                    type="button"
                    $active={member.track_macros}
                    onClick={() => updateMember(idx, { track_macros: !member.track_macros })}
                  >
                    <span>Track macros</span>
                    <ToggleTrack $on={member.track_macros}>
                      <ToggleKnob $on={member.track_macros} />
                    </ToggleTrack>
                  </MacrosToggle>

                  {member.track_macros && (
                    <MacrosPanel>
                      <MacroInputRow>
                        <MacroLabel>Calories</MacroLabel>
                        <MacroInput
                          type="number"
                          placeholder="2000"
                          value={member.macro_calories ?? ''}
                          onChange={(e) =>
                            updateMember(idx, {
                              macro_calories:
                                e.target.value === '' ? null : parseInt(e.target.value, 10),
                            })
                          }
                          min={0}
                          max={10000}
                        />
                        <MacroUnit>calories / day</MacroUnit>
                      </MacroInputRow>
                      <MacroInputRow>
                        <MacroLabel>Protein</MacroLabel>
                        <MacroInput
                          type="number"
                          placeholder="150"
                          value={member.macro_protein_g ?? ''}
                          onChange={(e) =>
                            updateMember(idx, {
                              macro_protein_g:
                                e.target.value === '' ? null : parseInt(e.target.value, 10),
                            })
                          }
                          min={0}
                          max={500}
                        />
                        <MacroUnit>g / day</MacroUnit>
                      </MacroInputRow>
                      <MacroInputRow>
                        <MacroLabel>Carbs</MacroLabel>
                        <MacroInput
                          type="number"
                          placeholder="250"
                          value={member.macro_carbs_g ?? ''}
                          onChange={(e) =>
                            updateMember(idx, {
                              macro_carbs_g:
                                e.target.value === '' ? null : parseInt(e.target.value, 10),
                            })
                          }
                          min={0}
                          max={800}
                        />
                        <MacroUnit>g / day</MacroUnit>
                      </MacroInputRow>
                      <MacroInputRow>
                        <MacroLabel>Fat</MacroLabel>
                        <MacroInput
                          type="number"
                          placeholder="65"
                          value={member.macro_fat_g ?? ''}
                          onChange={(e) =>
                            updateMember(idx, {
                              macro_fat_g:
                                e.target.value === '' ? null : parseInt(e.target.value, 10),
                            })
                          }
                          min={0}
                          max={400}
                        />
                        <MacroUnit>g / day</MacroUnit>
                      </MacroInputRow>
                      <AINote>
                        Koda will use these targets when building meal plans for this person.
                      </AINote>
                    </MacrosPanel>
                  )}
                </div>

                {/* ── Personal faith-based practices ── */}
                <div>
                  <FaithDivider>
                    Faith-based practices
                    {faithPractices?.follows_faith_based_diet &&
                      member.individual_faith_practices?.follows_individual_faith_diet && (
                        <HouseholdBadge>From household</HouseholdBadge>
                      )}
                  </FaithDivider>
                  <PickyToggle
                    type="button"
                    $active={member.individual_faith_practices?.follows_individual_faith_diet}
                    onClick={() => {
                      const current = member.individual_faith_practices || {};
                      updateMember(idx, {
                        individual_faith_practices: {
                          ...current,
                          follows_individual_faith_diet: !current.follows_individual_faith_diet,
                        },
                      });
                    }}
                  >
                    <span>This person follows faith-based dietary practices</span>
                    <ToggleTrack
                      $on={member.individual_faith_practices?.follows_individual_faith_diet}
                    >
                      <ToggleKnob
                        $on={member.individual_faith_practices?.follows_individual_faith_diet}
                      />
                    </ToggleTrack>
                  </PickyToggle>

                  {member.individual_faith_practices?.follows_individual_faith_diet && (
                    <PickyPanel>
                      <AINote>
                        {faithPractices?.follows_faith_based_diet
                          ? 'Pre-filled from household practices. Adjust below if this person has different needs.'
                          : 'Select practices that apply to this person.'}
                      </AINote>
                      <FaithPracticeCards
                        practices={
                          member.individual_faith_practices?.individual_faith_practices || []
                        }
                        practiceDetails={member.individual_faith_practices || {}}
                        onChange={(practices, details) => {
                          updateMember(idx, {
                            individual_faith_practices: {
                              ...details,
                              follows_individual_faith_diet: true,
                              individual_faith_practices: practices,
                            },
                          });
                        }}
                      />
                    </PickyPanel>
                  )}
                </div>

                <ProfileFooter>
                  {!member.is_owner ? (
                    <RemoveLink type="button" onClick={() => removeMember(idx)}>
                      Remove member
                    </RemoveLink>
                  ) : (
                    <span />
                  )}
                  <SaveBtn type="button" onClick={() => setExpandedIdx(null)}>
                    Save
                  </SaveBtn>
                </ProfileFooter>
              </ExpandedContent>
            )}
          </CardComponent>
        );
      })}

      {!displayMode && (
        <AddRow>
          <Input
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
          />
          <SmallInput
            placeholder="Age"
            type="number"
            value={newAge}
            onChange={(e) => setNewAge(e.target.value)}
            min={0}
            max={120}
          />
          <AddBtn type="button" onClick={addMember} disabled={!newName.trim()}>
            Add
          </AddBtn>
        </AddRow>
      )}

      {!displayMode && onChangeFaith && (
        <FaithSection>
          <FaithSectionLabel>Faith-based dietary practices</FaithSectionLabel>
          <FaithHint>
            Toggle on to apply to the entire household. Each member can still be adjusted
            individually above.
          </FaithHint>
          <FaithPracticeToggle
            enabled={faithPractices?.follows_faith_based_diet || false}
            onToggle={(val) => {
              onChangeFaith({
                ...faithPractices,
                follows_faith_based_diet: val,
              });
              // When turning on, sync to all members
              if (val) {
                const householdPractices = faithPractices?.household_faith_practices || [];
                const updated = members.map((m) => ({
                  ...m,
                  individual_faith_practices: {
                    ...(m.individual_faith_practices || {}),
                    follows_individual_faith_diet: true,
                    individual_faith_practices: householdPractices,
                  },
                }));
                onChange(updated);
              }
            }}
            label="Our household follows faith-based dietary guidelines"
          />
          {faithPractices?.follows_faith_based_diet && (
            <FaithPracticeCards
              practices={faithPractices?.household_faith_practices || []}
              practiceDetails={faithPractices || {}}
              onChange={(newPractices, newDetails) => {
                onChangeFaith({
                  ...newDetails,
                  follows_faith_based_diet: true,
                  household_faith_practices: newPractices,
                });
                // Sync updated practices to all members
                const updated = members.map((m) => ({
                  ...m,
                  individual_faith_practices: {
                    ...(m.individual_faith_practices || {}),
                    follows_individual_faith_diet: true,
                    individual_faith_practices: newPractices,
                  },
                }));
                onChange(updated);
              }}
            />
          )}
        </FaithSection>
      )}
    </MemberList>
  );

  // When embedded inside HouseholdSizeStep, render without StepShell wrapper
  if (embedded) return content;

  return (
    <StepShell
      title="Who's in your household?"
      subtitle="Add family members so Koda can plan meals everyone will enjoy."
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      showSkip
      onSkip={onSkip}
      skipLabel="Skip for now"
    >
      {content}
    </StepShell>
  );
}
