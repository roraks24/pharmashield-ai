import { configureStore } from '@reduxjs/toolkit';
import complaintReducer from './complaintSlice';
import analysisReducer from './analysisSlice';
import copilotReducer from './copilotSlice';
import complaintsReducer from './complaintsSlice';

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    analysis: analysisReducer,
    copilot: copilotReducer,
    complaints: complaintsReducer,
  },
});
