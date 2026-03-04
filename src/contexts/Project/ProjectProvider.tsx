import React, { useCallback, useEffect, useState } from 'react'
import { MOCK_MODE } from '@constants/'
import { ProjectContext } from './ProjectContext'
import { mockApiService } from '../../services/mockApiService'
import { Project, ProjectContextType, ProjectUser, UserRole } from '@interfaces/'
import { useProjectStore } from '../../stores/'
import { projectsApi } from '@api'
import { useUser } from '../User'

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    project,
    setProject,
    updateProject,
    setLoading,
    setError,
    clearProject,
  } = useProjectStore()

  const { refreshUser, user } = useUser()
  const [isInitializing, setIsInitializing] = useState(false)

  const loadProject = useCallback(
    async (projectId: number): Promise<void> => {
      if (isNaN(projectId) || !isFinite(projectId)) {
        setError('некорректное значение id проекта')
        console.error(`некорректное значение id проекта ${projectId}`)
        throw new Error(`некорректное значение id проекта ${projectId}`)
      }
      try {
        setIsInitializing(true)
        setError(null)

        let projectData: Project

        if (MOCK_MODE) {
          projectData = await mockApiService.getProject(projectId)
        } else {
          projectData = await projectsApi.getProject(projectId)
        }

        const date = new Date()
        projectData.updatedAt = date
        updateProject({ updatedAt: date })

        setProject(projectData)
      } catch (error) {
        console.error('Failed to load project:', error)
        setError('Не удалось загрузить данные проекта')
        throw error
      } finally {
        setIsInitializing(false)
      }
    },
    [setIsInitializing, setError, setProject]
  )

  const getRole = useCallback(() => {
    // получить роль текущего пользователя в проекте
    if(!project || !user) return undefined
    return project.users.find(el => el.id === user.id)?.role
  }, [project, user])
  
  const checkAccess = useCallback((acceptedRoles: UserRole[]) => {
    // проверить доступ текущего пользователя
    if(!user || !project) return false
    const role =  getRole()
    return user.isAdmin || project.createdBy === user.id || acceptedRoles.some(el => el === role)
  }, [getRole, user, project])

  const updateProjectData = useCallback(
    async (updates: Partial<Project>): Promise<void> => {
      if (!project) {
        throw new Error('No project loaded')
      }

      try {
        setLoading(true)

        let updatedProject: Project

        if (MOCK_MODE) {
          updatedProject = await mockApiService.updateProject(
            project.id,
            updates
          )
        } else {
          updatedProject = await projectsApi.updateProject(project.id, updates)
        }

        setProject(updatedProject)
      } catch (error) {
        console.error('Failed to update project:', error)
        setError('Не удалось обновить данные проекта')
        throw error
      } finally {
        setLoading(false)
      }
    },
    [project, setLoading, setError, setProject]
  )

  const updateProjectUsers = useCallback(
    async (users: ProjectUser[]): Promise<void> => {
      if (!project) {
        throw new Error('No project loaded')
      }

      try {
        setLoading(true)

        let updatedProject: Project

        if (MOCK_MODE) {
          updatedProject = await mockApiService.updateProject(
            project.id,
            {users: users}
          )
        } else {
          updatedProject = await projectsApi.updateProjectUsers(project.id, users)
        }

        setProject(updatedProject)
      } catch (error) {
        console.error('Failed to update project users:', error)
        setError('Не удалось обновить пользователей проекта')
        throw error
      } finally {
        setLoading(false)
      }
    },
    [project, setLoading, setError, setProject]
  )

  const deleteProjectUsers = useCallback(
    async (ids: number[]): Promise<void> => {
      if (!project) {
        throw new Error('No project loaded')
      }

      try {
        setLoading(true)

        let updatedProject: Project

        if (MOCK_MODE) {
          updatedProject = await mockApiService.updateProject(
            project.id,
            {users: project.users.filter(el => !ids.some(id => id === el.id))}
          )
        } else {
          updatedProject = await projectsApi.deleteProjectUsers(project.id, ids)
        }

        setProject(updatedProject)
      } catch (error) {
        console.error('Failed to delete project users:', error)
        setError('Не удалось удалить пользователей проекта')
        throw error
      } finally {
        setLoading(false)
      }
    },
    [project, setLoading, setError, setProject]
  )

  const clearCurrentProject = useCallback((): void => {
    clearProject()
  }, [clearProject])

  const deleteCurrentProject = useCallback(async () => {
    if (!project) {
      throw new Error('No project loaded')
    }

    try {
      setLoading(true)

      if (MOCK_MODE) {
        await mockApiService.deleteProject(project.id)
      } else {
        await projectsApi.deleteProject(project.id)
      }

      refreshUser()
      clearProject()
    } catch (error) {
      console.error('Failed to delete project:', error)
      setError('Не удалось удалить проект')
      throw error
    } finally {
      setLoading(false)
    }
  }, [project, setError, setLoading, refreshUser, clearProject])

  const clearErrorState = useCallback((): void => {
    setError(null)
  }, [setError])

  const value: ProjectContextType = {
    project: project,
    isLoading: useProjectStore.getState().isLoading,
    error: useProjectStore.getState().error,
    isInitializing,
    loadProject,
    updateProject: updateProjectData,
    clearProject: clearCurrentProject,
    clearError: clearErrorState,
    deleteProject: deleteCurrentProject,
    getRole,
    checkAccess,
    deleteProjectUsers,
    updateProjectUsers
  }

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  )
}
