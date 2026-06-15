import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { LOGIN_USER } from '../utils/mutations';
import { Box, Card, CardContent, CardHeader, Container, Grid, TextField, Button, Typography } from "@mui/material";


import Auth from '../utils/auth';

const Login = () => {
  const [formState, setFormState] = useState({ username: '', password: '' });
  const [login, { error, data }] = useMutation(LOGIN_USER);

  // update state based on form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState({
      ...formState,
      [name]: value,
    });
  };

  // submit form
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await login({
        variables: { ...formState },
      });

      Auth.login(data.login.token);
    } catch (e) {
      console.error(e);
    }

    // clear form values
    setFormState({
      username: '',
      password: '',
    });
  };

  return (
    <Container maxWidth={false} sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: 'transparent', px: 2, py: 6 }}>
      <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'center'}}>
        <Grid item xs={12} sm={9} md={6} lg={4}>
          <Card>
            <CardHeader title="Log In" sx={{ background: "linear-gradient(135deg, #301067, #6d3bd6)", color: "secondary.light", textAlign: 'center' }} />
            <CardContent>
              {data ? (
                <Typography variant="body1">
                  Success! You may now head{" "}
                  <Link to="/">back to the homepage.</Link>
                </Typography>
              ) : (
                <form onSubmit={handleFormSubmit} >
                  <TextField
                    label="Username"
                    name="username"
                    type="text"
                    value={formState.username}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={formState.password}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <Button variant="contained" color="secondary" type="submit" fullWidth sx={{ mt: 2 }}>
                    Log In
                  </Button>
                </form>
              )}
              {error && (
                <Box sx={{ backgroundColor: "error.main", color: "white", p: 2, mt: 3 }}>
                  {error.message}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login;
