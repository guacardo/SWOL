/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import { lazy } from "solid-js";
import "./index.css";
import "./theme.css";
import RootLayout from "./RootLayout";
import Dashboard from "./views/dashboard/Dashboard";

const LogWorkout = lazy(() => import("./views/log/LogWorkout"));
const Trends = lazy(() => import("./views/trends/Trends"));
const Friends = lazy(() => import("./views/friends/Friends"));
const Login = lazy(() => import("./views/login/Login"));
const AuthCallback = lazy(() => import("./views/auth/AuthCallback"));

render(
    () => (
        <Router root={RootLayout}>
            {[
                { path: "/", component: Dashboard },
                { path: "/log", component: LogWorkout },
                { path: "/trends", component: Trends },
                { path: "/friends", component: Friends },
                { path: "/login", component: Login },
                { path: "/auth/callback", component: AuthCallback },
                { path: "*", component: Dashboard },
            ]}
        </Router>
    ),
    document.getElementById("root")!,
);
