import { jwtDecode } from "jwt-decode";

export async function isTokenValid(token: string | null): Promise<boolean> {
    if (!token) return false;

    try {
        const decodedToken: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        return decodedToken.exp && decodedToken.exp > currentTime;
    } catch (error) {
        console.error("Invalid token:", error);
        return false;
    }
}
