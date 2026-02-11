import {createSlice,createAsyncThunk} from '@reduxjs/toolkit';
import api from "../../services/api.js";

//login
export const loginUser = createAsyncThunk("auth/loginUser", async (userData,{rejectWithValue}) =>{
    try{
        const {data} = await api.post("/users/login", userData);
        return data.data.user;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Login failed");
    }
});

export const registerUser = createAsyncThunk("auth/registerUser",async(userData,{rejectWithValue})=>{
    try {
        const {data} = await api.post("users/register",userData)
        return data.data.user
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Register Failed")
    }
})

export const logoutUser = createAsyncThunk("auth/logoutUser",async(__,{rejectWithValue})=>{
    try {
        await api.post("users/logout")
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Logout Failed")
    }
})

const initialState = {
    user: null,
    loading: false,
    error: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            //login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            //register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            //logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
            })
    },
});

export default authSlice.reducer;