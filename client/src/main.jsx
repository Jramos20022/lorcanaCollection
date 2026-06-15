import React from 'react';
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/cinzel/700.css';
import theme from './utils/theme.js';


import App from "./App.jsx";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ErrorPage from "./pages/ErrorPage";
import Cards from "./pages/Cards";
import Builder from "./pages/Builder";
import Collection from "./pages/Collection";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/login",
        element: <Home />,
      },
      {
        path: "/signup",
        element: <Home />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/cards",
        element: <Cards />,
      },
      {
        path: "/builder",
        element: <Builder />
      },
      {
        path: "/collection",
        element: <Collection />
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
