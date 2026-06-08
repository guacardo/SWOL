/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import { lazy } from "solid-js";
import "./index.css";
import "./theme.css";
import RootLayout from "./RootLayout";
import Dashboard from "./views/dashboard/Dashboard";

const LogWorkout = lazy(() => import("./views/log/LogWorkout"));
const WorkoutDetail = lazy(() => import("./views/workouts/WorkoutDetail"));
const Exercises = lazy(() => import("./views/exercises/Exercises"));
const Trends = lazy(() => import("./views/trends/Trends"));
const Friends = lazy(() => import("./views/friends/Friends"));
const TypeSpecimen = lazy(() => import("./views/type/TypeSpecimen"));
const Login = lazy(() => import("./views/login/Login"));
const AuthCallback = lazy(() => import("./views/auth/AuthCallback"));

render(
    () => (
        <Router root={RootLayout}>
            {[
                { path: "/", component: Dashboard },
                { path: "/log", component: LogWorkout },
                { path: "/workouts/:id", component: WorkoutDetail },
                { path: "/exercises", component: Exercises },
                { path: "/trends", component: Trends },
                { path: "/friends", component: Friends },
                { path: "/type", component: TypeSpecimen },
                { path: "/login", component: Login },
                { path: "/auth/callback", component: AuthCallback },
                { path: "*", component: Dashboard },
            ]}
        </Router>
    ),
    document.getElementById("root")!,
);
