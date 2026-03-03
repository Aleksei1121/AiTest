import {
  ProfileData,
  Project,
  TestCaseHistoryRecord,
  ProjectMinimal,
  ProjectUser,
  TestCase,
  TestCaseFormData,
  TestCaseUpdateData,
  TestPlan,
  TestPlanRun,
  TestPlanUpdateData,
  User,
  TestPlanRunShort,
  ScriptRun,
  ScriptUpdateData,
  Script,
} from '@interfaces/'
import { MOCK_CODE } from '@constants/'
import {
  MOCK_PASSWORD,
  MOCK_TEST_PLANS,
  MOCK_TEST_PLAN_RUNS,
  mockProjects,
  mockProjectsHistory,
  mockScriptRuns,
  mockScripts,
  mockTestCases,
  mockTokens,
  mockUsers,
  plannerTasks,
} from '../mock/mockData'
import { UpdateProfileData, UpdateSettingsData } from '../api/users'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class MockApiService {
  private testPlanIdCounter = 100

  private findUserByEmail(email: string): User | undefined {
    return mockUsers.find((u) => u.profileData.email === email)
  }

  async login(credentials: { email: string; password: string }) {
    await delay(1000)

    const user = this.findUserByEmail(credentials.email)

    if (!user || credentials.password !== MOCK_PASSWORD) {
      throw new Error('Invalid email or password')
    }

    localStorage.setItem('mock_user_id', `${user.id}`)

    return {
      user,
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
    }
  }

  async register(data: { username: string; email: string; password: string }) {
    await delay(1000)

    if (this.findUserByEmail(data.email)) {
      throw new Error('User already exists')
    }

    const newUser: User = {
      ...mockUsers[1],
      id: Date.now(),
      profileData: {
        ...mockUsers[1].profileData,
        username: data.username,
        email: data.email,
        emailConfirmed: false,
      },
    }

    mockUsers.push(newUser)

    localStorage.setItem('mock_user_id', `${newUser.id}`)

    return {
      user: newUser,
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
    }
  }

  async getCurrentUser() {
    await delay(500)

    const storedAuth = localStorage.getItem('auth-storage')
    if (!storedAuth) {
      throw new Error('Not authenticated')
    }

    try {
      const parsedAuth = JSON.parse(storedAuth)
      const accessToken = parsedAuth.state?.accessToken

      if (!accessToken) {
        throw new Error('No access token')
      }

      const userId = parseInt(localStorage.getItem('mock_user_id') || '', 10)

      console.log('getCurrentUser - userId from localStorage:', userId)
      console.log('getCurrentUser - accessToken:', accessToken)

      if (!userId) {
        throw new Error('Not authenticated - no user id')
      }

      const user = mockUsers.find((u) => u.id === userId)
      console.log('getCurrentUser - found user:', user)

      if (!user) {
        throw new Error('User not found')
      }

      return user
    } catch (error) {
      console.error('Failed to get current user:', error)
      throw new Error('Not authenticated')
    }
  }

  async confirmEmail(data: { email: string; code: string }) {
    await delay(800)

    if (data.code !== MOCK_CODE) {
      throw new Error('Invalid confirmation code')
    }

    const userIndex = mockUsers.findIndex(
      (u) => u.profileData.email === data.email
    )
    if (userIndex === -1) throw new Error('User not found')

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      profileData: {
        ...mockUsers[userIndex].profileData,
        emailConfirmed: true,
      },
    }

    return { success: true }
  }

  async confirmPhone(data: { phone: string; code: string }) {
    await delay(800)

    if (data.code !== MOCK_CODE) {
      throw new Error('Invalid confirmation code')
    }

    const userIndex = mockUsers.findIndex(
      (u) => u.profileData.phone === data.phone
    )
    if (userIndex === -1) throw new Error('User not found')

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      profileData: {
        ...mockUsers[userIndex].profileData,
        phoneConfirmed: true,
      },
    }

    return { success: true }
  }

  async getUserProfile(userId: number): Promise<Partial<ProfileData>> {
    await delay(600)

    const user = mockUsers.find((u) => u.id === userId)

    if (!user) {
      throw new Error('User not found')
    }

    const profileData: Partial<ProfileData> = {
      status: user.profileData.status,
      username: user.profileData.username,
      teams: [],
    }

    if (user.settingsData.email && user.settingsData.email !== null) {
      profileData.email = user.profileData.email
    }

    if (user.settingsData.phone && user.settingsData.phone !== null) {
      profileData.phone = user.profileData.phone
    }

    if (user.settingsData.country && user.settingsData.country !== null) {
      profileData.country = user.profileData.country
    }

    if (user.settingsData.city && user.settingsData.city !== null) {
      profileData.city = user.profileData.city
    }

    if (user.settingsData.company && user.settingsData.company !== null) {
      profileData.company = user.profileData.company
    }

    if (
      user.settingsData.jobPosition &&
      user.settingsData.jobPosition !== null
    ) {
      profileData.jobPosition = user.profileData.jobPosition
    }

    if (user.settingsData.name) {
      profileData.firstName = user.profileData.firstName
      profileData.lastName = user.profileData.lastName
      profileData.fatherName = user.profileData.fatherName
    }

    const teams: { id: number; name: string; role: 0 | 1 | 2 | 3 | 4 | 5 }[] =
      []

    for (let i = 0; i < user.settingsData.teams.length; ++i) {
      const { id, flag } = user.settingsData.teams[i]
      if (flag) {
        const foundTeam = user.profileData.teams.find((el) => el.id === id)
        if (foundTeam) {
          teams.push(foundTeam)
        }
      }
    }

    profileData.teams = teams

    return profileData
  }

  async updateUserProfile(userId: number, profileData: UpdateProfileData) {
    await delay(800)

    const userIndex = mockUsers.findIndex((u) => u.id === userId)
    if (userIndex === -1) throw new Error('User not found')

    const updatedUser = {
      ...mockUsers[userIndex],
      profileData: {
        ...mockUsers[userIndex].profileData,
        ...profileData.profileData,
      },
    }

    mockUsers[userIndex] = updatedUser
    return updatedUser
  }

  async updateUserSettings(userId: number, settingsData: UpdateSettingsData) {
    await delay(800)

    const userIndex = mockUsers.findIndex((u) => u.id === userId)
    if (userIndex === -1) throw new Error('User not found')

    const updatedUser = {
      ...mockUsers[userIndex],
      settingsData: {
        ...mockUsers[userIndex].settingsData,
        ...settingsData.settingsData,
      },
    }

    mockUsers[userIndex] = updatedUser
    return updatedUser
  }

  async deleteMyAccount() {
    await delay(800)
    const userId = parseInt(localStorage.getItem('mock_user_id') || '', 10)
    mockUsers.splice(
      mockUsers.findIndex((el) => el.id === userId),
      1
    )
    return { status: 200, message: '' }
  }

  async logout() {
    localStorage.removeItem('mock_user_id')
  }

  async getShortProjects(): Promise<ProjectMinimal[]> {
    await delay(500)
    const user = await this.getCurrentUser()
    return [...user.projectData]
  }

  async getProject(projectId: number): Promise<Project> {
    await delay(500)

    const project = mockProjects.find((p) => p.id === projectId)

    if (!project) {
      throw new Error('Project not found')
    }

    return structuredClone(project)
  }

  async getProjectUsers(projectId: number): Promise<ProjectUser[]> {
    await delay(300)

    const project = mockProjects.find((p) => p.id === projectId)

    if (!project) {
      throw new Error('Project not found')
    }

    return [...project.users]
  }

  async getRecentTestPlanRuns(projectId: number): Promise<TestPlanRunShort[]> {
    await delay(300)

    const project = mockProjects.find((p) => p.id === projectId)

    if (!project) {
      throw new Error('Project not found')
    }

    return [...project.recentTestPlanRuns]
  }

  async createProject(data: {
    url: string
    description: string
    name: string
  }): Promise<Project> {
    await delay(500)
    const user = await this.getCurrentUser()
    const newProject: Project = {
      id: 100 + Math.floor(100 * Math.random()),
      name: data.name,
      url: data.url,
      description: data.description,
      hasDatapool: false,
      users: [
        {
          id: user.id,
          email: user.profileData.email,
          firstName: user.profileData.firstName,
          lastName: user.profileData.lastName,
          fatherName: user.profileData.fatherName,
          role: 0,
          permissions: '',
        },
      ],
      scripts: [],
      testCases: [],
      testPlans: [],
      recentTestPlanRuns: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      datapool: [],
      createdBy: user.id,
    }

    mockProjects.push(newProject)
    const index = mockUsers.findIndex((u) => u.id === user.id)
    mockUsers[index].projectData.push({
      id: newProject.id,
      name: newProject.name,
      lastUpdated: newProject.updatedAt,
    })
    return newProject
  }

  async updateProject(
    projectId: number,
    updates: Partial<Project>
  ): Promise<Project> {
    await delay(800)

    const projectIndex = mockProjects.findIndex((p) => p.id === projectId)

    if (projectIndex === -1) {
      throw new Error('Project not found')
    }

    const updatedProject = {
      ...mockProjects[projectIndex],
      ...updates,
      updatedAt: new Date(),
    }

    mockProjects[projectIndex] = updatedProject

    return structuredClone(updatedProject)
  }

  async deleteProject(projectId: number): Promise<void> {
    await delay(500)

    const projectIndex = mockProjects.findIndex((p) => p.id === projectId)

    if (projectIndex === -1) {
      throw new Error('Project not found')
    }

    mockProjects.splice(projectIndex, 1)

    mockUsers.forEach((user) => {
      user.projectData = user.projectData.filter(
        (project) => project.id !== projectId
      )
    })

    localStorage.removeItem(`project_${projectId}_datapool`)

    console.log(`Project ${projectId} deleted successfully from mock data`)
  }
  async getHistoryChange(testCaseId: number): Promise<TestCaseHistoryRecord[]> {
    await delay(800)
    return mockProjectsHistory.filter((el) => el.id === testCaseId)
  }

  async getTestCases(id: number): Promise<TestCase[]> {
    const project = await this.getProject(id)
    return mockTestCases.filter((el) =>
      project.testCases.some((testCase) => testCase.id === el.id)
    )
  }

  async getTestCase(projectId: number, testCaseId: number): Promise<TestCase> {
    await delay(500)
    const foundTestCase = mockTestCases.find((el) => el.id === testCaseId)
    if (!foundTestCase) {
      throw new Error('Test case not found')
    }
    return { ...foundTestCase }
  }

  async updateTestCase(
    projectId: number,
    testCaseId: number,
    updates: TestCaseUpdateData
  ): Promise<TestCase> {
    await delay(500)
    const index = mockTestCases.findIndex((el) => el.id === testCaseId)
    if (index === -1) {
      throw new Error('no test-case found')
    }

    const updated = {
      ...mockTestCases[index],
      ...updates,
      lastModified: new Date(),
    }

    mockTestCases[index] = updated

    return structuredClone(updated)
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    await delay(800)

    const userId = parseInt(localStorage.getItem('mock_user_id') || '', 10)

    if (!userId) {
      throw new Error('User not found')
    }

    if (data.oldPassword !== MOCK_PASSWORD) {
      throw new Error('Старый пароль неверен')
    }

    return { success: true }
  }

  async createTestCase(
    projectId: number,
    data: TestCaseFormData
  ): Promise<TestCase> {
    await delay(800)

    const user = await this.getCurrentUser()
    const project = await this.getProject(projectId)

    const newTestCase: TestCase = {
      id: Math.max(...mockTestCases.map((tc) => tc.id)) + 1,
      idt: `TC-${String(Math.max(...mockTestCases.map((tc) => tc.id)) + 1).padStart(3, '0')}`,
      flag: true,
      name: data.name,
      description: data.description || '',
      positive: data.positive,
      version: data.version,
      status: data.status,
      priority: data.priority ?? 1, // По умолчанию Нормальный
      isAutoTest: data.isAutoTest || false,
      isLoadTest: data.isLoadTest || false,
      owner: {
        id: user.id,
        username: user.profileData.username,
        fullName: `${user.profileData.lastName} ${user.profileData.firstName}`,
      },
      project: data.project || project.name,
      scriptIds: [],
      precondition: data.precondition || '',
      relatedTestCases: [],
      tags: data.tags || [],
      steps: data.steps || [],
      testData: data.testData || [],
      attachments: data.attachments || [],
      comments: [],
      usedInTestPlans: false,
      testPlans: [],
      creationDate: new Date(),
      lastModified: new Date(),
    }

    mockTestCases.push(newTestCase)

    const projectIndex = mockProjects.findIndex((p) => p.id === projectId)
    if (projectIndex !== -1) {
      mockProjects[projectIndex].testCases.push({ id: newTestCase.id })
    }

    return structuredClone(newTestCase)
  }

  async searchTestCases(filters: {
    projectId?: number
    status?: number
    priority?: number
    tags?: string[]
    searchText?: string
    isAutoTest?: boolean
    isLoadTest?: boolean
  }): Promise<TestCase[]> {
    await delay(400)

    let filtered = [...mockTestCases]

    if (filters.projectId) {
      const project = mockProjects.find((p) => p.id === filters.projectId)
      if (project) {
        const projectTestCaseIds = new Set(project.testCases.map((tc) => tc.id))
        filtered = filtered.filter((tc) => projectTestCaseIds.has(tc.id))
      }
    }

    if (filters.status !== undefined) {
      filtered = filtered.filter((tc) => tc.status === filters.status)
    }

    if (filters.priority !== undefined) {
      filtered = filtered.filter((tc) => tc.priority === filters.priority)
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(
        (tc) => tc.tags && filters.tags!.some((tag) => tc.tags!.includes(tag))
      )
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(
        (tc) =>
          tc.name.toLowerCase().includes(searchLower) ||
          (tc.description &&
            tc.description.toLowerCase().includes(searchLower)) ||
          (tc.idt && tc.idt.toLowerCase().includes(searchLower)) ||
          (tc.tags &&
            tc.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      )
    }

    if (filters.isAutoTest !== undefined) {
      filtered = filtered.filter((tc) => tc.isAutoTest === filters.isAutoTest)
    }

    if (filters.isLoadTest !== undefined) {
      filtered = filtered.filter((tc) => tc.isLoadTest === filters.isLoadTest)
    }

    return filtered.map((tc) => structuredClone(tc))
  }

  // Метод для получения тест-кейса с полными деталями
  async getTestCaseWithDetails(testCaseId: number): Promise<TestCase> {
    await delay(300)

    const testCase = mockTestCases.find((tc) => tc.id === testCaseId)
    if (!testCase) {
      throw new Error('Test case not found')
    }

    return structuredClone(testCase)
  }

  async deleteTestCases(
    projectId: number,
    testCaseIds: number[]
  ): Promise<void> {
    await delay(500)

    const initialLength = mockTestCases.length
    for (let i = mockTestCases.length - 1; i >= 0; i--) {
      if (testCaseIds.includes(mockTestCases[i].id)) {
        mockTestCases.splice(i, 1)
      }
    }

    if (mockTestCases.length === initialLength) {
      throw new Error('No test cases were deleted')
    }

    const projectIndex = mockProjects.findIndex((p) => p.id === projectId)
    if (projectIndex !== -1) {
      mockProjects[projectIndex].testCases = mockProjects[
        projectIndex
      ].testCases.filter((tc) => !testCaseIds.includes(tc.id))
    }
  }

  async getAllTestPlans(projectId: number): Promise<TestPlan[]> {
    await delay(500)
    return MOCK_TEST_PLANS.filter(
      (plan: TestPlan) => plan.projectId === projectId
    )
  }

  async getTestPlan(projectId: number, testPlanId: number): Promise<TestPlan> {
    await delay(500)
    const plan = MOCK_TEST_PLANS.find(
      (p: TestPlan) => p.id === testPlanId && p.projectId === projectId
    )
    if (!plan) throw new Error('Test plan not found')
    return plan
  }

  async createTestPlan(
    projectId: number,
    data: Omit<TestPlanUpdateData, 'id'>
  ): Promise<TestPlan> {
    await delay(800)
    this.testPlanIdCounter++
    const newPlan: TestPlan = {
      ...data,
      id: this.testPlanIdCounter,
      projectId,
      testCaseCount: data.testCases?.length || 0,
      owner: {
        id: mockUsers[0].id,
        username: mockUsers[0].profileData.username,
      },
      createdAt: new Date(),
      lastRunAt: undefined,
      duration: 0,
      lastRunStatus: 'не_запускался',
      status: data.status || 'active',
      testCases: data.testCases || [],
    } as TestPlan
    MOCK_TEST_PLANS.push(newPlan)
    return newPlan
  }

  async updateTestPlan(
    projectId: number,
    testPlanId: number,
    updates: TestPlanUpdateData
  ): Promise<TestPlan> {
    await delay(800)
    const index = MOCK_TEST_PLANS.findIndex(
      (p: TestPlan) => p.id === testPlanId && p.projectId === projectId
    )
    if (index === -1) throw new Error('Test plan not found')

    const updatedPlan = {
      ...MOCK_TEST_PLANS[index],
      ...updates,
      testCaseCount:
        updates.testCases?.length || MOCK_TEST_PLANS[index].testCaseCount,
    }

    MOCK_TEST_PLANS[index] = updatedPlan
    return updatedPlan
  }

  async deleteTestPlan(projectId: number, testPlanId: number): Promise<void> {
    await delay(500)
    const index = MOCK_TEST_PLANS.findIndex(
      (p: TestPlan) => p.id === testPlanId && p.projectId === projectId
    )
    if (index !== -1) {
      MOCK_TEST_PLANS.splice(index, 1)
    }
  }

  async runTestPlan(
    projectId: number,
    testPlanId: number
  ): Promise<TestPlanRun> {
    await delay(2000)
    const planIndex = MOCK_TEST_PLANS.findIndex(
      (p: TestPlan) => p.id === testPlanId
    )
    const newRun: TestPlanRun = {
      id: Date.now(),
      testPlanId,
      name: MOCK_TEST_PLANS[planIndex].name,
      startedAt: new Date(),
      finishedAt: new Date(Date.now() + 30000),
      status: 'успешно',
      triggeredBy: {
        id: mockUsers[0].id,
        username: mockUsers[0].profileData.username,
      },
      duration: 30000,
      results: [],
    }
    MOCK_TEST_PLAN_RUNS.push(newRun)

    if (planIndex !== -1) {
      MOCK_TEST_PLANS[planIndex] = {
        ...MOCK_TEST_PLANS[planIndex],
        lastRunAt: new Date(),
        lastRunStatus: 'успешно',
      }
    }

    return newRun
  }

  async cloneTestPlan(
    projectId: number,
    testPlanId: number
  ): Promise<TestPlan> {
    await delay(800)
    const original = MOCK_TEST_PLANS.find(
      (p: TestPlan) => p.id === testPlanId && p.projectId === projectId
    )
    if (!original) throw new Error('Test plan not found')

    const versionParts = original.version.split('.')
    if (versionParts.length === 3) {
      versionParts[2] = (parseInt(versionParts[2]) + 1).toString()
    }
    const newVersion = versionParts.join('.')

    this.testPlanIdCounter++

    const clonedPlan: TestPlan = {
      ...original,
      id: this.testPlanIdCounter,
      name: `${original.name} (копия)`,
      version: newVersion,
      createdAt: new Date(),
      lastRunStatus: 'не_запускался',
      lastRunAt: undefined,
    }

    MOCK_TEST_PLANS.push(clonedPlan)
    return clonedPlan
  }

  async getTestPlanRuns(
    projectId: number,
    testPlanId: number
  ): Promise<TestPlanRun[]> {
    await delay(500)
    return MOCK_TEST_PLAN_RUNS.filter(
      (run: TestPlanRun) => run.testPlanId === testPlanId
    )
  }

  async getRecentTestPlanRunsForPlan(
    projectId: number,
    testPlanId: number,
    limit: number = 3
  ): Promise<TestPlanRun[]> {
    await delay(300)
    const allRuns = MOCK_TEST_PLAN_RUNS.filter(
      (run: TestPlanRun) => run.testPlanId === testPlanId
    )
    const sorted = allRuns.sort(
      (a: TestPlanRun, b: TestPlanRun) =>
        b.startedAt.getTime() - a.startedAt.getTime()
    )
    return sorted.slice(0, limit)
  }

  async sendExcelFile(data: FormData) {
    await delay(500)
    console.log(data.get("fileName"))
    console.log(JSON.parse(data.get("columnMap") as string))
    console.log(data.get("file"))
  }

  async getScripts(projectId: number): Promise<Script[]> {
    await delay(500)
    const project = await this.getProject(projectId)
    const projectScriptIds = new Set(project.scripts.map((s) => s.id))
    return mockScripts.filter((script) => projectScriptIds.has(script.id))
  }

  async getScript(projectId: number, scriptId: number): Promise<Script> {
    await delay(300)
    const script = mockScripts.find((s) => s.id === scriptId)
    if (!script) throw new Error('Script not found')
    const project = await this.getProject(projectId)
    if (!project.scripts.some((s) => s.id === scriptId)) {
      throw new Error('Script does not belong to this project')
    }
    return structuredClone(script)
  }

  async createScript(
    projectId: number,
    data: ScriptUpdateData
  ): Promise<Script> {
    await delay(800)
    const user = await this.getCurrentUser()
    const project = await this.getProject(projectId)

    const newId = Math.max(...mockScripts.map((s) => s.id), 0) + 1
    const newScript: Script = {
      id: newId,
      name: data.name || 'Новый скрипт',
      version: data.version || '001.000.000',
      testCaseId: data.testCaseId || 0,
      precondition: data.precondition,
      createdAt: new Date(),
      status: data.status ?? 2,
      owner: { id: user.id, username: user.profileData.username },
      code: data.code || '',
    }
    mockScripts.push(newScript)

    const projectIndex = mockProjects.findIndex((p) => p.id === projectId)
    if (projectIndex !== -1) {
      mockProjects[projectIndex].scripts.push({ id: newId })
    }

    return structuredClone(newScript)
  }

  async updateScript(
    projectId: number,
    scriptId: number,
    updates: ScriptUpdateData
  ): Promise<Script> {
    await delay(500)
    const index = mockScripts.findIndex((s) => s.id === scriptId)
    if (index === -1) throw new Error('Script not found')

    const updated = {
      ...mockScripts[index],
      ...updates,
    }
    mockScripts[index] = updated
    return structuredClone(updated)
  }

  async deleteScript(projectId: number, scriptId: number): Promise<void> {
    await delay(500)
    const scriptIndex = mockScripts.findIndex((s) => s.id === scriptId)
    if (scriptIndex === -1) throw new Error('Script not found')

    mockScripts.splice(scriptIndex, 1)

    for (let i = mockScriptRuns.length - 1; i >= 0; i--) {
      if (mockScriptRuns[i].scriptId === scriptId) {
        mockScriptRuns.splice(i, 1)
      }
    }

    const projectIndex = mockProjects.findIndex((p) => p.id === projectId)
    if (projectIndex !== -1) {
      mockProjects[projectIndex].scripts = mockProjects[
        projectIndex
      ].scripts.filter((s) => s.id !== scriptId)
    }
  }

  async getScriptRuns(
    projectId: number,
    scriptId: number
  ): Promise<ScriptRun[]> {
    await delay(400)
    const runs = mockScriptRuns.filter((run) => run.scriptId === scriptId)
    return runs.map((r) => structuredClone(r))
  }

  async runScript(projectId: number, scriptId: number): Promise<ScriptRun> {
    await delay(2000)
    const user = await this.getCurrentUser()
    const script = await this.getScript(projectId, scriptId)

    const newRunId = Math.max(...mockScriptRuns.map((r) => r.id), 0) + 1
    const startedAt = new Date()
    const finishedAt = new Date(startedAt.getTime() + 30000) // +30 сек
    const duration = 30000
    const statuses: Array<ScriptRun['status']> = ['успешно', 'с_ошибками']
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const newRun: ScriptRun = {
      id: newRunId,
      scriptId,
      startedAt,
      finishedAt,
      status,
      triggeredBy: { id: user.id, username: user.profileData.username },
      duration,
      logs:
        status === 'успешно' ? 'Скрипт выполнен успешно' : 'Ошибка выполнения',
      error: status === 'с_ошибками' ? 'Имитация ошибки' : undefined,
    }

    mockScriptRuns.push(newRun)

    const scriptIndex = mockScripts.findIndex((s) => s.id === scriptId)
    if (scriptIndex !== -1) {
      mockScripts[scriptIndex].lastRunAt = finishedAt
      mockScripts[scriptIndex].lastRunStatus = status
      mockScripts[scriptIndex].duration = duration
    }

    return structuredClone(newRun)
  }

  async archiveScripts(projectId: number, scriptIds: number[]): Promise<void> {
    await delay(500)
    scriptIds.forEach((id) => {
      const script = mockScripts.find((s) => s.id === id)
      if (script) script.status = 0
    })
  }

  async generateAllScripts(
    projectId: number,
    includeNegative: boolean
  ): Promise<void> {
    await delay(1000)
    console.log('Генерация всех скриптов', { projectId, includeNegative })
  }

  async generateNewScripts(
    projectId: number,
    includeNegative: boolean
  ): Promise<void> {
    await delay(800)
    console.log('Генерация новых скриптов', { projectId, includeNegative })
  }

  async refactorAllScripts(projectId: number): Promise<void> {
    await delay(1200)
    console.log('Рефакторинг всех активных скриптов')
  }

  async refactorScript(
    projectId: number,
    scriptIds: number[],
    includeNegative: boolean
  ): Promise<void> {
    await delay(900)
    console.log('Рефакторинг выбранных скриптов', {
      projectId,
      scriptIds,
      includeNegative,
    })
  }
async getPlannerTasks(): Promise<PlannerTask[]> {
  console.log('getPlannerTasks called');
  await delay(500);
  return plannerTasks; 
}

async getPlannerTaskDetails(id: string): Promise<PlannerTask | undefined> {
  console.log('getPlannerTaskDetails called with id:', id);
  await delay(300);
  const found = plannerTasks.find(task => task.id === id);
  console.log('Found task:', found);
  return found;
}
}

export const mockApiService = new MockApiService()
