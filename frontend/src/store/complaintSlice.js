/**
 * Complaint Slice — manages the complaint form state, dirty tracking, and save.
 *
 * State shape:
 *   formData:          form field values
 *   dirtyFields:       { [fieldName]: true } — fields edited by user (not AI)
 *   validationErrors:  { [fieldName]: message }
 *   saveStatus:        'idle' | 'saving' | 'saved' | 'error'
 *   savedComplaintId:  string | null — ID returned after save
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const saveComplaint = createAsyncThunk(
  'complaint/save',
  async ({ formData, analysis }, { rejectWithValue }) => {
    try {
      // Backend expects: { complaint: ComplaintCreate, analysis?: dict }
      const payload = {
        complaint: {
          ...formData,
          complaint_source: formData.complaint_source || 'Email',
          // Convert empty strings to null for optional date fields
          manufacturing_date: formData.manufacturing_date || null,
          expiry_date: formData.expiry_date || null,
          complaint_date: formData.complaint_date || null,
          // Convert empty strings to null for optional enum fields
          severity: formData.severity || null,
          priority: formData.priority || null,
        },
        analysis: analysis || null,
      };
      const response = await api.post('/api/complaints', payload);
      return response.data;
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return rejectWithValue(detail);
    }
  }
);

const initialFormData = {
  complaint_source: '',
  customer_name: '',
  customer_contact: '',
  product_name: '',
  product_strength_grade: '',
  batch_number: '',
  manufacturing_date: '',
  expiry_date: '',
  quantity_affected: '',
  complaint_type: '',
  complaint_date: '',
  description: '',
  severity: '',
  priority: '',
  status: 'Draft',
};

const initialState = {
  formData: { ...initialFormData },
  dirtyFields: {},
  validationErrors: {},
  saveStatus: 'idle',
  savedComplaintId: null,
};

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    updateField: (state, action) => {
      const { field, value, isAIPopulated } = action.payload;
      state.formData[field] = value;
      if (!isAIPopulated) {
        state.dirtyFields[field] = true;
      }
      // Clear save status when user edits
      if (state.saveStatus === 'saved') {
        state.saveStatus = 'idle';
      }
    },
    updateMultipleFields: (state, action) => {
      const { fields, isAIPopulated, force } = action.payload;
      Object.entries(fields).forEach(([key, value]) => {
        // Only populate if field exists in form and value is not null
        if (key in state.formData && value != null) {
          // Don't overwrite user-edited fields with AI data unless force is true
          if (isAIPopulated && state.dirtyFields[key] && !force) {
            return;
          }
          state.formData[key] = value;
          if (isAIPopulated) {
            delete state.dirtyFields[key];
          } else {
            state.dirtyFields[key] = true;
          }
        }
      });
    },
    resetForm: () => ({ ...initialState, formData: { ...initialFormData } }),
    setSaveStatus: (state, action) => {
      state.saveStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveComplaint.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(saveComplaint.fulfilled, (state, action) => {
        state.saveStatus = 'saved';
        state.savedComplaintId = action.payload.id;
      })
      .addCase(saveComplaint.rejected, (state, action) => {
        state.saveStatus = 'error';
        state.validationErrors =
          typeof action.payload === 'object' ? action.payload : {};
      });
  },
});

export const { updateField, updateMultipleFields, resetForm, setSaveStatus } =
  complaintSlice.actions;
export default complaintSlice.reducer;
