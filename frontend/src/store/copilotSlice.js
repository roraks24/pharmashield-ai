/**
 * Copilot Slice — manages the conversational AI copilot state.
 *
 * State shape:
 *   messages: Array<{ role: 'user'|'assistant', content: string }>
 *   loading:  boolean
 *   error:    string | null
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const sendCopilotMessage = createAsyncThunk(
  'copilot/sendMessage',
  async ({ message, complaintContext }, { rejectWithValue }) => {
    try {
      // Backend expects FormData fields: message, complaint_context
      const formData = new FormData();
      formData.append('message', message);
      if (complaintContext) {
        formData.append('complaint_context', JSON.stringify(complaintContext));
      }
      const response = await api.post('/api/copilot/message', formData);
      return response.data;
    } catch (error) {
      const detail = error.response?.data?.detail || error.message;
      return rejectWithValue(detail);
    }
  }
);


const initialState = {
  messages: [],
  loading: false,
  error: null,
};

const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearChat: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendCopilotMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendCopilotMessage.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { response: "..." }
        const content = action.payload.response || action.payload.message;
        if (content) {
          state.messages.push({ role: 'assistant', content });
        }
      })
      .addCase(sendCopilotMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        });
      });
  },
});

export const { addMessage, clearChat } = copilotSlice.actions;
export default copilotSlice.reducer;
