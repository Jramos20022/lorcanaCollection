import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardContent, CardHeader, Container, Grid, TextField, Button, Typography } from "@mui/material";

import { useMutation } from '@apollo/client';
import { ADD_USER } from '../utils/mutations';

import Auth from '../utils/auth';

const Signup = () => {
  const [formState, setFormState] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [addUser, { error, data }] = useMutation(ADD_USER);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState({
      ...formState,
      [name]: value,
    });
    console.log(formState);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    console.log(formState);

    try {
      const { data } = await addUser({
        variables: { ...formState },
      });
      console.log(data);
      Auth.login(data.addUser.token);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container maxWidth={false} sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: 'transparent', px: 2, py: 6 }}>
      <Grid container spacing={2} sx={{ display: 'flex', justifyContent: 'center'}}>
        <Grid item xs={12} sm={9} md={6} lg={4}>
          <Card>
            <CardHeader title="Sign Up" sx={{ background: "linear-gradient(135deg, #301067, #6d3bd6)", color: "secondary.light", textAlign: 'center' }} />
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
                    value={formState.name}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={formState.password}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                  <Button variant="contained" color="secondary" type="submit" fullWidth sx={{ mt: 2 }}>
                    Submit
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

export default Signup;
