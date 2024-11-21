import { FormHelperText, Stack, TextField, Typography, Box, useTheme, useMediaQuery, Checkbox, FormControlLabel } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { ecommerceOutlookAnimation } from '../../../assets';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { selectLoggedInUser, signupAsync, selectSignupStatus, selectSignupError, clearSignupError, resetSignupStatus } from '../AuthSlice';
import { toast } from 'react-toastify';
import { MotionConfig , motion } from 'framer-motion';

export const Signup = () => {
    const dispatch = useDispatch();
    const status = useSelector(selectSignupStatus);
    const error = useSelector(selectSignupError);
    const loggedInUser = useSelector(selectLoggedInUser);
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    
    const navigate = useNavigate();
    const theme = useTheme();
    const is900 = useMediaQuery(theme.breakpoints.down(900));
    const is480 = useMediaQuery(theme.breakpoints.down(480));
    
    // State to track admin registration
    const [isAdmin, setIsAdmin] = useState(false);

    // handles user redirection
    // useEffect(() => {
    //     // if (loggedInUser && !loggedInUser?.isVerified) {
    //     //     navigate("/verify-otp");
    //     // } else 
    //     if (loggedInUser) {
    //         navigate("/"); // Redirect to homepage if logged in
    //     }
    // }, [loggedInUser]);

    // handles signup error and toast them
    useEffect(() => {
        if (error) {
            toast.error(error.message);
        }
    }, [error]);

    // Reset and show success message on successful signup
    useEffect(() => {
        if (status === 'fullfilled') {
            toast.success("Welcome! Verify your email to start shopping on mern-ecommerce.");
            reset();
            navigate("/"); // Redirect to homepage after successful signup
        }
        return () => {
            dispatch(clearSignupError());
            dispatch(resetSignupStatus());
        };
    }, [status]);

    // This function handles signup and dispatches the signup action with credentials that API requires
    const handleSignup = (data) => {
        const cred = { ...data, isAdmin }; // Include isAdmin in the credentials
        delete cred.confirmPassword;
        dispatch(signupAsync(cred));
    };

    return (
        <Stack width={'100vw'} height={'100vh'} flexDirection={'row'} sx={{ overflowY: "hidden" }}>
            {!is900 && (
                <Stack bgcolor={'black'} flex={1} justifyContent={'center'}>
                    <Lottie animationData={ecommerceOutlookAnimation} />
                </Stack>
            )}

            <Stack flex={1} justifyContent={'center'} alignItems={'center'}>
                <Stack flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                    <Stack rowGap={'.4rem'}>
                        <Typography variant='h2' sx={{ wordBreak: "break-word", fontFamily: "Brush Script MT" }} fontWeight={600}>Craftique</Typography>
                        <Typography alignSelf={'flex-end'} color={'GrayText'} variant='body2'>- Shop Your Favourite Crafts</Typography>
                    </Stack>
                </Stack>

                <Stack mt={4} spacing={2} width={is480 ? "95vw" : '28rem'} component={'form'} noValidate onSubmit={handleSubmit(handleSignup)}>
                    <MotionConfig whileHover={{ y: -5 }}>
                        <motion.div>
                            <TextField fullWidth {...register("name", { required: "Username is required" })} placeholder='Username' />
                            {errors.name && <FormHelperText error>{errors.name.message}</FormHelperText>}
                        </motion.div>

                        <motion.div>
                            <TextField fullWidth {...register("email", { required: "Email is required", pattern: { value: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g, message: "Enter a valid email" } })} placeholder='Email' />
                            {errors.email && <FormHelperText error>{errors.email.message}</FormHelperText>}
                        </motion.div>

                        {/* Password Field with Type Set to Password */}
                        <motion.div>
                            <TextField 
                                fullWidth 
                                type="password"  // Set type to password
                                {...register("password", { required: "Password is required", pattern: { value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, message: `At least 8 characters, must contain at least 1 uppercase letter and 1 number` } })} 
                                placeholder='Password' 
                            />
                            {errors.password && <FormHelperText error>{errors.password.message}</FormHelperText>}
                        </motion.div>

                        {/* Confirm Password Field with Type Set to Password */}
                        <motion.div>
                            <TextField 
                                fullWidth 
                                type="password"  // Set type to password
                                {...register("confirmPassword", { required: "Confirm Password is required", validate: (value) => value === watch('password') || "Passwords don't match" })} 
                                placeholder='Confirm Password' 
                            />
                            {errors.confirmPassword && <FormHelperText error>{errors.confirmPassword.message}</FormHelperText>}
                        </motion.div>

                        {/* Checkbox for Admin Registration */}
                        <motion.div>
                            <FormControlLabel
                                control={<Checkbox checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />}
                                label="Register as Admin"
                            />
                        </motion.div>
                    </MotionConfig>

                    <motion.div whileHover={{ scale: 1.020 }} whileTap={{ scale: 1 }}>
                        <LoadingButton sx={{ height: '2.5rem' }} fullWidth loading={status === 'pending'} type='submit' variant='contained'>Signup</LoadingButton>
                    </motion.div>

                    <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap-reverse'}>
                        <MotionConfig whileHover={{ x: 2 }} whileTap={{ scale: 1.050 }}>
                            <motion.div>
                                <Typography mr={'1.5rem'} sx={{ textDecoration: "none", color: "text.primary" }} to={'/forgot-password'} component={Link}>Forgot password</Typography>
                            </motion.div>

                            <motion.div>
                                <Typography sx={{ textDecoration: "none", color: "text.primary" }} to={'/login'} component={Link}>Already a member? <span style={{ color: theme.palette.primary.dark }}>Login</span></Typography>
                            </motion.div>
                        </MotionConfig>
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};