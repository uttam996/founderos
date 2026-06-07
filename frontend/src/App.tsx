import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Projects } from "@/pages/Projects";
import { AgentWorkspace } from "@/pages/AgentWorkspace";
import { Tasks } from "@/pages/Tasks";
import { Research } from "@/pages/Research";
import { StartupPlans } from "@/pages/StartupPlans";
import { Settings } from "@/pages/Settings";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<AgentWorkspace />} />
        <Route path="/projects/:id/plan" element={<StartupPlans />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/research" element={<Research />} />
        <Route path="/plans" element={<StartupPlans />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
