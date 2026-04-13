import { apiFetch } from "@/lib/api"

export type UserRole = 'CAISSIER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'

export interface UserDto {
    id: number
    username: string
    phone: string
    role: UserRole
}

export interface CreateUserRequest {
    username: string
    phone: string
    password: string
    role: UserRole
}

export async function getAllUsers(): Promise<UserDto[]> {
    return apiFetch<UserDto[]>("/api/user/all")
}

export async function createUser(data: CreateUserRequest): Promise<UserDto> {
    return apiFetch<UserDto>("/api/user/create", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export async function updateUserRole(id: number, role: UserRole): Promise<UserDto> {
    return apiFetch<UserDto>(`/api/user/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
    })
}

export async function resetUserPassword(id: number, password: string): Promise<void> {
    return apiFetch<void>(`/api/user/${id}/reset-password`, {
        method: "PUT",
        body: JSON.stringify({ password }),
    })
}

export async function deleteUser(id: number): Promise<void> {
    return apiFetch<void>(`/api/user/${id}`, {
        method: "DELETE",
    })
}
