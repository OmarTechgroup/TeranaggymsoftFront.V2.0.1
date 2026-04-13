import { apiFetch } from "@/lib/api"

export interface LoginResponse {
    token: string
    roles: string
    username: string
}

export const loginService = async (username: string, password: string) => {

    const response = await apiFetch<LoginResponse>("/api/auth/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        }
    )
    return response



}
