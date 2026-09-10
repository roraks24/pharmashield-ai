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
        state.duplicate = analysis.duplicate_score ? {
          score: analysis.duplicate_score,
          reason: analysis.duplicate_reason,
        } : null;
      }
    },
    updateExtractedData: (state, action) => {
      const updatedFields = action.payload;
      state.extractedData = {
        ...(state.extractedData || {}),
        ...updatedFields,
      };

      // If any of the missing fields are resolved by this update, remove them and update score
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
          state.completeness.score = Math.min(100, (state.completeness.score || 60) + countResolved * 12);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeComplaint.pending, (state) => {
        state.extractionStatus = 'processing';
        state.error = null;
      })
      .addCase(analyzeComplaint.fulfilled, (state, action) => {
        // API returns: { complaint: {...}, analysis: {...} }
        const { complaint, analysis } = action.payload;

        state.extractionStatus = 'success';
        state.extractedData = complaint || {};
        state.rawAnalysis = analysis || {};

        // Map analysis fields for display components
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
          state.duplicate = analysis.duplicate_score ? {
            score: analysis.duplicate_score,
            reason: analysis.duplicate_reason,
          } : null;
        }
      })
      .addCase(analyzeComplaint.rejected, (state, action) => {
        state.extractionStatus = 'error';
        state.error = action.payload || 'Analysis failed';
      });
  },
});

export const { resetAnalysis, setAnalysisData, updateExtractedData } = analysisSlice.actions;
export default analysisSlice.reducer;

