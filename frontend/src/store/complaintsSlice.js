import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchComplaints = createAsyncThunk(
  'complaints/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/complaints');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  'complaints/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/complaints/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  selectedId: null,
  selectedComplaint: null,
  listStatus: 'idle', // idle | loading | succeeded | failed
  detailStatus: 'idle',
  error: null
};

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    clearSelectedComplaint: (state) => {
      state.selectedId = null;
      state.selectedComplaint = null;
      state.detailStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplaints.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchComplaintById.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.selectedComplaint = action.payload;
        state.selectedId = action.payload.id;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearSelectedComplaint } = complaintsSlice.actions;
export default complaintsSlice.reducer;
