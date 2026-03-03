import { Layout, ProtectedRoute } from '@components/'
import {
  AuthProvider,
  UserProvider,
  SidebarProvider,
  ProjectProvider,
  TestCaseProvider,
  TestPlanProvider,
  ScriptProvider,
} from '@contexts/'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { PAGE_ENDPOINTS } from '@constants/'
import {
  FinanceTab,
  HomeContainer,
  NewProjectContainer,
  IndexPage,
  PersonalAccountLayout,
  ProfileTab,
  ProjectContainer,
  SettingsTab,
  ViewProfileTab,
  ProjectOutlet,
} from './pages'

import PlannerPage from './pages/PlannerPages/PlannerPage';
import TaskDetailsPage from './pages/PlannerPages/TaskDetailsPage';

import './index.css'
import {
  CreateTestCase,
  ProjectAutoTesting,
  ProjectReports,
  ProjectSettings,
  ProjectTestCases,
  ProjectTestPlans,
  RedactTestCase,
  ViewTestCase,
  HistoryTestCase,
  TestCasesOutlet,
  TestPlanDetails,
  RedactTestPlan,
  TestPlanRunHistory,
  TestPlanRunDetails,
  ProjectScripts,
  RedactScript,
  ViewScript,
  TestPlanOutlet,
  ScriptRunDetails,
} from './pages/ProjectPages/components/ProjectSubPages'
import { Toaster } from 'sonner'
import { ScriptRunHistory } from './pages/ProjectPages/components/ProjectSubPages/Scripts/ScriptRunHistory'

const router = createBrowserRouter([
  {
    path: PAGE_ENDPOINTS.INDEX,
    element: <IndexPage />,
  },
  {
    path: PAGE_ENDPOINTS.OUTLET,
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: PAGE_ENDPOINTS.HOME,
        element: <HomeContainer />,
      },
      {
        path: PAGE_ENDPOINTS.PROJECT,
        children: [
          {
            path: 'new',
            element: <NewProjectContainer />,
          },
          {
            path: `${PAGE_ENDPOINTS.PROJECT_ID}`,
            element: <ProjectOutlet />,
            children: [
              {
                index: true,
                element: <ProjectContainer />,
              },
              {
                path: `${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_CASE}`,
                element: <TestCasesOutlet />,
                children: [
                  {
                    index: true,
                    element: <ProjectTestCases />,
                  },
                  {
                    path: 'new',
                    element: <CreateTestCase />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.TEST_CASE_ID}`,
                    element: <RedactTestCase />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.TEST_CASE_ID}/view`,
                    element: <ViewTestCase />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.TEST_CASE_ID}/${PAGE_ENDPOINTS.HISTORY}`,
                    element: <HistoryTestCase />,
                  },
                ],
              },
              {
                path: `${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN}`,
                element: <TestPlanOutlet />,
                children: [
                  {
                    index: true,
                    element: <ProjectTestPlans />,
                  },
                  {
                    path: `new`,
                    element: <RedactTestPlan />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.TEST_PLAN_ID}`,
                    element: <TestPlanDetails />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.TEST_PLAN_ID}/edit`,
                    element: <RedactTestPlan />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.TEST_PLAN_ID}/runs`,
                    element: <TestPlanRunHistory />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.TEST_PLAN_ID}/runs/${PAGE_ENDPOINTS.RUN_ID}`,
                    element: <TestPlanRunDetails />,
                  },
                ],
              },
              {
                path: `${PAGE_ENDPOINTS.PROJECT_PARTS.SCRIPT}`,
                children: [
                  {
                    index: true,
                    element: <ProjectScripts />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.SCRIPT_ID}/edit`,
                    element: <RedactScript />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.SCRIPT_ID}/view`,
                    element: <ViewScript />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.SCRIPT_ID}/${PAGE_ENDPOINTS.HISTORY}`,
                    element: <ScriptRunHistory />,
                  },
                  {
                    path: `${PAGE_ENDPOINTS.SCRIPT_ID}/${PAGE_ENDPOINTS.HISTORY}/${PAGE_ENDPOINTS.RUN_ID}`,
                    element: <ScriptRunDetails />,
                  },
                ],
              },
              {
                path: `${PAGE_ENDPOINTS.PROJECT_PARTS.AUTO_TEST}`,
                element: <ProjectAutoTesting />,
              },
              {
                path: `${PAGE_ENDPOINTS.PROJECT_PARTS.REPORTS}`,
                element: <ProjectReports />,
              },
              {
                path: `${PAGE_ENDPOINTS.PROJECT_PARTS.SETTINGS}`,
                element: <ProjectSettings />,
              },
              // {
              //   path: `${PAGE_ENDPOINTS.PROJECT_PARTS.TEST_PLAN_RUNS}`,
              //   element: <ProjectTestPlanRuns />,
              // },
            ],
          },
        ],
      },
      {
        path: PAGE_ENDPOINTS.ACCOUNT.INDEX,
        element: <PersonalAccountLayout />,
        children: [
          {
            path: PAGE_ENDPOINTS.ACCOUNT.PROFILE,
            element: <ProfileTab />,
          },
          {
            path: PAGE_ENDPOINTS.ACCOUNT.FINANCES,
            element: <FinanceTab />,
          },
          {
            path: PAGE_ENDPOINTS.ACCOUNT.SETTINGS,
            element: <SettingsTab />,
          },
        ],
      },
      {
        path: `${PAGE_ENDPOINTS.ACCOUNT.INDEX}/${PAGE_ENDPOINTS.ACCOUNT.VIEW_ACCOUNT}`,
        element: <ViewProfileTab />,
      },
      {
        path: 'planner',
        element: <PlannerPage />,
      },
      {
        path: 'planner/task/:id',
        element: <TaskDetailsPage />,
      },
      {
        path: '*',
        element: <Navigate to={PAGE_ENDPOINTS.INDEX} replace />,
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <ProjectProvider>
          <SidebarProvider>
            <TestCaseProvider>
              <TestPlanProvider>
                <ScriptProvider>
                  <RouterProvider router={router} />
                  <Toaster />
                </ScriptProvider>
              </TestPlanProvider>
            </TestCaseProvider>
          </SidebarProvider>
        </ProjectProvider>
      </UserProvider>
    </AuthProvider>
  )
}

export default App
