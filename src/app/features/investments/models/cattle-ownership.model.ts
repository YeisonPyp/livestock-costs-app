// models/cattle-ownership.model.ts

import { CattleOwnershipStatus, OwnershipType } from './enums';

// ── Listado / Detalle ──────────────────────────────────────────────
export interface CattleOwnership {
  id: string;
  investorCode: string;
  investorName: string;
  ownershipType: OwnershipType;
  animal: string | null;
  lot: string | null;
  quantity: number;
  ownershipPercentage: string;
  purchaseValue: string;
  currentValue: string;
  valueAppreciation: string;
  valueAppreciationPercentage: string;
  initialWeight: string | null;
  currentWeight: string | null;
  weightGain: string;
  weightGainPercentage: string;
  acquisitionDate: string;
  status: CattleOwnershipStatus;
}

// ── Payloads ───────────────────────────────────────────────────────
interface OwnershipPayloadBase {
  investmentId: string;
  purchaseValue: number;
  initialWeight?: number;
  acquisitionDate?: string;
  notes?: string;
}

export interface CreateIndividualOwnershipPayload extends OwnershipPayloadBase {
  ownershipType: OwnershipType.INDIVIDUAL;
  animalId: string;
}

export interface CreateLotOwnershipPayload extends OwnershipPayloadBase {
  ownershipType: OwnershipType.LOT | OwnershipType.PERCENTAGE;
  lotId: string;
  quantity: number;
  ownershipPercentage?: number;
}

export type AssignCattlePayload = CreateIndividualOwnershipPayload | CreateLotOwnershipPayload;

export interface RecordWeightPayload {
  weight: number;
  pricePerKg?: number;
  recordDate?: string;
  notes?: string;
}

export interface WeightRecord {
  id: string;
  weight: string;
  pricePerKg: string | null;
  estimatedValue: string | null;
  recordDate: string;
  createdAt: string;
}

// ── Filtros ────────────────────────────────────────────────────────
export interface CattleOwnershipFilters {
  status?: CattleOwnershipStatus;
  ownershipType?: OwnershipType;
  investment?: string;
  investor?: string;
  animal?: string;
  lot?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

// ── Report ─────────────────────────────────────────────────────────
export interface CattleOwnerReport {
  investorCode: string;
  investorName: string;
  animalTag: string;
  breed: string;
  purchaseValue: string;
  currentWeight: string;
  currentValue: string;
  weightGain: string;
  acquisitionDate: string;
}

export interface CattleOwnershipSummary {
  id: string;
  tagNumber: string;
  name: string;
  breedName: string
  gender: string;
  category: string;
  lotCode: string;
  currentWeight: string;
  currentValue: string;
  ageMonths: string;
  weightGain: string;
  dailyGain: string;
  purchasePrice: string;
  status: CattleOwnershipStatus;
  entryDate: string;
  lastWeightDate: string;
}