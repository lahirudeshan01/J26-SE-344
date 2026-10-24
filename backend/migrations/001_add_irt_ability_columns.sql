-- ============================================================================
-- Migration: 001_add_irt_ability_columns.sql
-- Module: Assessment Engine (NeuroLearn AI)
-- Purpose: Add Item Response Theory (IRT) ability estimate (theta) and progression
--          columns to assessment_sessions and assessment_attempts.
-- ============================================================================

-- 1. Add ability_estimate to assessment_sessions
-- Stores the student's latest estimated latent ability (theta, on standard logit scale [-3.5, +3.5])
ALTER TABLE assessment_sessions
  ADD COLUMN IF NOT EXISTS ability_estimate numeric DEFAULT 0.0;

-- 2. Add theta_before and theta_after to assessment_attempts
-- Tracks step-by-step ability calibration progression for research validation and diagnostics
ALTER TABLE assessment_attempts
  ADD COLUMN IF NOT EXISTS theta_before numeric,
  ADD COLUMN IF NOT EXISTS theta_after numeric;

COMMENT ON COLUMN assessment_sessions.ability_estimate IS 'IRT 1PL/Rasch latent ability estimate (theta), initialized at 0.0 and updated via Bayesian MAP.';
COMMENT ON COLUMN assessment_attempts.theta_before IS 'Estimated ability theta immediately prior to recording this attempt.';
COMMENT ON COLUMN assessment_attempts.theta_after IS 'Updated ability theta immediately after recording this attempt.';
