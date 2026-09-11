/**
 * Analysis Slice — manages the AI extraction and analysis state.
 *
 * State shape:
 *   extractionStatus: 'idle' | 'processing' | 'success' | 'error'
 *   extractedData:    object | null   — complaint fields extracted by AI
 *   completeness:     { score, missing_fields } | null
 *   risk:             { risk_level, risk_reason, recommended_next_action, ... } | null
 *   summary:          string | null
 *   rawAnalysis:      object | null   — full analysis payload for save
 *   error:            string | null
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { sendCopilotMessage } from './copilotSlice';

export const analyzeComplaint = createAsyncThunk(
  'analysis/analyze',
  async (payload, { rejectWithValue }) => {
    try {
      let formData;
      if (payload instanceof FormData) {
        formData = payload;
      } else {
        formData = new FormData();
        if (payload?.text) {
          formData.append('text', payload.text);
        }
      }
      const response = await api.post('/api/copilot/analyze', formData);
      return response.data;
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return rejectWithValue(detail);
    }
  }
);

// ── Shared State Mapping Helpers (DRY) ───────────────────────────

const applyAnalysisToState = (state, complaint, analysis) => {
  state.extractionStatus = 'success';
  state.extractedData = complaint || {};
  state.rawAnalysis = analysis || {};

  if (analysis) {
    state.completeness = {
      score: analysis.completeness_score,
      missing_fields: analysis.missing_fields,
    };
    state.risk = {
      level: analysis.risk_level,
      reason: analysis.risk_reason,
      next_action: analysis.recommended_next_action,
      root_cause_hypotheses: analysis.root_cause_hypotheses,
      capa_recommendations: analysis.capa_recommendations,
    };
    state.summary = analysis.summary;
    state.duplicate = analysis.duplicate_score
      ? {
          score: analysis.duplicate_score,
          reason: analysis.duplicate_reason,
        }
      : null;
  }
};

const applyExtractedUpdate = (state, updatedFields) => {
  state.extractedData = {
    ...(state.extractedData || {}),
    ...updatedFields,
  };

  // If any missing fields are resolved by this edit, remove them and recalculate completeness score
  if (state.completeness && Array.isArray(state.completeness.missing_fields)) {
    const updatedKeys = Object.keys(updatedFields);
    const remaining = state.completeness.missing_fields.filter((field) => {
      const normField = field.toLowerCase().replace(/_/g, ' ');
      return !updatedKeys.some((k) => {
        const normKey = k.toLowerCase().replace(/_/g, ' ');
        return normKey.includes(normField) || normField.includes(normKey);
      });
    });
    const countResolved = state.completeness.missing_fields.length - remaining.length;
    state.completeness.missing_fields = remaining;
    if (countResolved > 0) {
      state.completeness.score = Math.min(
        100,
        (state.completeness.score || 60) + countResolved * 12
      );
    }
  }
};

const initialState = {
  extractionStatus: 'idle',
  extractedData: null,
  completeness: null,
  risk: null,
  summary: null,
  duplicate: null,
  rawAnalysis: null,
  error: null,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    resetAnalysis: () => initialState,
    setAnalysisData: (state, action) => {
      const { complaint, analysis } = action.payload;
      applyAnalysisToState(state, complaint, analysis);
    },
    updateExtractedData: (state, action) => {
      applyExtractedUpdate(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Document upload / text analysis
      .addCase(analyzeComplaint.pending, (state) => {
        state.extractionStatus = 'processing';
        state.error = null;
      })
      .addCase(analyzeComplaint.fulfilled, (state, action) => {
        const { complaint, analysis } = action.payload;
        applyAnalysisToState(state, complaint, analysis);
      })
      .addCase(analyzeComplaint.rejected, (state, action) => {
        state.extractionStatus = 'error';
        state.error = action.payload || 'Analysis failed';
      })
      // Conversational AI copilot integration
      .addCase(sendCopilotMessage.fulfilled, (state, action) => {
        const data = action.payload;
        if (!data) return;
        if (data.action === 'LOG_COMPLAINT' && data.complaint) {
          applyAnalysisToState(state, data.complaint, data.analysis);
        } else if (data.action === 'UPDATE_COMPLAINT' && data.updated_fields) {
          applyExtractedUpdate(state, data.updated_fields);
        }
      });
  },
});

export const { resetAnalysis, setAnalysisData, updateExtractedData } = analysisSlice.actions;
export default analysisSlice.reducer;


