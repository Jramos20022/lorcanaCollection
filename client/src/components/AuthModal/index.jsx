import { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Modal,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import Auth from '../../utils/auth';
import { ADD_USER, LOGIN_USER } from '../../utils/mutations';

const emptyLogin = { username: '', password: '' };
const emptySignup = { email: '', username: '', password: '', confirmPassword: '' };

const AuthModal = ({ mode, onModeChange, onClose }) => {
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [validationError, setValidationError] = useState('');
  const [login, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_USER);
  const [addUser, { loading: signupLoading, error: signupError }] = useMutation(ADD_USER);
  const isSignup = mode === 'signup';
  const passwordsMatch = signupForm.password === signupForm.confirmPassword;
  const signupComplete = Object.values(signupForm).every((value) => value.trim());
  const loginComplete = Object.values(loginForm).every((value) => value.trim());
  const loading = loginLoading || signupLoading;

  const changeMode = (_, nextMode) => {
    setValidationError('');
    onModeChange(nextMode);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const { data } = await login({
        variables: {
          username: loginForm.username.trim(),
          password: loginForm.password,
        },
      });
      Auth.login(data.login.token);
    } catch {
      // Apollo exposes the authentication error inline below the form.
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    if (!passwordsMatch) {
      setValidationError('Passwords must match before you can sign up.');
      return;
    }

    try {
      const { data } = await addUser({
        variables: {
          email: signupForm.email.trim(),
          username: signupForm.username.trim(),
          password: signupForm.password,
        },
      });
      Auth.login(data.addUser.token);
    } catch {
      // Apollo exposes account creation errors inline below the form.
    }
  };

  return (
    <Modal open={Boolean(mode)} onClose={loading ? undefined : onClose} aria-labelledby="auth-modal-title">
      <Paper
        elevation={18}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(92vw, 430px)',
          maxHeight: '92vh',
          overflowY: 'auto',
          p: { xs: 2, sm: 3 },
          bgcolor: 'rgba(13, 13, 31, 0.98)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography id="auth-modal-title" variant="h4" textAlign="center" color="secondary.light" sx={{ mb: 1 }}>
          The Inkcaster
        </Typography>
        <Tabs value={mode} onChange={changeMode} variant="fullWidth" sx={{ mb: 2 }}>
          <Tab value="login" label="Log In" />
          <Tab value="signup" label="Sign Up" />
        </Tabs>

        {isSignup ? (
          <Box component="form" onSubmit={handleSignup}>
            <Stack spacing={1.5}>
              <TextField
                label="Email"
                type="email"
                value={signupForm.email}
                onChange={(event) => setSignupForm((form) => ({ ...form, email: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Username"
                value={signupForm.username}
                onChange={(event) => setSignupForm((form) => ({ ...form, username: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={signupForm.password}
                onChange={(event) => setSignupForm((form) => ({ ...form, password: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={signupForm.confirmPassword}
                onChange={(event) => {
                  setSignupForm((form) => ({ ...form, confirmPassword: event.target.value }));
                  setValidationError('');
                }}
                error={Boolean(signupForm.confirmPassword) && !passwordsMatch}
                helperText={signupForm.confirmPassword && !passwordsMatch ? 'Passwords do not match.' : ' '}
                required
                fullWidth
              />
              {validationError && <Alert severity="error">{validationError}</Alert>}
              {signupError && <Alert severity="error">{signupError.message}</Alert>}
              <Button type="submit" variant="contained" disabled={!signupComplete || !passwordsMatch || loading}>
                {signupLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign Up'}
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleLogin}>
            <Stack spacing={1.5}>
              <TextField
                label="Username"
                value={loginForm.username}
                onChange={(event) => setLoginForm((form) => ({ ...form, username: event.target.value }))}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((form) => ({ ...form, password: event.target.value }))}
                required
                fullWidth
              />
              {loginError && <Alert severity="error">{loginError.message}</Alert>}
              <Button type="submit" variant="contained" disabled={!loginComplete || loading}>
                {loginLoading ? <CircularProgress size={22} color="inherit" /> : 'Log In'}
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Modal>
  );
};

export default AuthModal;
